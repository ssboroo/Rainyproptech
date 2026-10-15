import { authorized, ApiError, failure } from "@/lib/supabase";
export async function POST(req: Request) {
  try {
    const { db, user } = await authorized(req);
    const form = await req.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 15 * 1024 * 1024 ||
      file.size === 0
    )
      throw new ApiError("Upload an image under 15 MB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!png && !jpg && !webp)
      throw new ApiError("Export CAD / SketchUp to PNG, JPEG or WebP first");
    const path = `${user.id}/${crypto.randomUUID()}.${png ? "png" : jpg ? "jpg" : "webp"}`;
    const { error } = await db.storage
      .from("sources")
      .upload(path, bytes, {
        contentType: png ? "image/png" : jpg ? "image/jpeg" : "image/webp",
        upsert: false,
      });
    if (error) throw error;
    return Response.json({ path });
  } catch (e) {
    return failure(e);
  }
}
