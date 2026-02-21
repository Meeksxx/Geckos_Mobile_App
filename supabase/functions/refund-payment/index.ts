// Supabase Edge Function — refund-payment
// Issues a full Stripe refund for a paid order.
// Reverses the transfer to the connected account and returns the platform fee.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.208.0&no-check";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

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
    const { paymentIntentId } = await req.json() as { paymentIntentId: string };

    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "paymentIntentId is required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reverse_transfer: true,      // reverses the transfer to Gecko's account
      refund_application_fee: true, // returns the platform fee
    });

    return new Response(
      JSON.stringify({ success: true, refundId: refund.id, status: refund.status }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[refund-payment]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
