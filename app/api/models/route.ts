import { catalog, catalogUpdatedAt } from "@/lib/model-router";
export function GET() {
  return Response.json(
    {
      updated_at: catalogUpdatedAt,
      total: catalog.length,
      models: catalog.map(({ schema, sourceField, ...m }) => m),
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
