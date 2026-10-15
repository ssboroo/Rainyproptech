import { z } from "zod";
import { selectModel, buildModelInput } from "@/lib/model-router";
import { projectKeys, type Project } from "@/lib/presets";
import { quoteFor, pricingPolicy, creditPacks } from "@/lib/pricing";
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
});
export function GET(req: Request) {
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
        const { model } = selectModel(
          kind,
          v.project,
          v.motion,
          v.mode,
          v[kind] || undefined,
        );
        return [
          kind,
          {
            quote: quoteFor(
              model,
              buildModelInput(
                model,
                "https://example.com/reference.png",
                "Architectural visualization",
                v.mode,
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
    { policy: pricingPolicy, packs: creditPacks, ...quotes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
