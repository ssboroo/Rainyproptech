import {
  Building2,
  House,
  Hotel,
  Warehouse,
  Factory,
  Store,
  School,
  Hospital,
  Landmark,
  Trees,
  Tent,
  Map,
  Blocks,
  Coffee,
  Sofa,
  BedDouble,
  CookingPot,
  Bath,
  Armchair,
  Columns3,
  Leaf,
  Waves,
  Gem,
  BrickWall,
  TreePine,
  Grid2X2,
  SquareDashed,
  Castle,
  University,
  Dumbbell,
  PanelsTopLeft,
} from "lucide-react";
const icons = {
  building: Building2,
  house: House,
  houses: House,
  tower: Building2,
  hotel: Hotel,
  warehouse: Warehouse,
  factory: Factory,
  store: Store,
  school: School,
  hospital: Hospital,
  landmark: Landmark,
  trees: Trees,
  tent: Tent,
  map: Map,
  blocks: Blocks,
  coffee: Coffee,
  sofa: Sofa,
  bed: BedDouble,
  kitchen: CookingPot,
  bath: Bath,
  desk: Armchair,
  columns: Columns3,
  leaf: Leaf,
  wave: Waves,
  stone: Gem,
  brick: BrickWall,
  wood: TreePine,
  grid: Grid2X2,
  minimal: SquareDashed,
  heritage: Castle,
  cabin: House,
  stadium: Dumbbell,
  glass: PanelsTopLeft,
  concrete: Blocks,
  arch: University,
};
export function ArchitectureIcon({
  name,
  size = 24,
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name as keyof typeof icons] || Building2;
  return <Icon size={size} strokeWidth={1.5} />;
}
// Original vector motifs, not example renders. Each visual describes a material language.
export function StyleDrawing({
  motif,
  color,
}: {
  motif: string;
  color: string;
}) {
  return (
    <svg className="style-drawing" viewBox="0 0 180 94" aria-hidden="true">
      <rect width="180" height="94" fill={color} opacity=".15" />
      <path d="M12 77H168M24 81H155" stroke="currentColor" opacity=".2" />
      <path
        d="M42 74V27L83 14L137 31V74H42Z"
        fill={color}
        opacity=".35"
        stroke="currentColor"
      />
      <path
        d="M42 27L96 40L137 31M96 40V74"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      {["columns", "arch", "heritage"].includes(motif) ? (
        <g stroke="currentColor" fill="none">
          <path d="M51 73V43Q59 29 67 43V73M75 73V48Q83 34 91 48V73M105 73V46Q114 33 123 43V73" />
          <path d="M46 31L92 44M49 36L92 48" />
        </g>
      ) : motif === "leaf" ? (
        <g stroke="currentColor" fill="none">
          <path d="M49 40L90 50M49 50L90 60M102 47L131 40M102 58L131 51" />
          <path
            d="M54 64Q39 36 55 32Q72 40 54 64ZM115 70Q100 46 116 44Q129 51 115 70Z"
            fill={color}
          />
        </g>
      ) : motif === "wave" ? (
        <g stroke="currentColor" fill="none">
          <path d="M48 34Q75 57 92 45M48 44Q75 67 92 55M48 54Q75 77 92 65M103 43Q115 51 132 35M103 54Q115 62 132 46M103 65Q115 73 132 57" />
        </g>
      ) : ["minimal", "stone", "concrete"].includes(motif) ? (
        <g stroke="currentColor" fill="none">
          <path d="M54 73V49L77 55V73M107 51L126 45V60L107 66Z" />
          <path d="M48 37L90 48M103 39L132 33" opacity=".4" />
        </g>
      ) : (
        <g stroke="currentColor" fill="none">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${51 + i * 10} ${34 + i * 2.4}V73M${104 + i * 8} ${40 - i * 1.8}V73`}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M47 ${42 + i * 10}L91 ${53 + i * 5}M102 ${48 + i * 9}L132 ${41 + i * 9}`}
            />
          ))}
        </g>
      )}
      <circle cx="149" cy="61" r="8" fill={color} opacity=".65" />
      <path d="M149 61V77" stroke="currentColor" />
      <path
        d="M28 75V53M24 57L28 53L32 57"
        stroke="currentColor"
        fill="none"
        opacity=".5"
      />
    </svg>
  );
}
