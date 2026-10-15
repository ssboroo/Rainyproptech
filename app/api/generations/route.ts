import { authorized, ApiError, failure } from "@/lib/supabase";
import { generationSchema } from "@/lib/validation";
import { category, promptFor, motions } from "@/lib/presets";
import {
  provider,
  IMAGE_MODEL,
  VIDEO_MODEL,
  imageInput,
  videoInput,
} from "@/lib/fal";
export async function POST(req: Request) {
  try {
    const { db, user } = await authorized(req);
    const parsed = generationSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(parsed.error.issues[0].message);
    const v = parsed.data;
    const fal = provider();
    let source = v.source_path || "",
      inputUrl = "",
      project = v.project,
      style = v.style;
    if (v.kind === "video") {
      const { data: p } = await db
        .from("generations")
        .select("*")
        .eq("id", v.parent_id!)
        .eq("user_id", user.id)
        .eq("kind", "image")
        .eq("status", "completed")
        .single();
      if (!p?.output_url) throw new ApiError("Select a completed render");
      source = p.source_path;
      const signed = p.output_path
        ? await db.storage.from("outputs").createSignedUrl(p.output_path, 3600)
        : null;
      if (!signed?.data?.signedUrl)
        throw new ApiError("Render file is unavailable");
      inputUrl = signed.data.signedUrl;
      project = p.project_subtype;
      style = p.style_preset;
    } else {
      if (!source.startsWith(user.id + "/") || source.includes(".."))
        throw new ApiError("Invalid source image");
      const { data, error } = await db.storage
        .from("sources")
        .createSignedUrl(source, 3600);
      if (error || !data) throw new ApiError("Source image missing");
      inputUrl = data.signedUrl;
    }
    const prompt =
      v.kind === "image"
        ? promptFor(project, style, v.notes)
        : motions[v.motion].prompt +
          " Preserve building geometry and facade details. " +
          v.notes;
    const model = v.kind === "image" ? IMAGE_MODEL : VIDEO_MODEL;
    const { data: reserved, error } = await db.rpc("reserve_generation", {
      p_id: v.id,
      p_user: user.id,
      p_kind: v.kind,
      p_project: category(project),
      p_subtype: project,
      p_style: style,
      p_motion: v.motion,
      p_prompt: prompt,
      p_source: source,
      p_parent: v.parent_id || null,
      p_model: model,
    });
    if (error)
      throw new ApiError(
        error.message.includes("Insufficient")
          ? "Insufficient credits"
          : "Unable to reserve generation",
        409,
      );
    const g = Array.isArray(reserved) ? reserved[0] : reserved;
    if (!g) throw new ApiError("Unable to reserve generation", 409);
    if (g.kind !== v.kind || g.model !== model || g.prompt !== prompt)
      throw new ApiError(
        "Request ID already belongs to another generation",
        409,
      );
    // Atomic claim prevents concurrent retries from submitting duplicate provider requests.
    const { data: claim, error: claimError } = await db
      .from("generations")
      .update({ status: "processing" })
      .eq("id", g.id)
      .eq("status", "reserved")
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (claim) {
      let requestId: string;
      try {
        const r = await fal.queue.submit(model, {
          input:
            v.kind === "image"
              ? imageInput(inputUrl, prompt)
              : videoInput(inputUrl, prompt),
        });
        requestId = r.request_id;
      } catch (e) {
        // A transport timeout may have been accepted by Fal. Keep reservation for reconciliation; never auto-resubmit.
        const status = (e as { status?: number }).status;
        if (status && status >= 400 && status < 500) {
          const r = await db.rpc("fail_generation", {
            p_id: g.id,
            p_user: user.id,
          });
          if (r.error) throw r.error;
        }
        throw e;
      }
      const saved = await db
        .from("generations")
        .update({ provider_request_id: requestId, status: "queued" })
        .eq("id", g.id);
      if (saved.error) throw saved.error;
    }
    return Response.json(
      { id: g.id, status: claim ? "queued" : g.status },
      { status: 202 },
    );
  } catch (e) {
    return failure(e);
  }
}
