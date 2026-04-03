// Supabase Edge Function — delete-account
// Permanently deletes the authenticated user's account and all associated data.
// Requires a valid user session (Authorization: Bearer <access_token>).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function ensureNoError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return atob(normalized.padEnd(normalized.length + padding, "="));
}

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // The Supabase gateway already verified the JWT signature before this function runs.
    // Decode the payload to extract the user ID rather than making a redundant auth API call,
    // which fails on ES256-signed tokens in this runtime version.
    let userId: string;
    try {
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Malformed JWT");
      const payload = JSON.parse(decodeBase64Url(parts[1])) as { sub?: string };
      if (!payload.sub) throw new Error("Missing subject");
      userId = payload.sub;
    } catch (error) {
      console.error(
        "[delete-account] jwt decode failed:",
        error instanceof Error ? error.message : String(error)
      );
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }
    const user = { id: userId };

    const profileLookup = await supabase
      .from("customer_profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    ensureNoError("Could not load customer profile", profileLookup.error);
    const profile = profileLookup.data;

    // Delete all user data in order (respecting foreign keys)
    const pushTokensDelete = await supabase.from("push_tokens").delete().eq("user_id", user.id);
    ensureNoError("Could not delete push tokens", pushTokensDelete.error);

    const pointsDelete = await supabase.from("points_transactions").delete().eq("user_id", user.id);
    ensureNoError("Could not delete reward transactions", pointsDelete.error);

    const customerPointsDelete = await supabase.from("customer_points").delete().eq("user_id", user.id);
    ensureNoError("Could not delete reward balance", customerPointsDelete.error);

    const ordersDelete = await supabase.from("orders").delete().eq("user_id", user.id);
    ensureNoError("Could not delete live orders", ordersDelete.error);

    let archiveDelete = await supabase.from("orders_archive").delete().eq("user_id", user.id);
    if (archiveDelete.error && /column .*user_id does not exist/i.test(archiveDelete.error.message)) {
      if (profile?.display_name && profile?.phone) {
        archiveDelete = await supabase
          .from("orders_archive")
          .delete()
          .eq("customer_name", profile.display_name)
          .eq("customer_phone", profile.phone);
      } else {
        archiveDelete = { error: null };
      }
    }

    if (
      archiveDelete.error &&
      !/Could not find the table|relation .* does not exist/i.test(archiveDelete.error.message)
    ) {
      throw new Error(`Could not delete archived orders: ${archiveDelete.error.message}`);
    }

    const profilesDelete = await supabase.from("customer_profiles").delete().eq("user_id", user.id);
    ensureNoError("Could not delete customer profile", profilesDelete.error);

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
