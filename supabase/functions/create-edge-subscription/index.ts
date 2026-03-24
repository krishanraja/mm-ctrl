import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TODO: Replace with actual Stripe price ID after creating subscription product
const EDGE_PRO_PRICE_ID = Deno.env.get("STRIPE_EDGE_PRO_PRICE_ID") || "price_edge_pro_monthly";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // Check for existing active subscription
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await serviceClient
      .from("edge_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (existing?.status === "active") {
      return new Response(
        JSON.stringify({ error: "You already have an active Edge Pro subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create Stripe Checkout session for subscription
    const origin = req.headers.get("origin") || "https://mindmaker.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: EDGE_PRO_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/dashboard?view=edge&subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?view=edge&subscription=canceled`,
      metadata: {
        user_id: user.id,
        product: "edge_pro",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          product: "edge_pro",
        },
      },
    });

    // Upsert subscription record with stripe customer ID
    await serviceClient
      .from("edge_subscriptions")
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "inactive",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-edge-subscription error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
