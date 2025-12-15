import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    const { assessment_id, session_id } = await req.json();

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
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
      console.log('💰 Payment confirmed, unlocking diagnostic');

      // Update leader_assessment to mark as paid
      const { error: updateError } = await supabaseClient
        .from('leader_assessments')
        .update({
          has_full_diagnostic: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment_id);

      if (updateError) {
        console.error('❌ Error updating assessment:', updateError);
        throw updateError;
      }

      console.log('✅ Assessment unlocked successfully');

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
