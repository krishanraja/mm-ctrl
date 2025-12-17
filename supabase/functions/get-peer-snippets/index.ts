import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const K_ANONYMITY_MIN = 3; // Require at least 3 peers in cohort

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const EXPECTED_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
    if (!supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      throw new Error("Database configuration error (unexpected project).");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (userErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tension_key, dimension_key, benchmark_tier, company_size_band } = await req.json().catch(() => ({}));

    if (!tension_key || !dimension_key) {
      return new Response(JSON.stringify({ error: "tension_key and dimension_key are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user's consent
    const { data: consent } = await supabase
      .from("leader_sharing_consent" as never)
      .select("consent_to_share")
      .eq("user_id", userId)
      .maybeSingle();

    if (!consent?.consent_to_share) {
      return new Response(
        JSON.stringify({
          success: true,
          snippets: [],
          message: "Consent required to view peer snippets. Enable sharing in settings.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find matching snippets (k-anonymity enforced: only show if cohort has >= K_ANONYMITY_MIN)
    // Note: This is a simplified implementation. Production should compute k-anonymity dynamically.
    const { data: snippets } = await supabase
      .from("leader_peer_snippets" as never)
      .select("snippet_text, source_type, source_created_at, created_at")
      .eq("tension_key", tension_key)
      .eq("dimension_key", dimension_key)
      .neq("user_id", userId) // Exclude own snippets
      .gte("k_anonymity_count", K_ANONYMITY_MIN)
      .order("created_at", { ascending: false })
      .limit(3);

    return new Response(
      JSON.stringify({
        success: true,
        snippets: snippets ?? [],
        k_anonymity_min: K_ANONYMITY_MIN,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-peer-snippets error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
