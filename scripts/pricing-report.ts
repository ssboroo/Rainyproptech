import { writeFileSync } from "node:fs";
import { catalog, buildModelInput } from "../lib/model-router";
import { quoteFor, pricingPolicy } from "../lib/pricing";
const escape = (v: unknown) =>
  '"' + String(v ?? "").replaceAll('"', '""') + '"';
const rows = catalog.map((m) => {
  try {
    const q = quoteFor(
      m,
      buildModelInput(
        m,
        "https://example.com/reference.png",
        "Architectural visualization",
      ),
      Date.parse(pricingPolicy.reviewedAt),
    );
    const cost = q.apiUsd * pricingPolicy.usdMnt + pricingPolicy.overheadMnt;
    return [
      m.id,
      m.kind,
      "reviewed",
      q.resolution,
      q.duration,
      q.apiUsd,
      q.credits,
      q.totalMnt,
      Number((q.totalMnt * 0.97 - cost).toFixed(2)),
      m.docs,
    ];
  } catch {
    return [
      m.id,
      m.kind,
      "price review pending",
      "",
      "",
      "",
      "",
      "",
      "",
      m.docs,
    ];
  }
});
writeFileSync(
  "docs/model-pricing.csv",
  [
    [
      "model",
      "kind",
      "status",
      "resolution",
      "seconds",
      "provider_usd",
      "credits",
      "retail_mnt",
      "planned_contribution_mnt",
      "source",
    ],
    ...rows,
  ]
    .map((row) => row.map(escape).join(","))
    .join("\n") + "\n",
);
console.log({
  reviewed: rows.filter((r) => r[2] === "reviewed").length,
  total: rows.length,
});
