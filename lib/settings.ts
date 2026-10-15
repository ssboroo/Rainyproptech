import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { adminDb, authorized, ApiError } from "./supabase";
import { defaultSettings, settingsSchema } from "./settings-schema";
import { pricingPolicy } from "./pricing";
export function isPlatformAdmin(user: {
  email?: string;
  email_confirmed_at?: string;
  app_metadata?: Record<string, unknown>;
}) {
  const owners = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return (
    !!user.email_confirmed_at &&
    (user.app_metadata?.role === "admin" ||
      owners.includes(user.email?.toLowerCase() || ""))
  );
}
export async function requireAdmin(req: Request) {
  const a = await authorized(req);
  if (!isPlatformAdmin(a.user))
    throw new ApiError("Админ эрх шаардлагатай.", 403);
  return a;
}
function encryptionKey() {
  const k = Buffer.from(process.env.SETTINGS_ENCRYPTION_KEY || "", "base64");
  if (k.length !== 32)
    throw new ApiError("Нууц тохиргооны хамгаалалт бэлэн биш.", 503);
  return k;
}
export function encryptSecret(value: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const bytes = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), bytes]
    .map((x) => x.toString("base64"))
    .join(".");
}
export function decryptSecret(value: string) {
  const [iv, tag, data] = value.split(".").map((x) => Buffer.from(x, "base64"));
  const d = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
export async function loadSettings() {
  const db = adminDb();
  const { data, error } = await db
    .from("studio_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw new ApiError("Студийн тохиргоог уншиж чадсангүй.", 503);
  const settings = settingsSchema.parse({ ...defaultSettings, ...data.config });
  return {
    db,
    settings,
    secrets: data.secrets as Record<string, string>,
    revision: data.revision as number,
  };
}
export function effectivePolicy(
  settings: typeof defaultSettings,
  revision: number,
) {
  return {
    ...pricingPolicy,
    usdMnt: settings.usdMnt,
    paymentFee: settings.paymentFee,
    overheadMnt: settings.overheadMnt,
    providerReserve: settings.providerReserve,
    validUntil: settings.validUntil,
    version: `2026-10-15.4-r${revision}`,
    markup: 2,
  };
}
export function wireKey(secrets: Record<string, string>) {
  return secrets.wireApiKey
    ? decryptSecret(secrets.wireApiKey)
    : process.env.WIRE_MN_API_KEY || process.env.WIRE_API_KEY || "";
}
export function wireSecret(secrets: Record<string, string>) {
  return secrets.wireWebhookSecret
    ? decryptSecret(secrets.wireWebhookSecret)
    : process.env.WIRE_MN_WEBHOOK_SECRET ||
        process.env.WIRE_WEBHOOK_SECRET ||
        "";
}
