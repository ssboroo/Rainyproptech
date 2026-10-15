import { authorized, ApiError, failure } from "@/lib/supabase";
import { provider } from "@/lib/fal";
import { extractOutput, catalog } from "@/lib/model-router";
import { persistOutput } from "@/lib/media";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { db, user } = await authorized(req);
    const { id } = await params;
    const { data: g, error } = await db
      .from("generations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !g) throw new ApiError("Generation not found", 404);
    if (g.provider_request_id && !["completed", "failed"].includes(g.status)) {
      const fal = provider();
      try {
        const state = await fal.queue.status(g.model, {
          requestId: g.provider_request_id,
        });
        if (state.status === "COMPLETED") {
          const result = await fal.queue.result(g.model, {
            requestId: g.provider_request_id,
          });
          const data = result.data as {
            images?: { url: string }[];
            video?: { url: string };
            has_nsfw_concepts?: boolean[];
          };
          if (data.has_nsfw_concepts?.some(Boolean))
            throw new ApiError("Provider rejected output", 422);
          const url = extractOutput(data, g.kind);
          if (!url || new URL(url).protocol !== "https:")
            throw new ApiError("Invalid provider output", 422);
          const path = await persistOutput(db, user.id, id, g.kind, url);
          const saved = await db
            .from("generations")
            .update({ status: "completed", output_url: url, output_path: path })
            .eq("id", id)
            .neq("status", "failed");
          if (saved.error) throw saved.error;
          g.status = "completed";
          g.output_url = url;
          g.output_path = path;
        } else {
          g.status = state.status === "IN_PROGRESS" ? "processing" : "queued";
        }
      } catch (e) {
        const status = (e as { status?: number }).status;
        if (status === 422 || status === 400) {
          const r = await db.rpc("fail_generation", {
            p_id: id,
            p_user: user.id,
          });
          if (r.error) throw r.error;
          g.status = "failed";
        } else throw e;
      }
    }
    if (g.output_path) {
      const out = await db.storage
        .from("outputs")
        .createSignedUrl(g.output_path, 3600);
      if (out.error) throw out.error;
      g.output_url = out.data.signedUrl;
    }
    const signed = await db.storage
      .from("sources")
      .createSignedUrl(g.source_path, 3600);
    return Response.json({
      id: g.id,
      model: g.model,
      model_name: catalog.find((m) => m.id === g.model)?.name || g.model,
      kind: g.kind,
      status: g.status,
      output_url: g.output_url,
      source_url: signed.data?.signedUrl,
      project_subtype: g.project_subtype,
      style_preset: g.style_preset,
    });
  } catch (e) {
    return failure(e);
  }
}
