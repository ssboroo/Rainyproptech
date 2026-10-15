// Adapted from the user's socialtool-store Wire integration; hosted checkout + verified polling.
import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./supabase";
export type WireIntent = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  livemode?: boolean;
  metadata?: Record<string, string>;
};
export async function wireRequest<T>(
  key: string,
  path: string,
  body?: unknown,
  idempotency?: string,
): Promise<T> {
  if (!/^sk_(live|test)_/.test(key))
    throw new ApiError("Wire.mn холболтыг админ тохируулах шаардлагатай.", 503);
  const r = await fetch("https://api.wire.mn/v1" + path, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body
        ? {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotency!,
          }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!r.ok)
    throw new ApiError(
      r.status === 401 || r.status === 403
        ? "Wire.mn түлхүүр болон төлбөрийн операторын эрхийг шалгана уу."
        : "Төлбөрийн үйлчилгээ түр боломжгүй. Ижил хүсэлтээ дахин шалгана уу.",
      503,
    );
  return r.json();
}
export function verifyWireSignature(
  raw: string,
  header: string,
  secret: string,
  now = Date.now(),
) {
  if (!secret) return false;
  const parts = header.split(",").map((x) => x.trim()),
    ts = parts.filter((x) => x.startsWith("t="));
  if (ts.length !== 1) return false;
  const t = ts[0].slice(2);
  if (!/^\d+$/.test(t) || Math.abs(now / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(t + "." + raw)
    .digest();
  return parts
    .filter((x) => x.startsWith("v1="))
    .some((x) => {
      const h = x.slice(3);
      return (
        /^[a-f0-9]{64}$/i.test(h) &&
        timingSafeEqual(expected, Buffer.from(h, "hex"))
      );
    });
}
export function trustedCheckout(url: string) {
  const u = new URL(url);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "pay.wire.mn" ||
    u.username ||
    u.password
  )
    throw new ApiError("Төлбөрийн холбоос баталгаагүй.", 502);
  return u.href;
}
export function paymentMatches(
  o: { provider_intent: string; amount: number; currency: string },
  p: WireIntent,
) {
  return (
    p.id === o.provider_intent &&
    p.status === "succeeded" &&
    p.currency === o.currency &&
    p.amount === o.amount
  );
}
