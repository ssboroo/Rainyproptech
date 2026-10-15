import type { ModelDescriptor } from "./model-router";
export type VideoSettings = { duration?: number; resolution?: string };
export function nativeResolution(id: string) {
  if (id.includes("/4k/")) return "4K";
  if (id.includes("kling-video/"))
    return id.includes("/standard/") ? "720p" : "1080p";
  return "native";
}
export function videoOptions(model: ModelDescriptor) {
  const props =
    (
      model.schema as {
        properties?: Record<
          string,
          {
            type?: string;
            enum?: unknown[];
            minimum?: number;
            maximum?: number;
            default?: unknown;
          }
        >;
      }
    ).properties || {};
  const d = props.duration;
  const durations = d?.enum
    ? d.enum
        .map((v) => Number(String(v).replace(/s$/, "")))
        .filter((v) => Number.isInteger(v) && v >= 1 && v <= 30)
    : d && (d.type === "integer" || d.type === "number")
      ? Array.from({ length: 30 }, (_, i) => i + 1).filter(
          (v) =>
            v >= Math.ceil(d.minimum ?? 1) && v <= Math.floor(d.maximum ?? 30),
        )
      : [];
  const resolutions = props.resolution?.enum?.map(String) || [
    nativeResolution(model.id),
  ];
  return {
    durations,
    resolutions,
    fixedDuration: !d,
    defaultResolution: String(
      props.resolution?.default || nativeResolution(model.id),
    ),
  };
}
