import type { Project, Style } from "./presets";
// Original AI concept photography. These are inspiration assets, never user generation records.
const styleImages: Record<Style, string> = {
  modern_glass: "modern_glass",
  neo_classic_building: "neo_classic_building",
  eco_residential: "eco_residential",
  commercial_tower: "commercial_tower",
  interior_modern: "interior_modern",
  minimalist: "minimalist",
  brutalist: "brutalist",
  parametric: "parametric",
  high_tech: "high_tech",
  art_deco: "art_deco",
  classical: "classical",
  mediterranean: "mediterranean",
  mongolian_contemporary: "mongolian_contemporary",
  industrial_loft: "industrial_loft",
  exposed_brick: "exposed_brick",
  natural_stone: "natural_stone",
  timber: "timber",
  white_concrete: "white_concrete",
  corten: "corten",
  scandinavian: "scandinavian",
  japandi: "japandi",
  biophilic: "biophilic",
  tropical: "tropical",
  interior_scandinavian: "interior_scandinavian",
  interior_japandi: "interior_japandi",
  interior_luxury: "interior_luxury",
  interior_industrial: "interior_industrial",
  interior_classic: "interior_classic",
  interior_organic: "interior_organic",
  interior_dark: "interior_dark",
};
const projectImages: Record<Project, string> = {
  exterior_facade: "hero",
  master_plan: "master_plan",
  townhouse: "townhouse",
  commercial: "commercial_tower",
  interior: "interior_modern",
  villa: "minimalist",
  apartment_tower: "apartment_tower",
  low_rise: "low_rise",
  cabin: "timber",
  ger_resort: "ger_resort",
  mixed_use: "mixed_use",
  retail: "retail",
  hotel: "neo_classic_building",
  restaurant: "restaurant",
  shopping_mall: "shopping_mall",
  school: "school",
  hospital: "hospital",
  cultural: "brutalist",
  sports: "sports",
  public_building: "mongolian_contemporary",
  industrial: "industrial",
  warehouse: "warehouse",
  urban_plan: "urban_plan",
  campus_plan: "campus_plan",
  landscape: "landscape",
  living_room: "living_room",
  bedroom: "bedroom",
  kitchen: "kitchen",
  office_interior: "interior_industrial",
  lobby: "interior_classic",
  bathroom: "bathroom",
};
export function visualFor(
  kind: "project" | "style",
  key: string,
  large = false,
) {
  const asset =
    kind === "project"
      ? projectImages[key as Project]
      : styleImages[key as Style];
  return `/visuals/${asset || "hero"}${large ? "" : "-thumb"}.webp`;
}
export const heroVisual = "/visuals/hero.webp";
