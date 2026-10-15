import test from "node:test";
import assert from "node:assert/strict";
import { category, cost, projects, styles, promptFor } from "../lib/presets";
import { generationSchema } from "../lib/validation";
import { imageInput, videoInput } from "../lib/fal";
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
  assert.equal(Object.keys(styles).length, 5);
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
test("image request sends guidance and spatial edge control", () => {
  const v = imageInput("https://example.com/drawing.png", "test");
  assert.equal(v.guidance_scale, 4);
  assert.equal(v.easycontrols[0].image_control_type, "spatial");
  assert.equal(v.easycontrols[0].control_method_url, "canny");
  assert.equal(v.num_images, 1);
});

test("Kling request uses documented start image, five seconds and no audio", () => {
  const v = videoInput("https://example.com/render.png", "pan");
  assert.equal(v.duration, "5");
  assert.equal(v.start_image_url, "https://example.com/render.png");
  assert.equal(v.generate_audio, false);
});
