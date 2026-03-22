import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llm-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get week start date (Monday of current week)
function getWeekStartDate(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

const SYSTEM_PROMPT = `You are a decision engine for multi-venture operators (solopreneurs and small business owners).

Your job: Generate ONE clear, actionable AI decision for this week. Not a list. ONE decision.

Hard rules:
- Output MUST be valid JSON only
- ONE decision, not multiple options
- Must reference their specific business mix
- Must consider budget, technical comfort, and pain points
- Must build on previous prescriptions (if any)
- Prioritize: impact × ease × budget fit

Return exactly this structure:
{
  "decision": "One clear action to take this week (1-2 sentences max)",
  "why_this_now": "Why this specific decision matters for their business mix (1-2 sentences)",
  "implementation_steps": ["Step 1", "Step 2", "Step 3"],
  "time_estimate": "X hours",
  "cost_estimate": "$X or free",
  "expected_outcome": "What they'll achieve (1 sentence)"
}`;

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

    const weekStartDate = getWeekStartDate();

    // Get operator profile
    const { data: profile, error: profileError } = await supabase
      .from("operator_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Operator profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if prescription already exists for this week
    const { data: existing } = await supabase
      .from("operator_prescriptions")
      .select("*")
      .eq("operator_profile_id", profile.id)
      .eq("week_start_date", weekStartDate)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          prescription: existing,
          source: "existing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get previous prescriptions to avoid repetition
    const { data: previousPrescriptions } = await supabase
      .from("operator_prescriptions")
      .select("decision_text, week_start_date, status")
      .eq("operator_profile_id", profile.id)
      .order("week_start_date", { ascending: false })
      .limit(5);

    // Build context for LLM
    const businessLines = Array.isArray(profile.business_lines) 
      ? profile.business_lines 
      : [];
    
    const context = {
      businessLines: businessLines,
      inboxCount: profile.inbox_count,
      technicalComfort: profile.technical_comfort,
      monthlyBudget: profile.monthly_budget,
      topPainPoints: profile.top_pain_points || [],
      previousDecisions: previousPrescriptions?.map(p => ({
        decision: p.decision_text,
        week: p.week_start_date,
        completed: p.status === 'completed'
      })) || []
    };

    // Generate prescription using LLM (with built-in fallback chain)
    let generated = {
      decision: "Set up email filtering rules for your inboxes to reduce overwhelm",
      why_this_now: "This addresses your email management pain point and requires minimal technical skill",
      implementation_steps: [
        "Identify your 3 most important email categories",
        "Create filters/rules in your email client",
        "Test and refine over the next few days"
      ],
      time_estimate: "1-2 hours",
      cost_estimate: "Free",
      expected_outcome: "Reduce time spent on email management by 40-60%"
    };

    const userContent = `Operator Profile:
- Business lines: ${JSON.stringify(context.businessLines)}
- Inbox count: ${context.inboxCount}
- Technical comfort: ${context.technicalComfort}/5
- Monthly budget: ${context.monthlyBudget}
- Top pain points: ${context.topPainPoints.join(', ')}
- Previous decisions: ${JSON.stringify(context.previousDecisions)}

Generate ONE decision for this week. Make it specific to their business mix.`;

    try {
      const result = await callLLM(
        {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          task: 'simple',
          temperature: 0.7,
          json_output: true,
        },
        {
          functionName: 'generate-weekly-prescription',
          userId: userId,
          useCache: false,
        },
      );

      if (result.content) {
        const parsed = JSON.parse(result.content);
        if (parsed.decision) generated.decision = parsed.decision.slice(0, 500);
        if (parsed.why_this_now) generated.why_this_now = parsed.why_this_now.slice(0, 500);
        if (Array.isArray(parsed.implementation_steps)) {
          generated.implementation_steps = parsed.implementation_steps.slice(0, 5);
        }
        if (parsed.time_estimate) generated.time_estimate = parsed.time_estimate.slice(0, 50);
        if (parsed.cost_estimate) generated.cost_estimate = parsed.cost_estimate.slice(0, 50);
        if (parsed.expected_outcome) generated.expected_outcome = parsed.expected_outcome.slice(0, 200);
      }
    } catch (e) {
      console.warn("LLM call failed, using default:", e);
    }

    // Store prescription
    const { data: prescription, error: insertError } = await supabase
      .from("operator_prescriptions")
      .insert({
        operator_profile_id: profile.id,
        week_start_date: weekStartDate,
        decision_text: generated.decision,
        why_text: generated.why_this_now,
        implementation_steps: generated.implementation_steps,
        time_estimate: generated.time_estimate,
        cost_estimate: generated.cost_estimate,
        delivery_format: profile.delivery_preference || 'text',
        status: 'delivered',
        delivery_content: {
          text: {
            decision: generated.decision,
            why: generated.why_this_now,
            steps: generated.implementation_steps,
            time: generated.time_estimate,
            cost: generated.cost_estimate,
            outcome: generated.expected_outcome
          }
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert prescription:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save prescription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        prescription: prescription,
        source: "generated",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("generate-weekly-prescription error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
