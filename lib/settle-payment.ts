import { ApiError } from "./supabase";
import { wireRequest, paymentMatches, type WireIntent } from "./wire";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function reconcilePayment(
  db: SupabaseClient,
  key: string,
  order: {
    id: string;
    provider_intent: string;
    amount: number;
    currency: string;
    status: string;
  },
) {
  if (order.status === "paid") return "paid";
  const pi = await wireRequest<WireIntent>(
    key,
    "/payment_intents/" + encodeURIComponent(order.provider_intent),
  );
  if (pi.status !== "succeeded") return pi.status;
  if (!paymentMatches(order, pi) || pi.livemode === false)
    throw new ApiError("Төлбөрийн дүн эсвэл валют зөрж байна.", 409);
  const r = await db.rpc("settle_credit_order", {
    p_order: order.id,
    p_intent: pi.id,
    p_amount: pi.amount,
    p_currency: pi.currency,
  });
  if (r.error) throw r.error;
  return "paid";
}
