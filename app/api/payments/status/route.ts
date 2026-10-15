import { z } from "zod";
import { authorized, ApiError, failure } from "@/lib/supabase";
import { loadSettings, wireKey } from "@/lib/settings";
import { reconcilePayment } from "@/lib/settle-payment";
export async function GET(req: Request) {
  try {
    const { db, user } = await authorized(req);
    const id = z.uuid().parse(new URL(req.url).searchParams.get("id"));
    const { data: o, error } = await db
      .from("credit_orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !o) throw new ApiError("Захиалга олдсонгүй.", 404);
    const { secrets } = await loadSettings();
    const status = o.provider_intent
      ? await reconcilePayment(db, wireKey(secrets), o)
      : o.status;
    return Response.json(
      { id: o.id, status, credits: o.credits, amount: o.amount },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
