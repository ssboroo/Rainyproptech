import test from "node:test";
import assert from "node:assert/strict";
import { promptFor, videoPromptFor } from "../lib/presets";
import { generationSchema } from "../lib/validation";
import { creditPacks, quoteFor } from "../lib/pricing";
import { catalog, buildModelInput } from "../lib/model-router";
import tariffs from "../lib/model-tariffs.json";
test("Mongolia setting guides the scene while reference geometry keeps priority", () => {
  const p = promptFor(
    "exterior_facade",
    "modern_glass",
    "",
    "ulaanbaatar",
    "winter",
  );
  assert.match(p, /Ulaanbaatar, Mongolia/);
  assert.match(p, /physically plausible snow/);
  assert.match(p, /source geometry and site boundaries always take priority/);
  const v = videoPromptFor(
    "master_plan",
    "drone_orbit",
    "",
    "mongolia_steppe",
    "autumn",
  );
  assert.match(v, /Mongolian open steppe/);
  assert.match(v, /Mongolian autumn/);
  const keep = promptFor(
    "townhouse",
    "modern_glass",
    "",
    "source_context",
    "source",
  );
  assert.match(keep, /Preserve the original location/);
  assert.doesNotMatch(keep, /Contemporary Ulaanbaatar/);
  assert.equal(generationSchema.safeParse({ scene: "tokyo" }).success, false);
});
test("packs start at 50,000 MNT with rising credits and a consistent unit price", () => {
  assert.equal(creditPacks[0].priceMnt, 50000);
  assert.equal(creditPacks[0].credits, 500);
  for (let i = 1; i < creditPacks.length; i++)
    assert.ok(creditPacks[i].priceMnt > creditPacks[i - 1].priceMnt);
});
test("every catalog model has sourced tariff evidence; newly priced quality and resolution affect quotes", () => {
  for (const m of catalog) {
    const t = tariffs.models[m.id as keyof typeof tariffs.models];
    assert.ok(t?.rates.length, m.id);
    assert.equal(t.source, m.docs.replace(/\/api$/, ""));
  }
  const m = catalog.find((m) => m.id === "xai/grok-imagine-image/v2.0/edit")!;
  const q = (quality: string, resolution: string) =>
    quoteFor(
      m,
      {
        ...buildModelInput(m, "https://example.com/a.png", "Edit"),
        quality,
        resolution,
      },
      Date.parse("2026-10-15"),
    );
  assert.equal(q("low", "1k").apiUsd, 0.05);
  assert.equal(q("medium", "2k").apiUsd, 0.09);
  assert.throws(() => q("high", "2k"));
});
