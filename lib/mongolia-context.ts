export const scenes = {
  ulaanbaatar: {
    mn: "Улаанбаатар",
    en: "Ulaanbaatar",
    prompt:
      "Contemporary Ulaanbaatar, Mongolia: a credible cold-climate urban setting, realistic residential streets and restrained landscaping suited to a dry continental climate. Avoid generic foreign-city skylines. Do not invent exact landmarks, plot coordinates or recognizable streets not present in the reference.",
  },
  mongolia_steppe: {
    mn: "Монголын тал нутаг",
    en: "Mongolian steppe",
    prompt:
      "Mongolian open steppe: expansive grassland, dry continental light and an authentic low-density landscape. No tropical vegetation, oceanfront setting or invented urban towers.",
  },
  mongolia_countryside: {
    mn: "Монголын хөдөө / Амралт",
    en: "Mongolian countryside",
    prompt:
      "A credible Mongolian countryside retreat, open valleys, sparse native vegetation and construction appropriate to a cold continental climate. Preserve the supplied terrain and architecture.",
  },
  source_context: {
    mn: "Эх зургийн орчин",
    en: "Keep reference setting",
    prompt:
      "Preserve the original location, landscape and climate shown in the source. Do not relocate the project or invent a Mongolian landmark.",
  },
} as const;
export type Scene = keyof typeof scenes;
export const seasons = {
  source: ["Эх зургийн улирал", "Reference season"],
  summer: ["Зун", "Summer"],
  autumn: ["Намар", "Autumn"],
  winter: ["Өвөл", "Winter"],
  spring: ["Хавар", "Spring"],
} as const;
export type Season = keyof typeof seasons;
export function mongoliaContext(
  scene: Scene = "ulaanbaatar",
  season: Season = "summer",
) {
  const weather = {
    source: "Preserve the source season and weather.",
    summer:
      "Mongolian summer: natural grass, restrained local planting and clear continental daylight.",
    autumn:
      "Mongolian autumn: subdued gold native foliage, dry grasses and crisp clear light.",
    winter:
      "Mongolian winter: physically plausible snow cover and low winter sunlight; keep windows, balconies, access paths and structural details readable.",
    spring:
      "Mongolian spring: dry ground, restrained early vegetation and clear continental daylight.",
  }[season];
  return `SETTING: ${scenes[scene].prompt} ${weather} The source geometry and site boundaries always take priority. Adapt only plausible surroundings, materials and lighting; do not add floors, balconies or culturally stereotyped decorative structures. If incidental people appear, depict a natural contemporary Mongolian context without altering any existing face or identity. Avoid invented readable signage, gibberish Cyrillic, tropical palms and generic pagodas. This is an architectural concept visualization, not proof of an actual constructed project.`;
}
