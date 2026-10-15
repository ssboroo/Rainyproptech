import { loadSettings, wireKey, wireSecret } from "@/lib/settings";
import { failure, ApiError } from "@/lib/supabase";
import { verifyWireSignature } from "@/lib/wire";
import { reconcilePayment } from "@/lib/settle-payment";
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length") || 0) > 65536)
      throw new ApiError("Body too large", 413);
    const raw = await req.text();
    if (raw.length > 65536) throw new ApiError("Body too large", 413);
    const { db, secrets } = await loadSettings();
    if (
      !verifyWireSignature(
        raw,
        req.headers.get("WirePayment-Signature") || "",
        wireSecret(secrets),
      )
    )
      throw new ApiError("Invalid signature", 400);
    const event = JSON.parse(raw);
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data?.object?.id || event.data?.id;
      if (typeof intent !== "string") throw new ApiError("Invalid event");
      const { data: o, error } = await db
        .from("credit_orders")
        .select("*")
        .eq("provider_intent", intent)
        .maybeSingle();
      if (error) throw error;
      if (o) await reconcilePayment(db, wireKey(secrets), o);
    }
    return Response.json({ received: true });
  } catch (e) {
    return failure(e);
  }
}
