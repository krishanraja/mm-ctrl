import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const InputSchema = z.object({
  assessment_id: z.string().min(1, "assessment_id is required"),
  session_id: z.string().min(1, "session_id is required"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  // Validate we're using the correct database (Mindmaker AI, ID: bkyuxvschuwngtcdhsyg)
  const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';
  if (!supabaseUrl || !supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
    const error = `Database validation failed: SUPABASE_URL does not match expected project ID (${EXPECTED_PROJECT_ID}). Current: ${supabaseUrl}`;
    console.error('❌', error);
    return new Response(
      JSON.stringify({ error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  console.log(`✅ Database validated: Using Mindmaker AI (${EXPECTED_PROJECT_ID})`);
  
  const supabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  );

  try {
    console.log('🔍 Verifying diagnostic payment');

    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { assessment_id, session_id } = parsed.data;

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Rate limiting: 10 requests per minute
    const rateLimitResult = checkRateLimit(user.id, { maxRequests: 10, windowMs: 60_000 });
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log('✅ Session retrieved:', {
      status: session.payment_status,
      metadata: session.metadata,
    });

    // Check if payment is completed
    if (session.payment_status === 'paid') {
      const upgradeType = session.metadata?.upgrade_type || 'full_diagnostic';
      console.log('💰 Payment confirmed, unlocking:', upgradeType);

      // Update leader_assessment based on upgrade type
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (upgradeType === 'full_diagnostic' || upgradeType === 'bundle') {
        updateData.has_full_diagnostic = true;
      }

      if (upgradeType === 'deep_context' || upgradeType === 'bundle') {
        updateData.has_deep_context = true;
      }

      const { error: updateError } = await supabaseClient
        .from('leader_assessments')
        .update(updateData)
        .eq('id', assessment_id);

      if (updateError) {
        console.error('❌ Error updating assessment:', updateError);
        throw updateError;
      }

      console.log('✅ Assessment unlocked successfully:', updateData);

      return new Response(
        JSON.stringify({
          success: true,
          paid: true,
          assessment_id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Payment not completed
    return new Response(
      JSON.stringify({
        success: false,
        paid: false,
        status: session.payment_status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
