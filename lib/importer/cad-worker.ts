/// <reference lib="webworker" />
import { Helper } from "dxf";
import { buildInstancedScene, toInstancedGLB } from "openskp";
self.onmessage = ({
  data,
}: MessageEvent<{ buffer: ArrayBuffer; extension: string }>) => {
  try {
    if (data.extension === "skp") {
      const scene = buildInstancedScene(data.buffer, {
        respectEdgeVisibility: true,
      });
      if (!scene.bounds || !scene.meshResources.length)
        throw new Error("EMPTY_MODEL");
      const glb = toInstancedGLB(scene, { textures: true });
      if (glb.byteLength > 100 * 1024 * 1024)
        throw new Error("MODEL_TOO_COMPLEX");
      self.postMessage(
        { type: "glb", buffer: glb.buffer },
        { transfer: [glb.buffer as ArrayBuffer] },
      );
    } else {
      const text = new TextDecoder().decode(data.buffer);
      if (text.startsWith("AutoCAD Binary DXF")) throw new Error("BINARY_DXF");
      const helper = new Helper(text);
      if (!helper.parsed.entities?.length) throw new Error("EMPTY_DRAWING");
      const unsupported = new Set(
        helper.denormalised
          .filter(
            (e) =>
              ![
                "LINE",
                "LWPOLYLINE",
                "POLYLINE",
                "CIRCLE",
                "ARC",
                "ELLIPSE",
                "SPLINE",
                "SOLID",
                "3DFACE",
              ].includes(e.type),
          )
          .map((e) => e.type),
      );
      self.postMessage({
        type: "svg",
        svg: helper.toSVG(),
        warning: [...unsupported].join(", "),
      });
    }
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : "READ_FAILED" });
  }
};
