import { isPlatformAdmin } from "@/lib/settings";
import { authorized, failure } from "@/lib/supabase";
export async function GET(req: Request) {
  try {
    const { db, user } = await authorized(req);
    const init = await db
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
    if (init.error) throw init.error;
    const [a, g] = await Promise.all([
      db.from("profiles").select("credits").eq("id", user.id).single(),
      db
        .from("generations")
        .select(
          "id,kind,project_type,project_subtype,status,output_url,output_path,source_path,credits_cost,created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (a.error || g.error) throw a.error || g.error;
    const generations = await Promise.all(
      g.data.map(async (row) => {
        const signed = row.output_path
          ? await db.storage
              .from("outputs")
              .createSignedUrl(row.output_path, 3600)
          : null;
        return { ...row, output_url: signed?.data?.signedUrl || null };
      }),
    );
    return Response.json({
      credits: a.data.credits,
      generations,
      is_admin: isPlatformAdmin(user),
    });
  } catch (e) {
    return failure(e);
  }
}
