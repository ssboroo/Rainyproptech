import type { SupabaseClient } from "@supabase/supabase-js";
export function trustedOutput(raw: string) {
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    !(
      ["fal.media", "storage.googleapis.com"].includes(u.hostname) ||
      u.hostname.endsWith(".fal.media")
    )
  )
    throw new Error("Unexpected provider media host");
  return u;
}
export async function persistOutput(
  db: SupabaseClient,
  user: string,
  id: string,
  kind: string,
  url: string,
) {
  const u = trustedOutput(url);
  const res = await fetch(u, {
    redirect: "error",
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok || !res.body) throw new Error("Unable to save provider media");
  const max = kind === "video" ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > max)
        throw new Error("Provider output exceeds storage limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  const mime = res.headers.get("content-type")?.split(";")[0] || "";
  if (
    !(kind === "video"
      ? mime === "video/mp4"
      : ["image/png", "image/jpeg", "image/webp"].includes(mime))
  )
    throw new Error("Unexpected media type");
  const ext =
    kind === "video"
      ? "mp4"
      : mime === "image/jpeg"
        ? "jpg"
        : mime === "image/webp"
          ? "webp"
          : "png";
  const path = `${user}/${id}.${ext}`;
  const { error } = await db.storage
    .from("outputs")
    .upload(path, bytes, { contentType: mime, upsert: true });
  if (error) throw error;
  return path;
}
