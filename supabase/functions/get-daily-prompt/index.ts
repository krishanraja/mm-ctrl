import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Daily provocation prompts (7-day rotation minimum)
const DAILY_PROVOCATIONS = [
  { id: 'avoid-1', question: "What's one decision you're avoiding this week?" },
  { id: 'cut-1', question: "If you had to cut one initiative, which would it be?" },
  { id: 'blind-1', question: "What would your team say is your blind spot?" },
  { id: 'risk-1', question: "What's the riskiest bet you're considering?" },
  { id: 'delegate-1', question: "Who on your team is ready for more responsibility?" },
  { id: 'restart-1', question: "What would you do differently if you started over?" },
  { id: 'metric-1', question: "What's the one metric you're not tracking but should be?" },
];

// Contextual prompts based on user's tensions/risks
const CONTEXTUAL_PROMPTS: Record<string, string> = {
  team_alignment: "How aligned is your team on AI priorities today?",
  delegation: "What did you delegate this week?",
  shadow_ai: "Do you know what AI tools your team is using?",
  data_quality: "What's one data quality issue blocking your AI progress?",
  governance: "What AI governance decision are you putting off?",
};

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

    // Get user's assessment data for contextual prompts
    const { data: assessment } = await supabase
      .from("leader_assessments" as never)
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let topTensionKey: string | null = null;
    let topRiskKey: string | null = null;

    if (assessment?.id) {
      // Get top tension
      const { data: tension } = await supabase
        .from("leader_tensions" as never)
        .select("dimension_key")
        .eq("assessment_id", assessment.id)
        .order("severity_score", { ascending: false })
        .limit(1)
        .single();
      topTensionKey = tension?.dimension_key ?? null;

      // Get top risk
      const { data: risk } = await supabase
        .from("leader_risk_signals" as never)
        .select("risk_key")
        .eq("assessment_id", assessment.id)
        .order("severity_level", { ascending: false })
        .limit(1)
        .single();
      topRiskKey = risk?.risk_key ?? null;
    }

    // Get prompt history (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentPrompts } = await supabase
      .from("leader_prompt_history" as never)
      .select("prompt_id")
      .eq("user_id", userId)
      .gte("shown_at", sevenDaysAgo.toISOString());

    const recentPromptIds = new Set(recentPrompts?.map((p: any) => p.prompt_id) ?? []);

    // Try contextual prompt first (if user has relevant tension/risk)
    let selectedPrompt = null;
    if (topTensionKey && CONTEXTUAL_PROMPTS[topTensionKey] && !recentPromptIds.has(`contextual-${topTensionKey}`)) {
      selectedPrompt = {
        id: `contextual-${topTensionKey}`,
        question: CONTEXTUAL_PROMPTS[topTensionKey],
        category: 'contextual',
      };
    } else if (topRiskKey && CONTEXTUAL_PROMPTS[topRiskKey] && !recentPromptIds.has(`contextual-${topRiskKey}`)) {
      selectedPrompt = {
        id: `contextual-${topRiskKey}`,
        question: CONTEXTUAL_PROMPTS[topRiskKey],
        category: 'contextual',
      };
    } else {
      // Fall back to daily provocation (rotate based on day of week)
      const dayOfWeek = new Date().getDay();
      const availablePrompts = DAILY_PROVOCATIONS.filter(p => !recentPromptIds.has(p.id));
      if (availablePrompts.length > 0) {
        // Use day of week to select, but avoid recent prompts
        const index = dayOfWeek % availablePrompts.length;
        selectedPrompt = {
          ...availablePrompts[index],
          category: 'provocation',
        };
      } else {
        // All prompts shown recently, use day-based rotation
        const index = dayOfWeek % DAILY_PROVOCATIONS.length;
        selectedPrompt = {
          ...DAILY_PROVOCATIONS[index],
          category: 'provocation',
        };
      }
    }

    if (!selectedPrompt) {
      // Fallback
      selectedPrompt = {
        id: 'default-1',
        question: "What's one decision you're avoiding this week?",
        category: 'provocation',
      };
    }

    // Record that we showed this prompt
    await supabase
      .from("leader_prompt_history" as never)
      .insert({
        user_id: userId,
        prompt_id: selectedPrompt.id,
        shown_at: new Date().toISOString(),
        responded: false,
        skipped: false,
      } as never);

    return new Response(
      JSON.stringify({
        success: true,
        prompt: {
          id: selectedPrompt.id,
          question: selectedPrompt.question,
          category: selectedPrompt.category,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-daily-prompt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
