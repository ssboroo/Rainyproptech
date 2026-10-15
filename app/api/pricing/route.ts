import { configuredModel } from "@/lib/configured-model";
import { loadSettings, effectivePolicy } from "@/lib/settings";
import { publicQuote } from "@/lib/public-pricing";
import { failure } from "@/lib/supabase";
import { z } from "zod";
import { buildModelInput } from "@/lib/model-router";
import { projectKeys, type Project } from "@/lib/presets";
import { quoteFor, creditPacks } from "@/lib/pricing";
const schema = z.object({
  project: z
    .enum(projectKeys as [Project, ...Project[]])
    .default("exterior_facade"),
  motion: z
    .enum(["drone_pull_back", "drone_orbit", "facade_pan"])
    .default("drone_pull_back"),
  mode: z.enum(["auto", "quality", "speed", "structure"]).default("auto"),
  image: z.string().max(180).optional(),
  video: z.string().max(180).optional(),
  video_duration: z.coerce.number().int().min(1).max(30).optional(),
  video_resolution: z.string().max(20).optional(),
});
export async function GET(req: Request) {
  try {
    const { settings, revision } = await loadSettings();
    const policy = effectivePolicy(settings, revision);
    const parsed = schema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    if (!parsed.success)
      return Response.json(
        { error: "Invalid pricing selection" },
        { status: 400 },
      );
    const v = parsed.data;
    const quotes = Object.fromEntries(
      (["image", "video"] as const).map((kind) => {
        try {
          const { model } = configuredModel(
            settings,
            kind,
            v.project,
            v.motion,
            v.mode,
            v[kind] || undefined,
            v.video_resolution,
          );
          return [
            kind,
            {
              quote: publicQuote(
                quoteFor(
                  model,
                  buildModelInput(
                    model,
                    "https://example.com/reference.png",
                    "Architectural visualization",
                    v.mode,
                    kind === "video"
                      ? {
                          duration: v.video_duration,
                          resolution: v.video_resolution,
                        }
                      : {},
                  ),
                  Date.now(),
                  policy,
                  settings.ruleOverrides,
                ),
              ),
            },
          ];
        } catch (e) {
          return [kind, { error: (e as Error).message }];
        }
      }),
    );
    return Response.json(
      {
        version: policy.version,
        creditMnt: policy.creditMnt,
        packs: creditPacks,
        ...quotes,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
