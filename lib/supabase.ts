import { createClient } from "@supabase/supabase-js";
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authorized(req: Request) {
  const db = adminDb();
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new ApiError("Please sign in", 401);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new ApiError("Please sign in again", 401);
  return { db, user: data.user };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function failure(e: unknown) {
  if (e instanceof ApiError)
    return Response.json({ error: e.message }, { status: e.status });
  console.error(e instanceof Error ? e.message : "Server error");
  return Response.json(
    { error: "Service unavailable. Check configuration or retry later." },
    { status: 503 },
  );
}
