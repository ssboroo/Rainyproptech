import { requireAdmin } from "@/lib/settings";
import { failure } from "@/lib/supabase";
export async function GET(req: Request) {
  try {
    const { db } = await requireAdmin(req);
    const { data, error } = await db
      .from("credit_orders")
      .select("id,user_id,pack,amount,credits,status,created_at,paid_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return Response.json(
      { orders: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
