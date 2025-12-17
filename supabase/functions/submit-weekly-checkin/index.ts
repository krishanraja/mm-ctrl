import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an executive-grade AI thinking partner.

The user is a time-poor senior leader. They are anxious about making good AI decisions and don't want a course.

Your job: turn a short weekly voice check-in into ONE sharp insight and ONE action for the week.

Hard rules:
- No fluff. No generic coaching. No long lists.
- Output MUST be valid JSON only.
- Keep it short enough to read in 10 seconds.

Return exactly:
{
  "insight": "1 sentence. Name the real tension in their week.",
  "action_text": "1 sentence. One thing to do this week.",
  "why_text": "1 sentence. Why this action matters.",
  "tags": ["optional", "short", "tags"]
}`;

function isoWeekKey(d = new Date()): string {
  // ISO week: https://en.wikipedia.org/wiki/ISO_week_date#Algorithms
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, asked_prompt_key, baseline_context } = await req.json();

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

    // Validate caller identity
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (userErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate insight/action (Lovable AI gateway preferred)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let generated = {
      insight: "You faced an AI decision this week — the key is turning uncertainty into one concrete question.",
      action_text: "Before your next AI-related decision, ask: “What would have to be true for this to be worth it in 90 days?”",
      why_text: "It forces clarity on assumptions before money, vendors, or politics lock you in.",
      tags: ["weekly", "decision"],
    };

    if (LOVABLE_API_KEY) {
      const userContent = `Weekly check-in transcript:\n"${transcript}"\n\nBaseline context (optional):\n${baseline_context ? JSON.stringify(baseline_context).slice(0, 2000) : "null"}\n`;

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
          temperature: 0.6,
        }),
      });

      if (aiResp.ok) {
        const data = await aiResp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) generated = JSON.parse(jsonMatch[0]);
          } catch {
            // fall back to deterministic copy
          }
        }
      }
    }

    const week = isoWeekKey();

    // Store check-in
    const { data: checkinRow, error: insertErr } = await supabase
      .from("leader_checkins" as never)
      .insert({
        user_id: userId,
        asked_prompt_key: typeof asked_prompt_key === "string" ? asked_prompt_key : "weekly_default",
        transcript,
        extracted_json: generated,
      } as never)
      .select("id")
      .single();

    if (insertErr) {
      console.error("leader_checkins insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to store check-in" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert weekly action (one per week)
    const { error: actionErr } = await supabase
      .from("leader_weekly_actions" as never)
      .upsert({
        user_id: userId,
        iso_week: week,
        action_text: String(generated.action_text ?? "").slice(0, 1000),
        why_text: String(generated.why_text ?? "").slice(0, 2000),
        source: "checkin",
      } as never, { onConflict: "user_id,iso_week" } as never);

    if (actionErr) {
      console.warn("weekly action upsert failed (non-blocking):", actionErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkinId: checkinRow?.id ?? null,
        isoWeek: week,
        ...generated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("submit-weekly-checkin error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

