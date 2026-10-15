import { z } from "zod";
import {
  requireAdmin,
  loadSettings,
  encryptSecret,
  wireKey,
  wireSecret,
  effectivePolicy,
} from "@/lib/settings";
import { settingsSchema } from "@/lib/settings-schema";
import { failure, ApiError } from "@/lib/supabase";
import { catalog } from "@/lib/model-router";
import { wireRequest } from "@/lib/wire";
const change = z
  .object({
    revision: z.number().int().positive(),
    config: settingsSchema,
    wireApiKey: z
      .string()
      .regex(/^sk_(live|test)_[A-Za-z0-9_-]+$/)
      .max(500)
      .optional(),
    wireWebhookSecret: z
      .string()
      .regex(/^whsec_[A-Za-z0-9_-]+$/)
      .max(500)
      .optional(),
  })
  .strict();
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { settings, secrets, revision } = await loadSettings();
    return Response.json(
      {
        config: settings,
        revision,
        policy: effectivePolicy(settings, revision),
        wire: {
          configured: !!wireKey(secrets),
          webhookConfigured: !!wireSecret(secrets),
          mode: wireKey(secrets).startsWith("sk_live_") ? "live" : "test",
        },
        falConfigured: !!process.env.FAL_KEY,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const { db, user } = await requireAdmin(req);
    const v = change.parse(await req.json());
    const ids = new Set(catalog.map((m) => m.id));
    if (
      [
        ...v.config.disabledModels,
        ...Object.keys(v.config.ruleOverrides),
        v.config.defaultImage,
        v.config.defaultVideo,
      ].some((id) => !ids.has(id))
    )
      throw new ApiError("Unknown model");
    if (
      !catalog.some(
        (m) => m.id === v.config.defaultImage && m.kind === "image",
      ) ||
      !catalog.some((m) => m.id === v.config.defaultVideo && m.kind === "video")
    )
      throw new ApiError("Model type mismatch");
    const secrets: Record<string, string> = {};
    if (v.wireApiKey) secrets.wireApiKey = encryptSecret(v.wireApiKey);
    if (v.wireWebhookSecret)
      secrets.wireWebhookSecret = encryptSecret(v.wireWebhookSecret);
    const { error } = await db.rpc("set_studio_settings", {
      p_actor: user.id,
      p_revision: v.revision,
      p_config: v.config,
      p_secrets: secrets,
      p_keys: [...Object.keys(v.config), ...Object.keys(secrets)],
    });
    if (error)
      throw new ApiError(
        "Өөрчлөлт хадгалагдсангүй. Хуудсаа шинэчилнэ үү.",
        409,
      );
    return Response.json({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const { secrets } = await loadSettings();
    const r = await wireRequest<{
      data?: Array<{ operator?: string; status?: string }>;
    }>(wireKey(secrets), "/operator_connections");
    return Response.json({
      connected: true,
      operators: (r.data || []).map((x) => ({
        operator: x.operator,
        status: x.status,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
