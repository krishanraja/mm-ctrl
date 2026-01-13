import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a decision advisor for multi-venture operators.

Your job: Answer "should I do X or Y" questions with a CLEAR recommendation. Not pros/cons. ONE answer.

Hard rules:
- Output MUST be valid JSON only
- Give ONE clear recommendation (X or Y, not both)
- Reference their specific business context
- Explain why this choice fits their situation
- Mention risks if relevant
- Suggest alternative if neither fits

Return exactly:
{
  "recommendation": "Choose X (or Y, or neither)",
  "reasoning": "Why this fits their business mix, budget, and technical comfort (2-3 sentences)",
  "risk_assessment": "What to watch out for (1 sentence, optional)",
  "alternative_suggestion": "If neither X nor Y fits, what should they consider instead (optional)"
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

    const { question_text, question_audio_url } = await req.json();

    if (!question_text && !question_audio_url) {
      return new Response(JSON.stringify({ error: "Question text or audio URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // If audio URL provided, transcribe it (simplified - in production, use voice-transcribe function)
    let finalQuestion = question_text || "";
    if (question_audio_url && !question_text) {
      // For now, assume question_text is provided
      // In production, call voice-transcribe function here
      finalQuestion = "Please provide question text directly";
    }

    // Build context
    const businessLines = Array.isArray(profile.business_lines) 
      ? profile.business_lines 
      : [];
    
    const context = {
      businessLines: businessLines,
      inboxCount: profile.inbox_count,
      technicalComfort: profile.technical_comfort,
      monthlyBudget: profile.monthly_budget,
      topPainPoints: profile.top_pain_points || [],
    };

    // Generate recommendation using LLM
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    let generated = {
      recommendation: "Based on your business mix, I recommend X",
      reasoning: "This fits your current setup and addresses your pain points",
      risk_assessment: null as string | null,
      alternative_suggestion: null as string | null,
    };

    if (OPENAI_API_KEY || GEMINI_API_KEY) {
      const userContent = `Operator Profile:
- Business lines: ${JSON.stringify(context.businessLines)}
- Inbox count: ${context.inboxCount}
- Technical comfort: ${context.technicalComfort}/5
- Monthly budget: ${context.monthlyBudget}
- Top pain points: ${context.topPainPoints.join(', ')}

Question: ${finalQuestion}

Give ONE clear recommendation. Reference their specific context.`;

      // Try OpenAI first, then Gemini as fallback
      let apiKey = OPENAI_API_KEY;
      let apiUrl = "https://api.openai.com/v1/chat/completions";
      let model = "gpt-4o-mini";

      // Try OpenAI first
      if (OPENAI_API_KEY) {
        try {
          const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userContent },
              ],
              temperature: 0.7,
              response_format: { type: "json_object" },
            }),
          });

          if (aiResp.ok) {
            const data = await aiResp.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              try {
                const parsed = JSON.parse(content);
                if (parsed.recommendation) generated.recommendation = parsed.recommendation.slice(0, 500);
                if (parsed.reasoning) generated.reasoning = parsed.reasoning.slice(0, 1000);
                if (parsed.risk_assessment) generated.risk_assessment = parsed.risk_assessment.slice(0, 300);
                if (parsed.alternative_suggestion) generated.alternative_suggestion = parsed.alternative_suggestion.slice(0, 300);
              } catch (e) {
                console.warn("Failed to parse OpenAI response:", e);
              }
            }
          }
        } catch (e) {
          console.warn("OpenAI call failed, trying Gemini:", e);
          // Fall through to Gemini
        }
      }

      // Try Gemini as fallback
      if (GEMINI_API_KEY && (!OPENAI_API_KEY || generated.recommendation === "Based on your business mix, I recommend X")) {
        try {
          const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
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
                temperature: 0.7,
                maxOutputTokens: 1000,
              }
            }),
          });

          if (geminiResp.ok) {
            const data = await geminiResp.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed.recommendation) generated.recommendation = parsed.recommendation.slice(0, 500);
                  if (parsed.reasoning) generated.reasoning = parsed.reasoning.slice(0, 1000);
                  if (parsed.risk_assessment) generated.risk_assessment = parsed.risk_assessment.slice(0, 300);
                  if (parsed.alternative_suggestion) generated.alternative_suggestion = parsed.alternative_suggestion.slice(0, 300);
                }
              } catch (e) {
                console.warn("Failed to parse Gemini response:", e);
              }
            }
          }
        } catch (e) {
          console.warn("Gemini call failed, using default:", e);
        }
      }
    }

    // Store advisor session
    const { data: session, error: insertError } = await supabase
      .from("operator_advisor_sessions")
      .insert({
        operator_profile_id: profile.id,
        question_text: finalQuestion,
        question_audio_url: question_audio_url || null,
        recommendation: generated.recommendation,
        reasoning: generated.reasoning,
        risk_assessment: generated.risk_assessment,
        alternative_suggestion: generated.alternative_suggestion,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert advisor session:", insertError);
      // Still return the recommendation even if storage fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: generated.recommendation,
        reasoning: generated.reasoning,
        risk_assessment: generated.risk_assessment,
        alternative_suggestion: generated.alternative_suggestion,
        session_id: session?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("operator-decision-advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
