import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { projectKeys, styleKeys } from "../lib/presets";
import { visualFor } from "../lib/visual-catalog";
test("every typology and architectural style resolves to a real local WebP photograph", () => {
  for (const [kind, keys] of [
    ["project", projectKeys],
    ["style", styleKeys],
  ] as const) {
    for (const key of keys)
      for (const large of [false, true]) {
        const path = "public" + visualFor(kind, key, large);
        assert.ok(existsSync(path), path);
        const b = readFileSync(path);
        assert.equal(b.toString("ascii", 0, 4), "RIFF");
        assert.equal(b.toString("ascii", 8, 12), "WEBP");
      }
  }
});
