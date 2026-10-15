import { catalog, catalogUpdatedAt, buildModelInput } from "@/lib/model-router";
import { videoOptions } from "@/lib/video-options";
import { hasReviewedPrice, quoteFor } from "@/lib/pricing";
import { publicQuote } from "@/lib/public-pricing";
import { loadSettings, effectivePolicy } from "@/lib/settings";
import { failure } from "@/lib/supabase";
export async function GET() {
  try {
    const { settings, revision } = await loadSettings();
    const policy = effectivePolicy(settings, revision);
    return Response.json(
      {
        updated_at: catalogUpdatedAt,
        total: catalog.length,
        models: catalog.map((m) => {
          let retail;
          try {
            if (!settings.disabledModels.includes(m.id))
              retail = publicQuote(
                quoteFor(
                  m,
                  buildModelInput(
                    m,
                    "https://example.com/reference.png",
                    "Architecture",
                  ),
                  Date.now(),
                  policy,
                  settings.ruleOverrides,
                ),
              );
          } catch {}
          return {
            id: m.id,
            name: m.name,
            kind: m.kind,
            priced: !!retail && hasReviewedPrice(m.id, settings.ruleOverrides),
            retail,
            videoOptions: m.kind === "video" ? videoOptions(m) : undefined,
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
