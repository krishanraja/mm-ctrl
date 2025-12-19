import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a 20-year AI transformation leader and executive coach. You've worked with hundreds of senior leaders navigating AI adoption.

A leader just shared a 30-second voice note about their AI challenge. Your job: give them ONE insight so sharp they feel understood, and ONE action so specific they can do it this week.

## Your Voice
- Direct, confident, peer-to-peer (not a teacher or coach)
- Acknowledge EXACTLY what they said - echo their specific words, teams, situations
- Name the real tension underneath their words - the thing they haven't fully articulated
- Give advice only a veteran would know, not generic "communicate more" platitudes

## Hidden Frameworks You Apply (never name these)
- First-Principles: "What's the real problem here, stripped of assumptions?"
- Dialectical Tension: "What's the opposing view they're not seeing?"
- Mental Contrasting: "What obstacle would derail this if they don't address it?"

## Critical Rules
1. ALWAYS reference their SPECIFIC situation (product team, commercial thinking, board, timeline, etc.)
2. NEVER give generic advice that could apply to anyone - if it sounds like a fortune cookie, rewrite it
3. The "insight" should make them think "yes, that's exactly it" - it shows you heard them
4. The "action_text" should be doable THIS WEEK, with a specific person or conversation named if possible
5. The "why_text" should connect to their exact situation, not general benefits

## Bad Example (Generic - NEVER do this)
Input: "my product team isn't thinking commercially enough about AI"
BAD Output: {
  "insight": "You're navigating AI uncertainty - the key is turning that into a concrete question.",
  "action_text": "Before any AI decision, write down the one question that would give you confidence.",
  "why_text": "Most AI anxiety comes from unclear assumptions."
}
This is terrible because it ignores what they said about product teams and commercial thinking.

## Good Example (Specific - DO this)
Input: "my product team isn't thinking commercially enough about AI"
GOOD Output: {
  "insight": "Your product team sees AI as a feature to ship, not a revenue lever to pull. That's the gap - they're building for capability, not commercial impact.",
  "action_text": "This week: Ask each PM to name ONE AI feature that could let you charge more. Not ship - charge. See who struggles.",
  "why_text": "Product teams default to 'what can we build?' You need them asking 'what would customers pay for?' That shift changes everything."
}

## Output Format (valid JSON only)
{
  "insight": "Name the specific tension in their words. Echo their language. 1-2 sentences max.",
  "action_text": "One concrete action for this week. Specific to their situation. 1-2 sentences max.",
  "why_text": "Why this matters - connect it to what they said. 1 sentence.",
  "tags": ["2-3", "short", "tags"]
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

    // #region agent log - H1: Check transcript received
    console.log(`[DEBUG-H1] Transcript received: ${transcript?.length || 0} chars, type: ${typeof transcript}`);
    // #endregion

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
    
    // #region agent log - H2: Check authentication
    console.log(`[DEBUG-H2] Auth check: userId=${userId}, userErr=${userErr?.message || 'none'}, hasAuthHeader=${!!req.headers.get("Authorization")}`);
    // #endregion
    
    if (userErr || !userId) {
      console.log(`[DEBUG-H2] UNAUTHORIZED - returning 401`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate insight/action (Lovable AI gateway preferred)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // #region agent log - H1: Check API key presence
    console.log(`[DEBUG-H1] LOVABLE_API_KEY present: ${!!LOVABLE_API_KEY}, length: ${LOVABLE_API_KEY?.length || 0}`);
    // #endregion

    let generated = {
      insight: "There's a specific tension in what you shared - let me process that for you.",
      action_text: "Please try again in a moment so I can give you a specific action for your situation.",
      why_text: "Generic advice is useless. You deserve something tailored to what you actually said.",
      tags: ["retry"],
    };

    if (LOVABLE_API_KEY) {
      // #region agent log - H3: Starting AI call
      console.log(`[DEBUG-H3] Starting Lovable AI gateway call...`);
      // #endregion
      
      const userContent = `Here's what the leader said (30-second voice note transcript):

"${transcript}"

${baseline_context ? `Additional context about this leader:\n${JSON.stringify(baseline_context).slice(0, 2000)}` : ""}

Analyze what they said and respond with specific, personalized insight and action. Remember: echo their exact words, name their specific teams/situations, and give advice only a veteran would know.`;

      try {
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
            temperature: 0.7,
          }),
        });

        // #region agent log - H3: AI response status
        console.log(`[DEBUG-H3] Lovable AI response: status=${aiResp.status}, ok=${aiResp.ok}`);
        // #endregion

        if (aiResp.ok) {
          const data = await aiResp.json();
          const content = data.choices?.[0]?.message?.content;
          
          // #region agent log - H4/H5: Check response structure
          console.log(`[DEBUG-H4] Response has choices: ${!!data.choices}, choice count: ${data.choices?.length || 0}`);
          console.log(`[DEBUG-H5] Content preview: ${content?.slice(0, 200) || 'NO CONTENT'}`);
          // #endregion
          
          if (content) {
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              // #region agent log - H4: JSON parsing
              console.log(`[DEBUG-H4] JSON match found: ${!!jsonMatch}, match length: ${jsonMatch?.[0]?.length || 0}`);
              // #endregion
              if (jsonMatch) {
                generated = JSON.parse(jsonMatch[0]);
                // #region agent log - H5: Parsed result
                console.log(`[DEBUG-H5] Parsed insight: ${generated.insight?.slice(0, 50) || 'MISSING'}`);
                console.log(`[DEBUG-H5] Parsed action: ${generated.action_text?.slice(0, 50) || 'MISSING'}`);
                // #endregion
              }
            } catch (parseErr) {
              // #region agent log - H4: Parse error
              console.log(`[DEBUG-H4] JSON parse error: ${parseErr}`);
              // #endregion
            }
          }
        } else {
          // #region agent log - H3: API error details
          const errorText = await aiResp.text();
          console.log(`[DEBUG-H3] Lovable API error response: ${errorText.slice(0, 500)}`);
          // #endregion
        }
      } catch (fetchErr) {
        // #region agent log - H3: Fetch error
        console.log(`[DEBUG-H3] Fetch error to Lovable API: ${fetchErr}`);
        // #endregion
      }
    } else {
      // #region agent log - H1: No API key
      console.log(`[DEBUG-H1] LOVABLE_API_KEY not set - using fallback response`);
      // #endregion
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

    // #region agent log - Final response
    console.log(`[DEBUG-FINAL] Returning response: insight=${generated.insight?.slice(0, 50)}, action=${generated.action_text?.slice(0, 50)}, tags=${JSON.stringify(generated.tags)}`);
    // #endregion
    
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
    // #region agent log - Top-level error
    console.error(`[DEBUG-ERROR] submit-weekly-checkin top-level error: ${error}`);
    // #endregion
    console.error("submit-weekly-checkin error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
