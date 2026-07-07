// Supabase Edge Function — create-payment-intent
// Runs on Deno. Never expose STRIPE_SECRET_KEY to the client.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.208.0&no-check";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const CONNECTED_ACCOUNT_ID = Deno.env.get("STRIPE_CONNECT_ACCOUNT_ID")!;
const PLATFORM_FEE = 0.03; // 3% tech fee, kept by the platform
const PROCESSING_FEE_RATE = 0.029; // 2.9% + $0.30 — offsets Stripe's card fee
const PROCESSING_FEE_FIXED = 30;
const SERVICE_FEE_RATE = 0.015; // 1.5% customer share, kept by the platform
const TAX_RATE = 0.095; // 9.5% Oklahoma sales tax — passed through to the restaurant
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
    const { subtotalCents, customerName, customerPhone } = await req.json() as {
      subtotalCents: number;
      customerName: string;
      customerPhone: string;
    };

    if (!subtotalCents || subtotalCents < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid amount — minimum is $0.50" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Recompute the full breakdown server-side from subtotalCents — never trust
    // a client-supplied total. Must mirror the math in app/checkout.tsx exactly.
    const processingFeeCents = Math.round(subtotalCents * PROCESSING_FEE_RATE) + PROCESSING_FEE_FIXED;
    const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_RATE);
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalCents = subtotalCents + processingFeeCents + serviceFeeCents + taxCents;
    const techFeeCents = Math.round(subtotalCents * PLATFORM_FEE);

    if (totalCents < 50) {
      return new Response(
        JSON.stringify({ error: "Invalid amount — minimum is $0.50" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // The platform keeps the processing fee + service fee (they cover Stripe's
    // cut and never belong to the restaurant) plus its own 3% tech fee. The
    // connected account is left with the food subtotal + full sales tax.
    const applicationFeeAmount = processingFeeCents + serviceFeeCents + techFeeCents;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: CONNECTED_ACCOUNT_ID },
      statement_descriptor_suffix: "GECKOS TEXOMA",
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
