import { requireAdmin, loadSettings, effectivePolicy } from "@/lib/settings";
import { catalog, buildModelInput } from "@/lib/model-router";
import { quoteFor, rules } from "@/lib/pricing";
import tariffs from "@/lib/model-tariffs.json";
import { failure } from "@/lib/supabase";
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { settings, revision } = await loadSettings();
    return Response.json(
      {
        models: catalog.map((m) => {
          let quote;
          try {
            quote = quoteFor(
              m,
              buildModelInput(
                m,
                "https://example.com/reference.png",
                "Architecture",
              ),
              Date.now(),
              effectivePolicy(settings, revision),
              settings.ruleOverrides,
            );
          } catch {}
          return {
            id: m.id,
            name: m.name,
            kind: m.kind,
            quote,
            rule: settings.ruleOverrides[m.id] || rules[m.id] || null,
            tariff: tariffs.models[m.id as keyof typeof tariffs.models],
            enabled: !settings.disabledModels.includes(m.id),
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
