/**
 * swap-profile-data Edge Function
 *
 * Replaces the authenticated user's identity, business, objective, and blocker
 * memories with dummy broadcasting media company data. Also updates the leaders
 * profile, user_patterns, and user_decisions tables.
 *
 * Usage: supabase.functions.invoke('swap-profile-data')
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Dummy Data ────────────────────────────────────────────────────

const IDENTITY_FACTS = [
  { fact_key: "role", fact_label: "Your Role", fact_value: "CEO and Managing Director" },
  { fact_key: "title", fact_label: "Job Title", fact_value: "Chief Executive Officer" },
  { fact_key: "department", fact_label: "Department", fact_value: "Executive Leadership" },
  { fact_key: "seniority", fact_label: "Seniority Level", fact_value: "C-Suite" },
];

const BUSINESS_FACTS = [
  { fact_key: "company_name", fact_label: "Company", fact_value: "Meridian Broadcasting Group" },
  { fact_key: "industry", fact_label: "Industry", fact_value: "Media and Broadcasting" },
  { fact_key: "vertical", fact_label: "Vertical", fact_value: "Regional Television and Digital Media" },
  { fact_key: "company_size", fact_label: "Company Size", fact_value: "240 employees across 3 stations" },
  { fact_key: "team_size", fact_label: "Team Size", fact_value: "240" },
  { fact_key: "company_stage", fact_label: "Company Stage", fact_value: "Established, expanding digital" },
  { fact_key: "business_model", fact_label: "Business Model", fact_value: "Ad-supported linear TV plus streaming subscriptions" },
];

const OBJECTIVE_FACTS = [
  { fact_key: "goal_1", fact_label: "Primary Goal", fact_value: "Grow digital streaming subscribers to 50K by end of year" },
  { fact_key: "goal_2", fact_label: "Secondary Goal", fact_value: "Launch AI-powered local news production pipeline" },
  { fact_key: "priority_1", fact_label: "Top Priority", fact_value: "Retain linear TV ad revenue while building digital" },
  { fact_key: "success_metric", fact_label: "Success Metric", fact_value: "Digital revenue reaching 30% of total revenue" },
];

const BLOCKER_FACTS = [
  { fact_key: "blocker_1", fact_label: "Main Blocker", fact_value: "Legacy broadcast infrastructure is expensive to maintain alongside digital" },
  { fact_key: "blocker_2", fact_label: "Team Challenge", fact_value: "Newsroom talent wants to go digital-first but advertisers still value linear" },
  { fact_key: "blocker_3", fact_label: "Market Challenge", fact_value: "Competing with national streamers for local audience attention" },
];

const WATCHLIST_FACTS = [
  { fact_key: "watching_company", fact_label: "Watching", fact_value: "Sinclair Broadcast Group" },
  { fact_key: "watching_company", fact_label: "Watching", fact_value: "Nexstar Media" },
  { fact_key: "watching_company", fact_label: "Watching", fact_value: "Netflix" },
];

const PATTERNS = [
  { pattern_type: "strength", pattern_text: "Strong instinct for local storytelling that resonates with community audiences", confidence: 0.85, evidence_count: 4 },
  { pattern_type: "behavior", pattern_text: "Tends to over-invest in proven linear formats at the expense of digital experiments", confidence: 0.78, evidence_count: 3 },
  { pattern_type: "blindspot", pattern_text: "Underestimates how quickly younger demographics are cutting the cord", confidence: 0.72, evidence_count: 3 },
  { pattern_type: "preference", pattern_text: "Prefers data-backed decisions but falls back on gut when data is ambiguous", confidence: 0.80, evidence_count: 5 },
];

const DECISIONS = [
  { decision_text: "Deciding whether to acquire a local digital news startup or build in-house", rationale: "Acquisition would be faster but culturally risky; building in-house preserves newsroom DNA", source: "manual" },
  { decision_text: "Evaluating AI anchor technology for off-peak local news bulletins", rationale: "Could cut production costs 40% for overnight and early morning slots", source: "manual" },
  { decision_text: "Negotiating renewed carriage deals with two regional cable providers", rationale: "Cable fees still represent 25% of revenue but leverage is declining yearly", source: "manual" },
];

// ── Main Handler ──────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Use service role for mutations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const userId = user.id;
    const stats = { deactivated: 0, inserted: 0, patternsReplaced: 0, decisionsReplaced: 0 };

    // ── Step 1: Read existing name from leaders table ──
    let userName = "there";
    const { data: leader } = await supabase
      .from("leaders")
      .select("name")
      .eq("user_id", userId)
      .maybeSingle();

    if (leader?.name) {
      userName = leader.name;
    }

    // ── Step 2: Soft-delete existing memories ──
    // Deactivate identity, business, objective, blocker, and preference (watchlist) memories
    const { data: deactivated } = await supabase
      .from("user_memory")
      .update({ is_current: false })
      .eq("user_id", userId)
      .eq("is_current", true)
      .in("fact_category", ["identity", "business", "objective", "blocker", "preference"])
      .select("id");

    stats.deactivated = deactivated?.length ?? 0;

    // ── Step 3: Insert new memories ──
    const allFacts = [
      // Keep the user's real name
      { fact_key: "name", fact_label: "Name", fact_value: userName, fact_category: "identity" },
      ...IDENTITY_FACTS.map((f) => ({ ...f, fact_category: "identity" })),
      ...BUSINESS_FACTS.map((f) => ({ ...f, fact_category: "business" })),
      ...OBJECTIVE_FACTS.map((f) => ({ ...f, fact_category: "objective" })),
      ...BLOCKER_FACTS.map((f) => ({ ...f, fact_category: "blocker" })),
      ...WATCHLIST_FACTS.map((f) => ({ ...f, fact_category: "preference" })),
    ];

    const memoryRows = allFacts.map((f) => ({
      user_id: userId,
      fact_key: f.fact_key,
      fact_category: f.fact_category,
      fact_label: f.fact_label,
      fact_value: f.fact_value,
      confidence_score: 0.95,
      is_high_stakes: false,
      verification_status: "verified",
      source_type: "manual",
      is_current: true,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("user_memory")
      .insert(memoryRows)
      .select("id");

    if (insertError) throw new Error(`Failed to insert memories: ${insertError.message}`);
    stats.inserted = inserted?.length ?? 0;

    // ── Step 4: Update leaders table ──
    const { error: leaderError } = await supabase
      .from("leaders")
      .update({
        role: "CEO and Managing Director",
        company: "Meridian Broadcasting Group",
        company_size_band: "201-1000",
        primary_focus: "Digital transformation of regional broadcasting",
      })
      .eq("user_id", userId);

    if (leaderError) {
      console.warn("Failed to update leaders table:", leaderError.message);
    }

    // ── Step 5: Replace user_patterns ──
    // Deprecate existing patterns
    await supabase
      .from("user_patterns")
      .update({ status: "deprecated" })
      .eq("user_id", userId)
      .in("status", ["confirmed", "emerging"]);

    // Insert new patterns
    const patternRows = PATTERNS.map((p) => ({
      user_id: userId,
      pattern_type: p.pattern_type,
      pattern_text: p.pattern_text,
      confidence: p.confidence,
      evidence_count: p.evidence_count,
      status: "confirmed",
    }));

    const { data: patternsInserted } = await supabase
      .from("user_patterns")
      .insert(patternRows)
      .select("id");

    stats.patternsReplaced = patternsInserted?.length ?? 0;

    // ── Step 6: Replace user_decisions ──
    // Supersede existing active decisions
    await supabase
      .from("user_decisions")
      .update({ status: "superseded" })
      .eq("user_id", userId)
      .eq("status", "active");

    // Insert new decisions
    const decisionRows = DECISIONS.map((d) => ({
      user_id: userId,
      decision_text: d.decision_text,
      rationale: d.rationale,
      source: d.source,
      status: "active",
    }));

    const { data: decisionsInserted } = await supabase
      .from("user_decisions")
      .insert(decisionRows)
      .select("id");

    stats.decisionsReplaced = decisionsInserted?.length ?? 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Profile swapped to Meridian Broadcasting Group. ${stats.deactivated} old memories deactivated, ${stats.inserted} new memories created, ${stats.patternsReplaced} patterns replaced, ${stats.decisionsReplaced} decisions replaced.`,
        stats,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("swap-profile-data error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
