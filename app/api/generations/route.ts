import { authorized, ApiError, failure } from "@/lib/supabase";
import { generationSchema } from "@/lib/validation";
import { category, promptFor, videoPromptFor } from "@/lib/presets";
import { provider } from "@/lib/fal";
import { selectModel, buildModelInput } from "@/lib/model-router";
import { quoteFor } from "@/lib/pricing";
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
        : videoPromptFor(project, v.motion, v.notes);
    let selected;
    try {
      selected = selectModel(
        v.kind,
        project,
        v.motion,
        v.routing_mode,
        v.model_id,
      );
    } catch (e) {
      throw new ApiError((e as Error).message);
    }
    const model = selected.model.id;
    // Schema validation runs before reserving any credits.
    let input;
    try {
      input = buildModelInput(selected.model, inputUrl, prompt, v.routing_mode);
    } catch (e) {
      throw new ApiError((e as Error).message);
    }

    let quote;
    try {
      quote = quoteFor(selected.model, input);
    } catch (e) {
      throw new ApiError((e as Error).message, 409);
    }
    if (
      quote.credits !== v.expected_credits ||
      quote.version !== v.pricing_version
    )
      throw new ApiError(
        "Үнэ шинэчлэгдсэн. Шинэ үнийг шалгаад дахин оролдоно уу. Price changed; review the new quote.",
        409,
      );
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
      p_cost: quote.credits,
      p_quote: quote,
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
          input,
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
        if (status === 402)
          throw new ApiError(
            "Fal.ai balance is insufficient. Credits refunded.",
            402,
          );
        if (status === 401 || status === 403)
          throw new ApiError(
            "Fal.ai key or model access is not permitted. Credits refunded.",
            403,
          );
        if (status === 429)
          throw new ApiError(
            "This model is busy. Credits refunded; retry later.",
            429,
          );
        if (status === 400 || status === 422)
          throw new ApiError(
            "Provider rejected this model input. Credits refunded.",
            422,
          );
        throw e;
      }
      const saved = await db
        .from("generations")
        .update({ provider_request_id: requestId, status: "queued" })
        .eq("id", g.id);
      if (saved.error) throw saved.error;
    }
    return Response.json(
      {
        id: g.id,
        status: claim ? "queued" : g.status,
        model,
        model_name: selected.model.name,
        selection_reason: selected.reason,
      },
      { status: 202 },
    );
  } catch (e) {
    return failure(e);
  }
}
