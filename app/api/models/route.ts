import { catalog, catalogUpdatedAt } from "@/lib/model-router";
import { hasReviewedPrice } from "@/lib/pricing";
export function GET() {
  return Response.json(
    {
      updated_at: catalogUpdatedAt,
      total: catalog.length,
      models: catalog.map(({ schema, sourceField, ...m }) => ({
        ...m,
        priced: hasReviewedPrice(m.id),
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
