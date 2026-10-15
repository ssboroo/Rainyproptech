"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RotateCcw, Box, PanelTop, Map } from "lucide-react";
export function ModelView({
  buffer,
  capture,
  onError,
}: {
  buffer: ArrayBuffer;
  capture: React.MutableRefObject<null | (() => Promise<Blob>)>;
  onError: (message: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef<(name: string) => void>(() => {});
  const [angle, setAngle] = useState("iso");
  useEffect(() => {
    const el = host.current!;
    let stopped = false,
      frame = 0,
      root: THREE.Group | undefined;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      onError("WEBGL_UNAVAILABLE");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor("#f2f3ee");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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
    controls.enableDamping = true;
    let radius = 1,
      center = new THREE.Vector3();
    const draw = () => {
      controls.update();
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
          const oldSize = renderer.getSize(new THREE.Vector2());
          const ratio = renderer.getPixelRatio();
          const aspect = camera.aspect;
          renderer.setPixelRatio(1);
          renderer.setSize(2048, Math.round(2048 / aspect), false);
          draw();
          try {
            return await new Promise<Blob>((resolve, reject) =>
              renderer.domElement.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("CAPTURE_FAILED"))),
                "image/png",
              ),
            );
          } finally {
            renderer.setPixelRatio(ratio);
            renderer.setSize(oldSize.x, oldSize.y, false);
            draw();
          }
        };
      },
      () => onError("MODEL_READ_FAILED"),
    );
    const observer = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    observer.observe(el);
    const animate = () => {
      if (stopped) return;
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      capture.current = null;
      if (root) dispose(root);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [buffer, capture, onError]);
  return (
    <>
      <div
        className="model-viewport"
        ref={host}
        aria-label="3D model preview: drag to orbit, scroll to zoom"
      />
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
