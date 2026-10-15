import test from "node:test";
import assert from "node:assert/strict";
import {
  category,
  cost,
  projects,
  styles,
  promptFor,
  videoPromptFor,
} from "../lib/presets";
import { generationSchema } from "../lib/validation";
import { catalog, buildModelInput } from "../lib/model-router";
const input = {
  id: "12345678-1234-4234-8234-123456789012",
  kind: "image",
  project: "exterior_facade",
  style: "modern_glass",
  motion: "facade_pan",
  source_path: "owner/drawing.png",
};
test("all architectural subtypes map to constrained database categories", () => {
  assert.equal(category("townhouse"), "exterior");
  assert.equal(category("commercial"), "exterior");
  assert.equal(category("master_plan"), "master_plan");
  assert.equal(category("interior"), "interior");
  assert.equal(cost("image"), 2);
  assert.equal(cost("video"), 6);
});
test("all requested projects and styles have bilingual labels and structure direction", () => {
  for (const p of Object.keys(projects) as (keyof typeof projects)[]) {
    assert.ok(projects[p].mn);
    assert.ok(projects[p].en);
    assert.match(
      promptFor(p, "modern_glass"),
      /floor count, window grid, balconies/,
    );
  }
  assert.ok(Object.keys(styles).length >= 30);
  assert.ok(Object.keys(projects).length >= 30);
});
test("API rejects missing sources, invalid presets, mismatched interior styles and arbitrary credit overrides", () => {
  assert.ok(generationSchema.safeParse(input).success);
  for (const patch of [
    { source_path: undefined },
    { project: "unknown" },
    { project: "interior" },
    { kind: "video" },
    { credits: 0 },
  ])
    assert.equal(
      generationSchema.safeParse({ ...input, ...patch }).success,
      false,
    );
});
test("video requires a valid parent render and ignores no ownership checks", () => {
  assert.ok(
    generationSchema.safeParse({ ...input, kind: "video", parent_id: input.id })
      .success,
  );
  assert.equal(
    generationSchema.safeParse({
      ...input,
      kind: "video",
      parent_id: "anything",
    }).success,
    false,
  );
});
test("premium render requests one 4K image without cropping or unsupported CFG controls", () => {
  const v = buildModelInput(
    catalog.find((m) => m.id === "fal-ai/nano-banana-pro/edit")!,
    "https://example.com/source.png",
    "render",
  );
  assert.equal(v.resolution, "4K");
  assert.equal(v.aspect_ratio, "auto");
  assert.deepEqual(v.image_urls, ["https://example.com/source.png"]);
  assert.equal(v.limit_generations, true);
  assert.equal(v.num_images, 1);
  assert.equal("guidance_scale" in v, false);
});
test("camera prompts respect interior and master plan geometry", () => {
  assert.match(videoPromptFor("interior", "drone_orbit"), /No aerial view/);
  assert.match(videoPromptFor("master_plan", "facade_pan"), /bird-eye/);
  assert.match(videoPromptFor("townhouse", "drone_orbit"), /restrained arc/);
  assert.match(promptFor("townhouse", "modern_glass"), /material roughness/);
});

test("Kling request uses documented start image, five seconds and no audio", () => {
  const v = buildModelInput(
    catalog.find((m) => m.id === "fal-ai/kling-video/v3/pro/image-to-video")!,
    "https://example.com/render.png",
    "pan",
  );
  assert.equal(v.duration, "5");
  assert.equal(v.start_image_url, "https://example.com/render.png");
  assert.equal(v.generate_audio, false);
});

test("expanded typologies and interior styles validate and map correctly", () => {
  for (const project of Object.keys(projects) as (keyof typeof projects)[]) {
    const style =
      category(project) === "interior" ? "interior_japandi" : "natural_stone";
    assert.ok(
      generationSchema.safeParse({ ...input, project, style }).success,
      project,
    );
  }
  assert.equal(category("landscape"), "master_plan");
  assert.match(videoPromptFor("bedroom", "drone_orbit"), /No aerial view/);
  assert.match(videoPromptFor("campus_plan", "drone_orbit"), /bird-eye/);
});
