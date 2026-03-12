// Supabase Edge Function — send-announcement-notification
// Sends an Expo push notification to all registered device tokens.
// Called via supabase.functions.invoke() — auth token injected automatically.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPO_PUSH_URL   = "https://exp.host/--/api/v2/push/send";
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    console.log("[notify] request received");

    // ── Verify caller is a staff user ────────────────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    const callerToken = authHeader.replace(/^Bearer\s+/i, "");

    if (!callerToken) {
      console.error("[notify] no token");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // Get user from token
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${callerToken}` },
    });
    if (!userRes.ok) {
      console.error("[notify] auth failed:", userRes.status);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    const { id: userId } = await userRes.json();
    console.log("[notify] user:", userId);

    // Check staff_users table
    const staffRes = await fetch(
      `${SUPABASE_URL}/rest/v1/staff_users?user_id=eq.${userId}&select=user_id&limit=1`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } },
    );
    const staffRows = await staffRes.json();
    if (!Array.isArray(staffRows) || staffRows.length === 0) {
      console.error("[notify] not staff:", userId);
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    console.log("[notify] staff verified");

    // ── Parse body ───────────────────────────────────────────────────────────
    const { title, body } = await req.json() as { title: string; body?: string };
    if (!title?.trim()) {
      return new Response(
        JSON.stringify({ error: "title is required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // ── Fetch push tokens ────────────────────────────────────────────────────
    const tokensRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_tokens?select=token`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } },
    );
    const tokenRows = await tokensRes.json();

    if (!Array.isArray(tokenRows) || tokenRows.length === 0) {
      console.log("[notify] no devices registered");
      return new Response(
        JSON.stringify({ sent: 0 }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const tokens: string[] = tokenRows.map((r: { token: string }) => r.token);
    console.log("[notify] sending to", tokens.length, "device(s)");

    // ── Send via Expo Push API ───────────────────────────────────────────────
    const BATCH = 100;
    let sent = 0;

    for (let i = 0; i < tokens.length; i += BATCH) {
      const messages = tokens.slice(i, i + BATCH).map((to) => ({
        to, title, body: body ?? "", sound: "default", channelId: "default",
      }));

      const expoRes = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(messages),
      });

      const expoJson = await expoRes.json().catch(() => null);
      console.log("[notify] expo:", JSON.stringify(expoJson));
      if (expoRes.ok) sent += messages.length;
    }

    console.log("[notify] done, sent:", sent);
    return new Response(
      JSON.stringify({ sent }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[notify] error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
