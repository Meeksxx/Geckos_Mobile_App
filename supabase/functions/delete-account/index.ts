// Supabase Edge Function — delete-account
// Permanently deletes the authenticated user's account and all associated data.
// Requires a valid user session (Authorization: Bearer <access_token>).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
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

    // Verify the token belongs to a real user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Delete all user data in order (respecting foreign keys)
    await supabase.from("push_tokens").delete().eq("user_id", user.id);
    await supabase.from("points_transactions").delete().eq("user_id", user.id);
    await supabase.from("customer_points").delete().eq("user_id", user.id);
    await supabase.from("customer_profiles").delete().eq("user_id", user.id);

    // Delete the auth user — must use service role
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[delete-account] auth.admin.deleteUser failed:", deleteError.message);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[delete-account]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
