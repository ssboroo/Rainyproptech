import Ajv from "ajv";
import snapshot from "./model-catalog.json";
import type { Project, Motion } from "./presets";
export type RoutingMode = "auto" | "quality" | "speed" | "structure";
export type ModelDescriptor = {
  id: string;
  name: string;
  kind: "image" | "video";
  sourceField: string;
  schema: Record<string, unknown>;
  docs: string;
  tags: string[];
  date?: string | null;
};
export const catalog = snapshot.models as ModelDescriptor[];
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
const validators = new Map<string, ReturnType<typeof ajv.compile>>();
export function selectModel(
  kind: "image" | "video",
  project: Project,
  motion: Motion,
  mode: RoutingMode = "auto",
  manual?: string,
) {
  if (manual) {
    const found = catalog.find((m) => m.id === manual && m.kind === kind);
    if (!found)
      throw new Error("Selected model is not in the compatible catalog");
    return { model: found, reason: "manual" };
  }
  let preferences: string[];
  if (kind === "image") {
    preferences =
      mode === "speed"
        ? ["fal-ai/nano-banana-2/edit", "fal-ai/flux-2/flash/edit"]
        : mode === "structure"
          ? ["fal-ai/flux-pro/kontext/max", "fal-ai/flux-pro/kontext"]
          : project === "interior"
            ? ["bytedance/seedream/v5/pro/edit", "fal-ai/nano-banana-pro/edit"]
            : [
                "fal-ai/nano-banana-pro/edit",
                "google/nano-banana-2.1/edit",
                "fal-ai/flux-2-pro/edit",
              ];
  } else {
    preferences =
      mode === "speed"
        ? [
            "fal-ai/kling-video/v3/turbo/pro/image-to-video",
            "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
          ]
        : motion === "drone_orbit"
          ? [
              "fal-ai/kling-video/o3/pro/image-to-video",
              "fal-ai/kling-video/v3/pro/image-to-video",
            ]
          : [
              "fal-ai/kling-video/v3/pro/image-to-video",
              "bytedance/seedance-2.5/image-to-video",
            ];
  }
  const model =
    preferences
      .map((id) => catalog.find((m) => m.id === id && m.kind === kind))
      .find(Boolean) ||
    catalog.find(
      (m) =>
        m.kind === kind && /nano-banana-pro|kling-video\/v3\/pro/.test(m.id),
    );
  if (!model) throw new Error("No compatible model for this job");
  return {
    model,
    reason: `${mode}:${project}:${kind === "video" ? motion : "reference-render"}`,
  };
}
type Property = {
  type?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  items?: Property;
};
export function buildModelInput(
  model: ModelDescriptor,
  source: string,
  prompt: string,
  mode: RoutingMode = "auto",
) {
  const schema = model.schema as {
    properties?: Record<string, Property>;
    required?: string[];
  };
  const props = schema.properties || {};
  const body: Record<string, unknown> = {};
  for (const field of schema.required || []) {
    const p = props[field];
    if (p && p.default !== undefined) body[field] = p.default;
    else if (p?.enum?.length) body[field] = p.enum[0];
  }
  body[model.sourceField] =
    props[model.sourceField]?.type === "array" ? [source] : source;
  if (props.prompt) body.prompt = prompt;
  const pick = (field: string, choices: unknown[]) => {
    const p = props[field];
    if (!p) return;
    const value = p.enum ? choices.find((c) => p.enum!.includes(c)) : undefined;
    if (value !== undefined) body[field] = value;
  };
  pick(
    "resolution",
    model.kind === "image"
      ? mode === "speed"
        ? ["2K", "1K"]
        : ["4K", "2K", "1K"]
      : ["1080p", "1080", "720p"],
  );
  pick("aspect_ratio", ["auto"]);
  if (props.duration) {
    const p = props.duration;
    const choices =
      p.type === "integer" || p.type === "number"
        ? [5, 4, 6, 3]
        : ["5", "5s", "4", "4s", "6", "6s"];
    const v = p.enum ? choices.find((c) => p.enum!.includes(c)) : choices[0];
    if (v !== undefined) body.duration = v;
  }
  if (props.num_images) body.num_images = 1;
  if (props.num_outputs) body.num_outputs = 1;
  if (props.limit_generations) body.limit_generations = true;
  if (props.generate_audio) body.generate_audio = false;
  if (props.enable_safety_checker) body.enable_safety_checker = true;
  if (props.enable_web_search) body.enable_web_search = false;
  pick("output_format", ["png", "jpeg", "webp"]);
  if (props.negative_prompt)
    body.negative_prompt =
      "warped geometry, changing window count, bending walls, flicker, camera shake, jump cuts, cartoon, plastic surfaces";
  let validate = validators.get(model.id);
  if (!validate) {
    validate = ajv.compile(model.schema);
    validators.set(model.id, validate);
  }
  if (!validate(body))
    throw new Error(
      "Model input is incompatible: " +
        ajv.errorsText(validate.errors, { separator: "; " }),
    );
  return body;
}
export function extractOutput(data: unknown, kind: "image" | "video") {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const asUrl = (x: unknown): string | null =>
    typeof x === "string"
      ? x
      : x &&
          typeof x === "object" &&
          typeof (x as { url?: unknown }).url === "string"
        ? (x as { url: string }).url
        : null;
  const list = kind === "image" ? d.images : d.videos;
  return (
    asUrl(kind === "image" ? d.image : d.video) ||
    (Array.isArray(list) ? asUrl(list[0]) : null) ||
    asUrl(d.output) ||
    asUrl(d.result)
  );
}
export const catalogUpdatedAt = snapshot.syncedAt;
