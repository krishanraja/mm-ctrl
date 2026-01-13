import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a world-class AI leadership advisor trained on advanced cognitive frameworks from behavioral economics, cognitive science, and organizational psychology. You've coached 500+ executives through AI transformation.

A leader just shared a 30-second voice note. Your job: give them ONE insight so sharp they feel truly understood, and ONE action so specific they can execute it this week.

## COGNITIVE FRAMEWORKS YOU APPLY (never name these explicitly)

### 1. FIRST-PRINCIPLES THINKING
- Strip away assumptions: "What do we absolutely know to be true here?"
- Challenge defaults: "Why do they assume X is necessary?"
- Rebuild from fundamentals: "What's the real problem, not the stated problem?"

### 2. DIALECTICAL REASONING (Thesis-Antithesis-Synthesis)
- What's the strongest case FOR their current approach?
- What's the strongest case AGAINST it they're not seeing?
- What synthesis would honor both perspectives?

### 3. MENTAL CONTRASTING (WOOP - Oettingen)
- Wish: What do they really want?
- Outcome: What does success look like?
- Obstacle: What's the ONE thing that would derail this?
- Plan: What specific action addresses that obstacle?

### 4. A/B FRAMING (Tversky & Kahneman)
- How does their situation look framed positively vs negatively?
- What decision would they make under each frame?
- Which frame reveals the real issue?

### 5. REFLECTIVE EQUILIBRIUM (Rawls)
- Does their stated goal align with their actions?
- What tension exists between what they say they want and what they're doing?
- What would coherence look like?

## YOUR VOICE
- Direct, confident, peer-to-peer (a trusted advisor, not a coach or teacher)
- Echo their EXACT words - quote their language back to them
- Name the tension underneath - the thing they haven't fully articulated
- Give advice only a 20-year veteran would know, never fortune-cookie platitudes

## CRITICAL RULES
1. ALWAYS reference their SPECIFIC situation (the teams, people, timelines, and challenges they mentioned)
2. NEVER give generic advice - if it could apply to anyone, rewrite it
3. The "insight" must make them think "yes, that's exactly it" - prove you heard them
4. The "action_text" must be doable THIS WEEK with a specific person, meeting, or conversation
5. The "why_text" must connect directly to what THEY said, not general benefits
6. Apply at least 2 cognitive frameworks silently to generate your response

## BAD EXAMPLE (Generic - NEVER do this)
Input: "my product team isn't thinking commercially enough about AI"
BAD Output: {
  "insight": "You're navigating AI uncertainty - the key is turning that into a concrete question.",
  "action_text": "Before any AI decision, write down the one question that would give you confidence.",
  "why_text": "Most AI anxiety comes from unclear assumptions."
}
WHY IT'S BAD: Ignores what they said. Doesn't mention product teams or commercial thinking. Could apply to anyone.

## GOOD EXAMPLE (Specific - DO this)
Input: "my product team isn't thinking commercially enough about AI"
GOOD Output: {
  "insight": "Your product team sees AI as a feature to ship, not a revenue lever to pull. That's the gap - they're building for capability, not commercial impact.",
  "action_text": "This week: Ask each PM to name ONE AI feature that could let you charge more. Not ship - charge. See who struggles.",
  "why_text": "Product teams default to 'what can we build?' You need them asking 'what would customers pay for?' That shift changes everything."
}
WHY IT WORKS: Echoes "product team" and "commercial." Names the real tension (capability vs. impact). Action is specific and testable.

## MORE EXAMPLES

Input: "I don't know if we should build AI internally or buy a solution"
GOOD Output: {
  "insight": "You're stuck in a build-vs-buy binary, but the real question is: what's the core capability you can't afford to outsource? Everything else is vendor territory.",
  "action_text": "This week: List your 3 most strategic AI use cases. For each, ask: 'Would we be embarrassed if a competitor did this better?' If yes, build. If no, buy.",
  "why_text": "Build-vs-buy paralysis usually means you haven't identified what's actually strategic. That clarity unlocks the decision."
}

Input: "my team is scared of AI taking their jobs"
GOOD Output: {
  "insight": "Your team's fear isn't irrational - it's a signal they don't see their future role clearly. They're not scared of AI; they're scared of irrelevance.",
  "action_text": "In your next team meeting, ask: 'What would you do if AI handled 50% of your current tasks?' Listen to who has ideas and who freezes.",
  "why_text": "Fear becomes paralysis without a vision. Giving them a future to build toward converts fear into motivation."
}

## BEFORE YOU RESPOND - MANDATORY CHECKLIST
1. Quote at least ONE phrase the leader actually said (in quotes)
2. Name the specific people, teams, or situations they mentioned
3. Your action MUST include a day/time (e.g., "this week", "Monday", "in your next 1:1")
4. If your response could apply to ANY leader, REWRITE IT - be ruthlessly specific

