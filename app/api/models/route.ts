import { catalog, catalogUpdatedAt } from "@/lib/model-router";
import verification from "@/lib/model-verification.json";
import { videoOptions } from "@/lib/video-options";
import { hasReviewedPrice } from "@/lib/pricing";
export function GET() {
  return Response.json(
    {
      updated_at: catalogUpdatedAt,
      total: catalog.length,
      verified_at: verification.checkedAt,
      verification_method: verification.method,
      models: catalog.map(({ schema, sourceField, ...m }) => ({
        ...m,
        priced: hasReviewedPrice(m.id),
        verification:
          (verification.models as Record<string, string>)[m.id] || "unverified",
        paid_tested: false,
        videoOptions:
          m.kind === "video"
            ? videoOptions({ ...m, schema, sourceField })
            : undefined,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
