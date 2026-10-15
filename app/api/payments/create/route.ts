import { z } from "zod";
import { authorized, ApiError, failure } from "@/lib/supabase";
import { loadSettings, wireKey } from "@/lib/settings";
import { creditPacks } from "@/lib/public-pricing";
import { wireRequest, trustedCheckout, type WireIntent } from "@/lib/wire";
const schema = z
  .object({ id: z.uuid(), pack: z.enum(["Starter", "Studio", "Business"]) })
  .strict();
export async function POST(req: Request) {
  try {
    const { db, user } = await authorized(req),
      v = schema.parse(await req.json());
    const { settings, secrets } = await loadSettings(),
      key = wireKey(secrets);
    if (!settings.paymentsEnabled || !key.startsWith("sk_live_"))
      throw new ApiError("Кредит цэнэглэх үйлчилгээг админ идэвхжүүлнэ.", 503);
    const pack = creditPacks.find((p) => p.name === v.pack)!;
    const origin = new URL(
      process.env.SITE_URL ||
        "https://rainy-proptech-production.up.railway.app",
    );
    if (origin.protocol !== "https:")
      throw new ApiError("Site URL configuration required", 503);
    const init = await db
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
    if (init.error) throw init.error;
    const insert = await db
      .from("credit_orders")
      .upsert(
        {
          id: v.id,
          user_id: user.id,
          pack: pack.name,
          amount: pack.priceMnt,
          credits: pack.credits,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (insert.error) throw insert.error;
    const { data: order, error } = await db
      .from("credit_orders")
      .select("*")
      .eq("id", v.id)
      .eq("user_id", user.id)
      .single();
    if (error || !order) throw new ApiError("Order unavailable", 404);
    if (order.pack !== pack.name)
      throw new ApiError("Order ID already used", 409);
    if (order.status === "paid")
      return Response.json({ id: order.id, status: "paid" });
    if (order.checkout_url)
      return Response.json({
        id: order.id,
        url: trustedCheckout(order.checkout_url),
      });
    if (!order.provider_intent) {
      const pi = await wireRequest<WireIntent>(
        key,
        "/payment_intents",
        {
          amount: order.amount,
          currency: "MNT",
          description: `RAINY VISTA · ${pack.name} · ${order.credits} кредит`,
          metadata: { app: "rainy-vista", order_id: order.id },
          ...(settings.wireOperators.length
            ? {
                allowed_operators: settings.wireOperators.filter(
                  (x) => x !== "sandbox",
                ),
              }
            : {}),
        },
        `vista-pi-${order.id}`,
      );
      if (
        !/^pi_[A-Za-z0-9_-]+$/.test(pi.id) ||
        pi.amount !== order.amount ||
        pi.currency !== "MNT" ||
        pi.livemode === false
      )
        throw new ApiError("Payment response mismatch", 502);
      const saved = await db
        .from("credit_orders")
        .update({ provider_intent: pi.id })
        .eq("id", order.id)
        .is("provider_intent", null);
      if (saved.error) throw saved.error;
      order.provider_intent = pi.id;
    }
    const session = await wireRequest<{ url: string }>(
      key,
      "/checkout/sessions",
      {
        payment_intent: order.provider_intent,
        success_url: new URL(`/pricing?order=${order.id}`, origin).href,
        cancel_url: new URL(`/pricing?order=${order.id}`, origin).href,
      },
      `vista-cs-${order.id}`,
    );
    const url = trustedCheckout(session.url);
    const saved = await db
      .from("credit_orders")
      .update({ checkout_url: url })
      .eq("id", order.id);
    if (saved.error) throw saved.error;
    return Response.json({ id: order.id, url });
  } catch (e) {
    return failure(e);
  }
}
