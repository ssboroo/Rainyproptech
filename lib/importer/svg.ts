// Used only as an image source, never injected into the document.
export function cleanCadSvg(svg: string): string {
  if (svg.length > 20 * 1024 * 1024 || /NaN|Infinity/.test(svg))
    throw new Error("INVALID_SVG");
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (
    doc.querySelector("parsererror") ||
    doc.documentElement.localName !== "svg"
  )
    throw new Error("INVALID_SVG");
  const allowed = new Set([
    "svg",
    "g",
    "path",
    "line",
    "polyline",
    "polygon",
    "rect",
    "circle",
    "ellipse",
    "text",
    "tspan",
    "defs",
    "clipPath",
    "use",
  ]);
  for (const el of Array.from(doc.querySelectorAll("*"))) {
    if (!allowed.has(el.localName)) {
      el.remove();
      continue;
    }
    for (const a of Array.from(el.attributes)) {
      if (
        a.name === "stroke" &&
        /^(white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i.test(
          a.value,
        )
      )
        el.setAttribute("stroke", "#24373d");
      if (
        /^on/i.test(a.name) ||
        (/href/i.test(a.name) && !/^#[^\s<>"']+$/.test(a.value)) ||
        (/url\s*\(|javascript:|data:|https?:/i.test(a.value) &&
          a.name !== "xmlns")
      )
        el.removeAttribute(a.name);
    }
  }
  const root = doc.documentElement;
  const view = root.getAttribute("viewBox")?.split(/[ ,]+/).map(Number);
  if (
    !view ||
    view.length !== 4 ||
    !view.every(Number.isFinite) ||
    view[2] <= 0 ||
    view[3] <= 0
  )
    throw new Error("EMPTY_DRAWING");
  const pad = Math.max(view[2], view[3]) * 0.04;
  root.setAttribute(
    "viewBox",
    [view[0] - pad, view[1] - pad, view[2] + pad * 2, view[3] + pad * 2].join(
      " ",
    ),
  );
  root.setAttribute("width", "2048");
  root.setAttribute("height", "1536");
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(root);
}
