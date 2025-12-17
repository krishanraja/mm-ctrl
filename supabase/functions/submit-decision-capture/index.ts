import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an executive-grade decision coach for leaders adopting AI.

The user speaks a real situation they are stuck on. Your output must be short, boardroom-ready, and specific to their context.

Hard rules:
- No generic advice.
- No long explanations.
- Output MUST be valid JSON only.

Return exactly:
{
  "three_questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ],
  "next_step": "1 sentence. The smallest next move.",
  "watchout": "1 sentence. A risk/bias/governance watchout (if relevant, otherwise a short neutral watchout)."
}`;

type GeneratedDecision = {
  three_questions: string[];
  next_step: string;
  watchout: string;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function coerceGeneratedDecision(value: unknown, fallback: GeneratedDecision): GeneratedDecision {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Record<string, unknown>;

  const three_questions = isStringArray(v.three_questions) ? v.three_questions.slice(0, 3) : fallback.three_questions;
  const next_step = typeof v.next_step === "string" ? v.next_step : fallback.next_step;
  const watchout = typeof v.watchout === "string" ? v.watchout : fallback.watchout;

  return { three_questions, next_step, watchout };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, context } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const fallbackGenerated: GeneratedDecision = {
      three_questions: [
        "What would have to be true for this to be a good decision in 90 days?",
        "What is the strongest argument against approving this right now?",
        "What is the one question that would expose vendor theatre vs real capability?",
      ],
      next_step: "Ask those three questions before you commit money, headcount, or reputation.",
      watchout: "Watch for confident claims without clear evaluation criteria or owner accountability.",
    };
    let generated: GeneratedDecision = fallbackGenerated;

    if (LOVABLE_API_KEY) {
      const userContent = `Decision capture transcript:\n"${transcript}"\n\nContext (optional JSON):\n${context ? JSON.stringify(context).slice(0, 2000) : "null"}\n\nReturn boardroom-ready questions.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          temperature: 0.5,
        }),
      });

      if (aiResp.ok) {
        const data = await aiResp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]) as unknown;
              generated = coerceGeneratedDecision(parsed, fallbackGenerated);
            }
          } catch {
            // fallback remains
          }
        }
      }
    }

    // Store capture
    const { data: row, error: insertErr } = await supabase
      .from("leader_decision_captures" as never)
      .insert({
        user_id: userId,
        transcript,
        context_json: context ?? {},
        three_questions_json: generated.three_questions,
        next_step: generated.next_step.slice(0, 2000),
        watchout: generated.watchout.slice(0, 2000),
      } as never)
      .select("id")
      .single();

    if (insertErr) {
      console.error("leader_decision_captures insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to store decision capture" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        captureId: row?.id ?? null,
        ...generated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("submit-decision-capture error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

