import test from "node:test";
import assert from "node:assert/strict";
import { catalog, buildModelInput } from "../lib/model-router";
import { videoOptions } from "../lib/video-options";
import { hasReviewedPrice, quoteFor } from "../lib/pricing";
test("all video adapters expose schema-derived settings; every priced setting validates and quotes", () => {
  let configurations = 0;
  for (const m of catalog.filter((m) => m.kind === "video")) {
    const opts = videoOptions(m);
    assert.ok(opts.resolutions.length, m.id);
    for (const duration of opts.durations)
      for (const resolution of opts.resolutions) {
        const input = buildModelInput(
          m,
          "https://example.com/source.png",
          "Cinematic drone",
          "auto",
          { duration, resolution },
        );
        if (hasReviewedPrice(m.id)) {
          const q = quoteFor(m, input, Date.parse("2026-10-15"));
          assert.equal(q.duration, duration);
          assert.ok(q.credits > 0);
        }
        configurations++;
      }
  }
  assert.ok(configurations > 1000);
});
