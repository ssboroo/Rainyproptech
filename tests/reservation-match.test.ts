import test from "node:test";
import assert from "node:assert/strict";
import { reservationMatches } from "../lib/reservation-match";
test("concurrent UUID retries cannot claim a different source, duration, resolution or price reservation", () => {
  const a = {
    kind: "video",
    model: "kling",
    prompt: "Drone",
    source_path: "owner/source.png",
    parent_id: "render-a",
    credits_cost: 69,
    price_quote: {
      apiUsd: 0.56,
      duration: 5,
      resolution: "1080p",
      version: "v2",
    },
  };
  assert.equal(reservationMatches(a, { ...a }), true);
  for (const patch of [
    { source_path: "owner/other.png" },
    { parent_id: "render-b" },
    { credits_cost: 137 },
    { model: "4k" },
    { price_quote: { ...a.price_quote, duration: 10 } },
    { price_quote: { ...a.price_quote, resolution: "4K" } },
    { price_quote: { ...a.price_quote, version: "v3" } },
    { price_quote: { ...a.price_quote, apiUsd: 1.12 } },
  ])
    assert.equal(reservationMatches(a, { ...a, ...patch }), false);
});
