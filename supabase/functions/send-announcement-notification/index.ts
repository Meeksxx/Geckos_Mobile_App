// Supabase Edge Function — send-announcement-notification
// Sends an Expo push notification to all registered device tokens.
// Requires a valid staff session (Authorization: Bearer <access_token>).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function supabaseGet(path: string): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    console.log("[notify] request received");

    // ── Authenticate caller ──────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[notify] missing auth header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const callerToken = authHeader.replace("Bearer ", "");

    // Verify token via Supabase Auth REST API
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${callerToken}`,
      },
    });

    if (!userRes.ok) {
      console.error("[notify] auth failed, status:", userRes.status);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const userData = await userRes.json();
    const userId: string = userData?.id;
    console.log("[notify] user authenticated:", userId);

    // ── Check staff access ───────────────────────────────────────────────────
    const staffRes = await supabaseGet(
      `staff_users?user_id=eq.${userId}&select=user_id&limit=1`,
    );
    const staffRows = await staffRes.json();
    if (!Array.isArray(staffRows) || staffRows.length === 0) {
      console.error("[notify] not a staff user:", userId);
      return new Response(
        JSON.stringify({ error: "Forbidden: staff access required" }),
        { status: 403, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    console.log("[notify] staff check passed");

    // ── Parse body ───────────────────────────────────────────────────────────
    const { title, body } = await req.json() as { title: string; body?: string };
    if (!title?.trim()) {
      return new Response(
        JSON.stringify({ error: "title is required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // ── Fetch all push tokens ────────────────────────────────────────────────
    const tokensRes = await supabaseGet("push_tokens?select=token");
    const tokenRows = await tokensRes.json();

    if (!Array.isArray(tokenRows) || tokenRows.length === 0) {
      console.log("[notify] no registered devices");
      return new Response(
        JSON.stringify({ sent: 0, message: "No registered devices." }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const tokens: string[] = tokenRows.map((r: { token: string }) => r.token);
    console.log("[notify] sending to", tokens.length, "device(s)");

    // ── Send to Expo Push API in batches of 100 ──────────────────────────────
    const BATCH_SIZE = 100;
    let sent = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map((to) => ({
        to,
        title,
        body: body ?? "",
        sound: "default",
        channelId: "default",
      }));

      const expoRes = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(messages),
      });

      const expoJson = await expoRes.json().catch(() => null);
      console.log("[notify] expo response:", JSON.stringify(expoJson));
      if (expoRes.ok) sent += batch.length;
    }

    console.log("[notify] done, sent:", sent);
    return new Response(
      JSON.stringify({ sent }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[notify] unhandled error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
