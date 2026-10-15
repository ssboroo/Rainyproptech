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
  high_tech: "commercial_tower",
  art_deco: "art_deco",
  classical: "neo_classic_building",
  mediterranean: "mediterranean",
  mongolian_contemporary: "mongolian_contemporary",
  industrial_loft: "exposed_brick",
  exposed_brick: "exposed_brick",
  natural_stone: "hero",
  timber: "timber",
  white_concrete: "minimalist",
  corten: "corten",
  scandinavian: "timber",
  japandi: "minimalist",
  biophilic: "eco_residential",
  tropical: "tropical",
  interior_scandinavian: "interior_modern",
  interior_japandi: "interior_japandi",
  interior_luxury: "interior_classic",
  interior_industrial: "interior_industrial",
  interior_classic: "interior_classic",
  interior_organic: "interior_japandi",
  interior_dark: "interior_dark",
};
const projectImages: Record<Project, string> = {
  exterior_facade: "hero",
  master_plan: "master_plan",
  townhouse: "townhouse",
  commercial: "commercial_tower",
  interior: "interior_modern",
  villa: "minimalist",
  apartment_tower: "commercial_tower",
  low_rise: "modern_glass",
  cabin: "timber",
  ger_resort: "ger_resort",
  mixed_use: "modern_glass",
  retail: "retail",
  hotel: "neo_classic_building",
  restaurant: "retail",
  shopping_mall: "parametric",
  school: "school",
  hospital: "hospital",
  cultural: "brutalist",
  sports: "parametric",
  public_building: "mongolian_contemporary",
  industrial: "warehouse",
  warehouse: "warehouse",
  urban_plan: "master_plan",
  campus_plan: "master_plan",
  landscape: "master_plan",
  living_room: "interior_modern",
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
