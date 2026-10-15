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
        /^on/i.test(a.name) ||
        (/href/i.test(a.name) && !/^#[\w:.-]+$/.test(a.value)) ||
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
  root.setAttribute("width", "2048");
  root.setAttribute("height", "1536");
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(root);
}
