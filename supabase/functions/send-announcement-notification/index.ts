// Supabase Edge Function — send-announcement-notification
// Sends an Expo push notification to all registered device tokens.
// Requires a valid staff session (Authorization: Bearer <access_token>).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    // ── Authenticate: must be a logged-in staff member ──────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const { data: staffRow } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!staffRow) {
      return new Response(
        JSON.stringify({ error: "Forbidden: staff access required" }),
        { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    const { title, body } = await req.json() as { title: string; body?: string };

    if (!title?.trim()) {
      return new Response(
        JSON.stringify({ error: "title is required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch all push tokens ────────────────────────────────────────────────
    const { data: rows, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token");

    if (tokensError) throw new Error(tokensError.message);
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No registered devices." }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const tokens = rows.map((r: { token: string }) => r.token);

    // ── Send to Expo Push API in batches of 100 ──────────────────────────────
    const BATCH_SIZE = 100;
    let sent = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map((to: string) => ({
        to,
        title,
        body: body ?? "",
        sound: "default",
        channelId: "default",
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(messages),
      });

      if (res.ok) sent += batch.length;
    }

    return new Response(
      JSON.stringify({ sent }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-announcement-notification]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
