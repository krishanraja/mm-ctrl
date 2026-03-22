import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llm-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const SYSTEM_PROMPT = `You are an executive-grade AI thinking partner.

The user is a time-poor senior leader. They need exactly ONE action this week based on their baseline diagnostic.

Hard rules:
- No fluff. No generic coaching.
- Output MUST be valid JSON only.
- One action. One sentence. Actionable.

Return exactly:
{
  "action_text": "1 sentence. One thing to do this week.",
  "why_text": "1 sentence. Why this action matters for their specific gaps."
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

    const week = isoWeekKey();
    const { baseline_context } = await req.json().catch(() => ({}));

    // Check if action already exists for this week
    const { data: existing } = await supabase
      .from("leader_weekly_actions" as never)
      .select("action_text, why_text, iso_week")
      .eq("user_id", userId)
      .eq("iso_week", week)
      .maybeSingle();

    if (existing?.action_text) {
      return new Response(
        JSON.stringify({
          success: true,
          action_text: existing.action_text,
          why_text: existing.why_text,
          iso_week: existing.iso_week,
          source: "existing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate new action
    let generated = {
      action_text: "Before your next AI-related decision, ask: 'What would have to be true for this to be worth it in 90 days?'",
      why_text: "It forces clarity on assumptions before money, vendors, or politics lock you in.",
    };

    if (baseline_context) {
      const userContent = `Baseline context:\n${JSON.stringify(baseline_context).slice(0, 2000)}\n\nGenerate ONE action for this week.`;

      try {
        const result = await callLLM(
          {
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userContent },
            ],
            task: "simple",
            temperature: 0.6,
            json_output: true,
          },
          { functionName: "get-or-generate-weekly-action" },
        );

        if (result.content) {
          try {
            const parsed = JSON.parse(result.content) as Record<string, unknown>;
            if (typeof parsed.action_text === "string") generated.action_text = parsed.action_text.slice(0, 1000);
            if (typeof parsed.why_text === "string") generated.why_text = parsed.why_text.slice(0, 2000);
          } catch {
            // fall back to deterministic copy
          }
        }
      } catch (err) {
        console.warn("LLM API error (non-blocking):", err);
      }
    }

    // Upsert weekly action
    const { error: upsertErr } = await supabase
      .from("leader_weekly_actions" as never)
      .upsert({
        user_id: userId,
        iso_week: week,
        action_text: generated.action_text.slice(0, 1000),
        why_text: generated.why_text.slice(0, 2000),
        source: "generated",
      } as never, { onConflict: "user_id,iso_week" } as never);

    if (upsertErr) {
      console.warn("weekly action upsert failed (non-blocking):", upsertErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action_text: generated.action_text,
        why_text: generated.why_text,
        iso_week: week,
        source: "generated",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-or-generate-weekly-action error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
