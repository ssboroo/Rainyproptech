import { selectModel } from "./model-router";
import { defaultSettings, type StudioSettings } from "./settings-schema";
import type { Project, Motion } from "./presets";
export function configuredModel(
  s: StudioSettings,
  kind: "image" | "video",
  project: Project,
  motion: Motion,
  mode: "auto" | "quality" | "speed" | "structure",
  manual?: string,
  resolution?: string,
) {
  const override = kind === "image" ? s.defaultImage : s.defaultVideo;
  const baseline =
    kind === "image"
      ? defaultSettings.defaultImage
      : defaultSettings.defaultVideo;
  const result = selectModel(
    kind,
    project,
    motion,
    mode,
    manual || (mode === "auto" && override !== baseline ? override : undefined),
    resolution,
  );
  if (s.disabledModels.includes(result.model.id))
    throw new Error("Энэ загвар түр хаалттай. Өөр загвар сонгоно уу.");
  return result;
}
