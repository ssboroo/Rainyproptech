"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RotateCcw, Box, PanelTop, Map } from "lucide-react";
export function ModelView({
  buffer,
  capture,
  onError,
  onReady,
  lang,
}: {
  buffer: ArrayBuffer;
  capture: React.MutableRefObject<null | (() => Promise<Blob>)>;
  onError: (message: string) => void;
  onReady: () => void;
  lang: "mn" | "en";
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef<(name: string) => void>(() => {});
  const [angle, setAngle] = useState("iso");
  const [software, setSoftware] = useState(false);
  useEffect(() => {
    const el = host.current!;
    let stopped = false,
      frame = 0,
      root: THREE.Group | undefined;
    let renderer: THREE.WebGLRenderer | SVGRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      renderer = new SVGRenderer();
      renderer.setQuality("high");
      setSoftware(true);
    }
    const gpu = renderer instanceof THREE.WebGLRenderer;
    if (gpu) renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(new THREE.Color("#f2f3ee"), 1);
    if (gpu) renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64777b, 2.6));
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.position.set(4, 8, 5);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(
      38,
      el.clientWidth / el.clientHeight,
      0.01,
      100000,
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = gpu;
    let radius = 1,
      center = new THREE.Vector3();
    const draw = () => {
      renderer.render(scene, camera);
    };
    view.current = (name) => {
      const direction =
        name === "front"
          ? new THREE.Vector3(0, 0, 1)
          : name === "top"
            ? new THREE.Vector3(0, 1, 0.001)
            : new THREE.Vector3(1, 0.65, 1);
      camera.position
        .copy(center)
        .add(direction.normalize().multiplyScalar(radius * 3.6));
      camera.near = Math.max(radius / 10000, 0.001);
      camera.far = radius * 100;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();
      draw();
    };
    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      "",
      (g) => {
        if (stopped) {
          dispose(g.scene);
          return;
        }
        root = g.scene;
        if (!gpu) {
          let triangles = 0;
          root.traverse((o) => {
            if (o instanceof THREE.Mesh)
              triangles +=
                (o.geometry.index?.count ||
                  o.geometry.attributes.position?.count ||
                  0) / 3;
          });
          if (triangles > 150000) {
            onError("SOFTWARE_LIMIT");
            return;
          }
        }
        scene.add(root);
        const box = new THREE.Box3().setFromObject(root);
        if (box.isEmpty()) {
          onError("EMPTY_MODEL");
          return;
        }
        center = box.getCenter(new THREE.Vector3());
        radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.01);
        view.current("iso");
        capture.current = async () => {
          controls.update();
          const oldWidth = el.clientWidth,
            oldHeight = el.clientHeight;
          const aspect = camera.aspect;
          if (renderer instanceof THREE.WebGLRenderer) {
            const ratio = renderer.getPixelRatio();
            renderer.setPixelRatio(1);
            renderer.setSize(2048, Math.round(2048 / aspect), false);
            draw();
            try {
              return await new Promise<Blob>(
                (resolve, reject) =>
                  renderer.domElement instanceof HTMLCanvasElement &&
                  renderer.domElement.toBlob(
                    (b) =>
                      b ? resolve(b) : reject(new Error("CAPTURE_FAILED")),
                    "image/png",
                  ),
              );
            } finally {
              renderer.setPixelRatio(ratio);
              renderer.setSize(oldWidth, oldHeight, false);
              draw();
            }
          }
          renderer.setSize(2048, Math.round(2048 / aspect));
          draw();
          const url = URL.createObjectURL(
            new Blob(
              [new XMLSerializer().serializeToString(renderer.domElement)],
              { type: "image/svg+xml" },
            ),
          );
          try {
            const image = new Image();
            image.src = url;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = 2048;
            canvas.height = Math.round(2048 / aspect);
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "#f2f3ee";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);
            return await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("CAPTURE_FAILED"))),
                "image/png",
              ),
            );
          } finally {
            URL.revokeObjectURL(url);
            renderer.setSize(oldWidth, oldHeight);
            draw();
          }
        };
        onReady();
      },
      () => onError("MODEL_READ_FAILED"),
    );
    const observer = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      draw();
    });
    observer.observe(el);
    const animate = () => {
      if (stopped) return;
      controls.update();
      draw();
      frame = requestAnimationFrame(animate);
    };
    if (gpu) animate();
    else controls.addEventListener("change", draw);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      capture.current = null;
      if (root) dispose(root);
      if (renderer instanceof THREE.WebGLRenderer) renderer.dispose();
      renderer.domElement.remove();
    };
  }, [buffer, capture, onError, onReady]);
  return (
    <>
      <div
        className="model-viewport"
        ref={host}
        aria-label="3D model preview: drag to orbit, scroll to zoom"
      />
      {software && (
        <span className="software-preview">
          {lang === "mn"
            ? "Нөөц 3D харагдац · Материалын өнгө"
            : "Software 3D preview · Material colors"}
        </span>
      )}
      <div className="model-angles">
        {[
          ["iso", "3D", Box],
          ["front", "Front", PanelTop],
          ["top", "Top", Map],
        ].map(([key, label, Icon]) => {
          const I = Icon as typeof Box;
          return (
            <button
              key={key as string}
              aria-pressed={angle === key}
              onClick={() => {
                setAngle(key as string);
                view.current(key as string);
              }}
            >
              <I size={15} />
              {label as string}
            </button>
          );
        })}
        <button
          aria-label="Reset view"
          onClick={() => {
            setAngle("iso");
            view.current("iso");
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </>
  );
}
function dispose(root: THREE.Object3D) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        for (const value of Object.values(m))
          if (value instanceof THREE.Texture) value.dispose();
        m.dispose();
      }
    }
  });
}
