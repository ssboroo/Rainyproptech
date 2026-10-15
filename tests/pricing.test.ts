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
test("70% markup survives rounding and the planned 3% payment fee", () => {
  for (const api of [
    0.001, 0.039, 0.08, 0.12, 0.135, 0.3, 0.56, 0.7, 2.1, 5.82,
  ]) {
    const sales = retailCredits(api) * 100,
      basis = api * 3600 + 50;
    assert.ok(sales * 0.97 >= basis * 1.7 - 1e-8);
    assert.ok((sales - 100) * 0.97 < basis * 1.7);
  }
  assert.throws(() => retailCredits(NaN));
  assert.throws(() => retailCredits(0));
  for (const p of creditPacks) assert.equal(p.priceMnt / p.credits, 100);
});
test("actual image resolution and video duration determine price", () => {
  assert.equal(quote("fal-ai/nano-banana-pro/edit").apiUsd, 0.3);
  assert.equal(quote("fal-ai/nano-banana-pro/edit").credits, 20);
  assert.equal(quote("fal-ai/nano-banana-2/edit", "speed").apiUsd, 0.12);
  assert.equal(quote("bytedance/seedream/v5/pro/edit").apiUsd, 0.135);
  const v = quote("fal-ai/kling-video/v3/pro/image-to-video");
  assert.equal(v.apiUsd, 0.56);
  assert.equal(v.credits, 37);
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
