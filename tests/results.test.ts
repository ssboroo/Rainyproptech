import test from "node:test";
import assert from "node:assert/strict";
import { completedResults, ResultItem } from "../lib/results";
test("gallery shows completed actual outputs only and filters media without mixing pending jobs", () => {
  const jobs: ResultItem[] = [
    {
      id: "a",
      kind: "image",
      status: "completed",
      output_url: "https://example.com/a.png",
    },
    {
      id: "b",
      kind: "video",
      status: "completed",
      output_url: "https://example.com/b.mp4",
    },
    {
      id: "c",
      kind: "image",
      status: "queued",
      output_url: "https://example.com/c.png",
    },
    { id: "d", kind: "image", status: "completed", output_url: null },
    { id: "e", kind: "video", status: "failed" },
  ];
  assert.deepEqual(
    completedResults(jobs).map((g) => g.id),
    ["a", "b"],
  );
  assert.deepEqual(
    completedResults(jobs, "video").map((g) => g.id),
    ["b"],
  );
  assert.equal(completedResults([]).length, 0);
});
