/**
 * Stripe Webhook Handler
 * Processes Stripe payment events automatically instead of polling
 * 
 * Webhook events handled:
 * - checkout.session.completed: Unlock diagnostic when payment succeeds
 * - payment_intent.succeeded: Alternative payment confirmation
 * - payment_intent.payment_failed: Handle failed payments
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    if (!webhookSecret) {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET not configured. Webhook signature verification disabled.");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // If no secret configured, parse event without verification (not recommended for production)
      console.warn("⚠️ Processing webhook without signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`📥 Processing Stripe webhook: ${event.type}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      throw new Error(`Database validation failed: SUPABASE_URL does not match expected project ID (${EXPECTED_PROJECT_ID})`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Handle checkout.session.completed event
 * Unlocks diagnostic when payment is successful
 */
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const assessmentId = session.metadata?.assessment_id;
  const userId = session.metadata?.user_id;

  if (!assessmentId) {
    console.warn('⚠️ Checkout session missing assessment_id in metadata');
    return;
  }

  if (session.payment_status !== 'paid') {
    console.log(`ℹ️ Checkout session not paid (status: ${session.payment_status})`);
    return;
  }

  console.log(`💰 Unlocking diagnostic for assessment: ${assessmentId}`);

  const { error } = await supabase
    .from('leader_assessments')
    .update({
      has_full_diagnostic: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId);

  if (error) {
    console.error('❌ Error unlocking assessment:', error);
    throw error;
  }

  console.log('✅ Diagnostic unlocked successfully via webhook');
}

/**
 * Handle payment_intent.succeeded event
 * Alternative payment confirmation method
 */
async function handlePaymentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const assessmentId = paymentIntent.metadata?.assessment_id;

  if (!assessmentId) {
    console.warn('⚠️ Payment intent missing assessment_id in metadata');
    return;
  }

  console.log(`💰 Payment succeeded for assessment: ${assessmentId}`);

  const { error } = await supabase
    .from('leader_assessments')
    .update({
      has_full_diagnostic: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assessmentId);

  if (error) {
    console.error('❌ Error unlocking assessment:', error);
    throw error;
  }

  console.log('✅ Diagnostic unlocked successfully via payment intent webhook');
}

/**
 * Handle payment_intent.payment_failed event
 * Log failed payments for analytics
 */
async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const assessmentId = paymentIntent.metadata?.assessment_id;

  console.log(`❌ Payment failed for assessment: ${assessmentId || 'unknown'}`);
  
  // Could log to a payments_log table or send notification
  // For now, just log
}







