import { loadSettings, wireKey } from "@/lib/settings";
import { failure } from "@/lib/supabase";
export async function GET() {
  try {
    const { settings, secrets } = await loadSettings();
    const key = wireKey(secrets);
    return Response.json(
      {
        available: settings.paymentsEnabled && key.startsWith("sk_live_"),
        testMode: key.startsWith("sk_test_"),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
