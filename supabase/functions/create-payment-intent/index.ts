// Supabase Edge Function — create-payment-intent
// Runs on Deno. Never expose STRIPE_SECRET_KEY to the client.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.208.0&no-check";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const CONNECTED_ACCOUNT_ID = Deno.env.get("STRIPE_CONNECT_ACCOUNT_ID")!;
const PLATFORM_FEE = 0.03; // 3%
const IS_TEST_MODE = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").startsWith("sk_test_");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const { subtotalCents, totalCents, customerName, customerPhone } = await req.json() as {
      subtotalCents: number;
      totalCents: number;
      customerName: string;
      customerPhone: string;
    };

    if (!totalCents || totalCents < 50) {
      return new Response(
        JSON.stringify({ error: "Invalid amount — minimum is $0.50" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // 3% platform fee on the discounted subtotal (before processing fee)
    const applicationFeeAmount = Math.round(subtotalCents * PLATFORM_FEE);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: CONNECTED_ACCOUNT_ID },
      metadata: {
        customer_name: customerName,
        customer_phone: customerPhone,
        app: "geckos-mobile",
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-payment-intent]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
