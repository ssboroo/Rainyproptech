import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  selectModel,
  buildModelInput,
  extractOutput,
} from "../lib/model-router";
test("100 distinct active source-image adapters are catalogued with matching input schemas", () => {
  assert.equal(catalog.length, 100);
  assert.equal(new Set(catalog.map((m) => m.id)).size, 100);
  assert.equal(catalog.filter((m) => m.kind === "image").length, 50);
  assert.equal(catalog.filter((m) => m.kind === "video").length, 50);
  for (const m of catalog) {
    const input = buildModelInput(
      m,
      "https://example.com/source.png",
      "Architectural visualization",
    );
    for (const mode of ["quality", "speed", "structure"] as const)
      assert.doesNotThrow(
        () =>
          buildModelInput(
            m,
            "https://example.com/source.png",
            "Architecture",
            mode,
          ),
        m.id + mode,
      );
    assert.ok(input[m.sourceField], m.id);
    assert.ok(
      !("generate_audio" in input) || input.generate_audio === false,
      m.id,
    );
  }
});
test("routing is deterministic, project-aware and never accepts arbitrary endpoints", () => {
  assert.equal(
    selectModel("image", "master_plan", "drone_orbit").model.kind,
    "image",
  );
  assert.match(
    selectModel("video", "townhouse", "drone_orbit").model.id,
    /kling/,
  );
  assert.throws(() =>
    selectModel(
      "image",
      "townhouse",
      "facade_pan",
      "auto",
      "https://evil.example/model",
    ),
  );
  assert.throws(() =>
    selectModel(
      "image",
      "townhouse",
      "facade_pan",
      "auto",
      catalog.find((m) => m.kind === "video")!.id,
    ),
  );
  const model = catalog.find((m) => m.kind === "image")!;
  assert.equal(
    selectModel("image", "townhouse", "facade_pan", "auto", model.id).reason,
    "manual",
  );
});
test("single and plural output adapters return only the selected media family", () => {
  assert.equal(
    extractOutput({ image: { url: "https://a/image.png" } }, "image"),
    "https://a/image.png",
  );
  assert.equal(
    extractOutput({ images: [{ url: "https://a/image.png" }] }, "image"),
    "https://a/image.png",
  );
  assert.equal(
    extractOutput({ video: { url: "https://a/video.mp4" } }, "video"),
    "https://a/video.mp4",
  );
  assert.equal(
    extractOutput({ images: [{ url: "https://a/image.png" }] }, "video"),
    null,
  );
});
