export const projects = {
  exterior_facade: {
    mn: "Барилгын фасад",
    en: "Building facade",
    prompt:
      "Modern apartment building exterior facade, glass balconies, aluminum composite panels, evening warm lighting",
  },
  master_plan: {
    mn: "Хотхоны ерөнхий төлөвлөгөө",
    en: "Master plan",
    prompt:
      "Real estate master plan bird-eye view, modern residential complex with landscaped courtyards, green parks, playgrounds, parking lots",
  },
  townhouse: {
    mn: "Таунхаус",
    en: "Townhouse",
    prompt:
      "Luxury suburban townhouse exterior, landscaped front yard, modern minimalist architecture, warm sunset lighting",
  },
  commercial: {
    mn: "Бизнес төв",
    en: "Commercial",
    prompt:
      "Commercial office building glass tower, modern urban plaza, pedestrian walk, daytime architectural photography",
  },
  interior: {
    mn: "Интерьер",
    en: "Interior",
    prompt:
      "Photorealistic interior architectural visualization, preserve room layout, walls, windows and doors",
  },
} as const;
export const styles = {
  modern_glass: {
    mn: "Модерн шилэн фасад",
    en: "Modern glass",
    color: "#789f9e",
    prompt:
      "Contemporary high-rise residential building exterior facade, floor-to-ceiling glass windows, dark metal frames, white concrete panels, lush landscaping around the building, blue sky with soft clouds, high-end architectural photography, physically plausible natural materials and lighting.",
  },
  neo_classic_building: {
    mn: "Нео-классик орон сууц",
    en: "Neo-classical",
    color: "#b7a18c",
    prompt:
      "Luxury neo-classical apartment building exterior, symmetrical facade, stone cladding, decorative columns, arched windows, elegant entrance, warm architectural lighting at dusk, photorealistic architectural photography.",
  },
  eco_residential: {
    mn: "Эко хотхон / Ногоон орчин",
    en: "Eco residential",
    color: "#829d76",
    prompt:
      "Eco-friendly residential complex exterior, wooden facade elements, vertical gardens, large balconies with plants, sunny bright day, professional architectural visualization, photorealistic architectural photography.",
  },
  commercial_tower: {
    mn: "Коммершиал / Бизнес төв",
    en: "Commercial tower",
    color: "#738ca6",
    prompt:
      "Futuristic commercial skyscraper exterior, sleek steel and reflective tinted glass, dynamic architectural geometry, urban street level view, cinematic lighting, photorealistic architectural photography.",
  },
  interior_modern: {
    mn: "Дулаан минимал интерьер",
    en: "Warm minimal interior",
    color: "#b0a18c",
    prompt:
      "Warm minimalist interior, natural oak, soft neutral textiles, realistic daylight, high-end architectural photography.",
  },
} as const;
export const motions = {
  drone_pull_back: {
    mn: "Дрон дээшлэх / Ухрах",
    en: "Pull back & elevate",
    prompt:
      "Cinematic drone aerial shot, smooth pull back and elevate away from the modern building facade revealing the surrounding landscaped master plan, ultra-stable real estate commercial video.",
  },
  drone_orbit: {
    mn: "Тойрог дрон тусгал",
    en: "Drone orbit",
    prompt:
      "Smooth drone orbit around the exterior of the luxury apartment building, golden hour sunlight, realistic glass reflections, cinematic real estate showcase video. Keep a restrained arc within the short clip; do not invent hidden facades.",
  },
  facade_pan: {
    mn: "Фасад дээгүүр хөвөх",
    en: "Facade tracking",
    prompt:
      "Smooth cinematic tracking shot gliding horizontally across the modern architectural facade, revealing balconies and structural details, high-end real estate presentation video.",
  },
} as const;
export type Project = keyof typeof projects;
export type Style = keyof typeof styles;
export type Motion = keyof typeof motions;
export function category(p: Project) {
  return p === "interior"
    ? "interior"
    : p === "master_plan"
      ? "master_plan"
      : "exterior";
}
export function cost(kind: "image" | "video") {
  return kind === "video" ? 6 : 2;
}
export function promptFor(p: Project, s: Style, notes = "") {
  return [
    projects[p].prompt,
    styles[s].prompt,
    "PRIORITY: preserve original building massing, floor count, window grid, balconies, roof silhouette, site boundaries and camera perspective. Straight verticals, consistent geometry, realistic materials. Do not add or remove buildings.",
    "Create a finished professional architectural photograph from the supplied source, not a stylized illustration. Physically plausible global illumination, natural exposure, accurate material roughness, realistic glass reflections, subtle surface texture, contact shadows, restrained landscaping, straight verticals. No text, watermarks, collage, plastic surfaces or exaggerated HDR. The source drawing governs geometry; user styling instructions must not override its structure.",
    notes,
  ].join("\n");
}

export function videoPromptFor(project: Project, motion: Motion, notes = "") {
  const context =
    project === "interior"
      ? "Stay inside the source room. Slow stabilized interior walkthrough, a subtle forward dolly or lateral slide, respecting walls and the source layout. No aerial view."
      : project === "master_plan"
        ? "Maintain a high aerial bird-eye perspective and the original site layout. Slow restrained flyover, preserving all building positions, paths, landscaping and site boundaries."
        : motions[motion].prompt;
  return [
    context,
    "One continuous five-second shot with gentle constant-speed camera movement. Maintain the source building identity, floor count, window grid, balconies, materials, time of day and lighting throughout. Physically plausible parallax, natural exposure, stable reflections and crisp architectural detail. No cuts, geometry morphing, added buildings or sudden weather changes. Do not reveal large unseen surfaces.",
    notes,
  ].join("\n");
}