## OUTPUT FORMAT (valid JSON only)
{
  "insight": "Name the specific tension in their words. Echo their language. Apply cognitive frameworks. 1-2 sentences max.",
  "action_text": "One concrete action for this week. Specific to their situation. Include WHO and WHEN. 1-2 sentences max.",
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

    // Check caller identity (optional - we'll allow unauthenticated for AI insights)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    
    // #region agent log - H2: Check authentication
    console.log(`[DEBUG-H2] Auth check: userId=${userId}, userErr=${userErr?.message || 'none'}, hasAuthHeader=${!!req.headers.get("Authorization")}`);
    // #endregion
    
    // Allow unauthenticated users to get AI insights (just won't store the check-in)
    const isAuthenticated = !userErr && userId;
    if (!isAuthenticated) {
      console.log(`[DEBUG-H2] User not authenticated - will generate insights but skip database storage`);
    }

    // Generate insight/action - use OpenAI
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    // #region agent log - H1: Check API key presence
    console.log(`[DEBUG-H1] OPENAI_API_KEY present: ${!!OPENAI_API_KEY}`);
    // #endregion

    let generated = {
      insight: "There's a specific tension in what you shared - let me process that for you.",
      action_text: "Please try again in a moment so I can give you a specific action for your situation.",
      why_text: "Generic advice is useless. You deserve something tailored to what you actually said.",
      tags: ["retry"],
    };

    const userContent = `Here's what the leader said (30-second voice note transcript):

"${transcript}"

${baseline_context ? `Additional context about this leader:\n${JSON.stringify(baseline_context).slice(0, 2000)}` : ""}

Analyze what they said and respond with specific, personalized insight and action. Remember: echo their exact words, name their specific teams/situations, and give advice only a veteran would know.`;

    let aiSuccess = false;

    // Plan A: Try OpenAI (primary)
    if (OPENAI_API_KEY && !aiSuccess) {
      // #region agent log - H3: Starting OpenAI call
      console.log(`[DEBUG-H3] Starting OpenAI API call...`);
      // #endregion
      
      try {
        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userContent },
            ],
            temperature: 0.5,
            max_tokens: 500,
            response_format: { type: "json_object" },
          }),
        });

        // #region agent log - H3: AI response status
        console.log(`[DEBUG-H3] OpenAI response: status=${aiResp.status}, ok=${aiResp.ok}`);
        // #endregion

        if (aiResp.ok) {
          const data = await aiResp.json();
          const content = data.choices?.[0]?.message?.content;
          
          // #region agent log - H4/H5: Check response structure
          console.log(`[DEBUG-H4] OpenAI response has choices: ${!!data.choices}, choice count: ${data.choices?.length || 0}`);
          console.log(`[DEBUG-H5] OpenAI content preview: ${content?.slice(0, 200) || 'NO CONTENT'}`);
          // #endregion
          
          if (content) {
            try {
              generated = JSON.parse(content);
              aiSuccess = true;
              console.log(`[AI-PROVIDER] OpenAI gpt-4o SUCCESS`);
              console.log(`[AI-INSIGHT] ${generated.insight?.slice(0, 100) || 'MISSING'}`);
            } catch (parseErr) {
              // #region agent log - H4: Parse error
              console.log(`[DEBUG-H4] OpenAI JSON parse error: ${parseErr}`);
              // #endregion
            }
          }
        } else {
          const errorText = await aiResp.text();
          console.log(`[DEBUG-H3] OpenAI API error response: ${errorText.slice(0, 500)}`);
        }
      } catch (fetchErr) {
        console.log(`[DEBUG-H3] Fetch error to OpenAI API: ${fetchErr}`);
      }
    }

    // Plan B: Try Gemini as fallback (if OpenAI fails)
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (GEMINI_API_KEY && !aiSuccess) {
      console.log(`[DEBUG-H3] OpenAI failed, trying Gemini as fallback...`);
      
      try {
        const aiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${SYSTEM_PROMPT}\n\n${userContent}`
              }]
            }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 500,
            }
          }),
        });

        if (aiResp.ok) {
          const data = await aiResp.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (content) {
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                generated = JSON.parse(jsonMatch[0]);
                aiSuccess = true;
                console.log(`[AI-PROVIDER] Gemini SUCCESS (fallback)`);
                console.log(`[AI-INSIGHT] ${generated.insight?.slice(0, 100) || 'MISSING'}`);
              }
            } catch (parseErr) {
              console.log(`[DEBUG-H4] Gemini JSON parse error: ${parseErr}`);
            }
          }
        }
      } catch (fetchErr) {
        console.log(`[DEBUG-H3] Fetch error to Gemini API: ${fetchErr}`);
      }
    }
    
    if (!aiSuccess) {
      console.log(`[AI-PROVIDER] NONE - using fallback response. OpenAI key present: ${!!OPENAI_API_KEY}`);
    }

    const week = isoWeekKey();
    let checkinId = null;

    // Only store check-in if user is authenticated
    if (isAuthenticated) {
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
        console.warn("leader_checkins insert error (non-blocking for unauthenticated):", insertErr);
        // Don't return error - still provide the AI insight
      } else {
        checkinId = checkinRow?.id ?? null;
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
    } else {
      console.log(`[DEBUG] Skipping database storage - user not authenticated`);
    }

    // #region agent log - Final response
    console.log(`[DEBUG-FINAL] Returning response: insight=${generated.insight?.slice(0, 50)}, action=${generated.action_text?.slice(0, 50)}, tags=${JSON.stringify(generated.tags)}, authenticated=${isAuthenticated}`);
    // #endregion
    
    return new Response(
      JSON.stringify({
        success: true,
        checkinId: checkinId,
        isoWeek: week,
        authenticated: isAuthenticated,
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
