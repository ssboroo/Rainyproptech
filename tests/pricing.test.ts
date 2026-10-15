import test from "node:test";
import assert from "node:assert/strict";
import {
  retailCredits,
  quoteFor,
  hasReviewedPrice,
  pricingPolicy,
  creditPacks,
} from "../lib/pricing";
import { catalog, buildModelInput, selectModel } from "../lib/model-router";
const now = Date.parse("2026-10-15T12:00:00Z");
const quote = (id: string, mode: "auto" | "speed" = "auto") => {
  const model = catalog.find((m) => m.id === id)!;
  return quoteFor(
    model,
    buildModelInput(model, "https://example.com/source.png", "Render", mode),
    now,
  );
};
test("200% markup survives rounding and the planned 3% payment fee", () => {
  for (const api of [
    0.001, 0.039, 0.08, 0.12, 0.135, 0.3, 0.56, 0.7, 2.1, 5.82,
  ]) {
    const sales = retailCredits(api) * 100,
      basis = api * 3700 * 1.05 + 50;
    assert.ok(sales * 0.97 >= basis * 3 - 1e-8);
    assert.ok((sales - 100) * 0.97 < basis * 3);
  }
  assert.throws(() => retailCredits(NaN));
  assert.throws(() => retailCredits(0));
  for (const p of creditPacks) assert.equal(p.priceMnt / p.credits, 100);
});
test("actual image resolution and video duration determine price", () => {
  assert.equal(quote("fal-ai/nano-banana-pro/edit").apiUsd, 0.3);
  assert.equal(quote("fal-ai/nano-banana-pro/edit").credits, 38);
  assert.equal(quote("fal-ai/nano-banana-2/edit", "speed").apiUsd, 0.12);
  assert.equal(quote("bytedance/seedream/v5/pro/edit").apiUsd, 0.135);
  assert.equal(
    quote("fal-ai/bytedance/seedream/v4.5/edit").resolution,
    "model native",
  );
  const v = quote("fal-ai/kling-video/v3/pro/image-to-video");
  assert.equal(v.apiUsd, 0.56);
  assert.equal(v.credits, 69);
  assert.equal(v.duration, 5);
  assert.equal(quote("fal-ai/kling-video/v3/4k/image-to-video").apiUsd, 2.1);
});
test("every enabled model resolves to a reviewed quote; all routing defaults remain priced", () => {
  for (const m of catalog.filter((m) => hasReviewedPrice(m.id))) {
    for (const mode of ["auto", "speed"] as const) {
      const q = quote(m.id, mode);
      assert.ok(q.credits > 0, m.id);
    }
  }
  for (const kind of ["image", "video"] as const)
    for (const project of [
      "interior",
      "exterior_facade",
      "master_plan",
    ] as const)
      for (const mode of ["auto", "speed", "quality", "structure"] as const)
        for (const motion of [
          "drone_pull_back",
          "drone_orbit",
          "facade_pan",
        ] as const)
          assert.ok(
            hasReviewedPrice(selectModel(kind, project, motion, mode).model.id),
          );
});
test("unknown variable costs, expired prices and unpriced add-ons fail before charging", () => {
  const m = catalog[0],
    input = buildModelInput(m, "https://example.com/source.png", "Render");
  assert.throws(
    () => quoteFor({ ...m, id: "unknown" }, input, now),
    /review pending/,
  );
  assert.throws(
    () => quoteFor(m, input, Date.parse(pricingPolicy.validUntil)),
    /review required/,
  );
  assert.throws(
    () => quoteFor(m, { ...input, generate_audio: true }, now),
    /add-on/,
  );
  assert.throws(
    () => quoteFor(m, { ...input, num_images: 4 }, now),
    /one output/,
  );
  assert.throws(
    () => quoteFor(m, { ...input, image_urls: ["a", "b"] }, now),
    /one reference/,
  );
  assert.throws(
    () => quoteFor(m, { ...input, resolution: "8K" }, now),
    /resolution/,
  );
});

test("selected duration and native 4K are the exact submitted and charged configuration", () => {
  const selection = selectModel(
    "video",
    "exterior_facade",
    "drone_pull_back",
    "quality",
    undefined,
    "4K",
  );
  assert.equal(selection.model.id, "fal-ai/kling-video/v3/4k/image-to-video");
  const input = buildModelInput(
    selection.model,
    "https://example.com/reference.png",
    "Drone",
    "quality",
    { duration: 10, resolution: "4K" },
  );
  assert.equal(input.duration, "10");
  assert.equal(input.generate_audio, false);
  const q = quoteFor(selection.model, input, now);
  assert.equal(q.apiUsd, 4.2);
  assert.equal(q.resolution, "4K");
  assert.equal(q.credits, 507);
  const pro = catalog.find(
    (m) => m.id === "fal-ai/kling-video/v3/pro/image-to-video",
  )!;
  assert.throws(
    () =>
      buildModelInput(pro, "https://example.com/r.png", "Drone", "quality", {
        duration: 30,
        resolution: "1080p",
      }),
    /duration/,
  );
  assert.throws(
    () =>
      buildModelInput(pro, "https://example.com/r.png", "Drone", "quality", {
        duration: 10,
        resolution: "4K",
      }),
    /resolution/,
  );
  const p = quoteFor(
    pro,
    buildModelInput(pro, "https://example.com/r.png", "Drone", "quality", {
      duration: 10,
      resolution: "1080p",
    }),
    now,
  );
  assert.equal(p.apiUsd, 1.12);
  assert.equal(p.credits, 137);
});

test("metered audio switches cannot escape the silent video tariff", () => {
  const m = catalog.find((m) => m.id === "fal-ai/pixverse/v6/image-to-video")!;
  const input = buildModelInput(m, "https://example.com/source.png", "Drone");
  assert.equal(input.generate_audio_switch, false);
  assert.equal(quoteFor(m, input, now).apiUsd, 0.45);
  assert.throws(
    () => quoteFor(m, { ...input, generate_audio_switch: true }, now),
    /add-on/,
  );
});
