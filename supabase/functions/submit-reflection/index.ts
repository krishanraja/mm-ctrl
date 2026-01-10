import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

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

    const { prompt_id, response_text, response_audio_url } = await req.json();

    if (!prompt_id || (!response_text && !response_audio_url)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract themes and sentiment (if OpenAI key available)
    let extractedThemes: string[] = [];
    let sentimentScore: number | null = null;

    if (openaiApiKey && response_text) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Extract 3-5 key themes from this executive reflection. Return JSON: {themes: string[], sentiment: number} where sentiment is -1 to 1.",
              },
              {
                role: "user",
                content: response_text,
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const parsed = JSON.parse(aiData.choices[0]?.message?.content || "{}");
          extractedThemes = parsed.themes || [];
          sentimentScore = parsed.sentiment || null;
        }
      } catch (aiErr) {
        console.warn("AI theme extraction failed (non-blocking):", aiErr);
      }
    }

    // Store reflection
    const { data: reflection, error: insertError } = await supabase
      .from("leader_reflections" as never)
      .insert({
        user_id: userId,
        prompt_id,
        response_text: response_text || null,
        response_audio_url: response_audio_url || null,
        sentiment_score: sentimentScore,
        extracted_themes: extractedThemes,
      } as never)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update prompt history to mark as responded
    await supabase
      .from("leader_prompt_history" as never)
      .update({ responded: true })
      .eq("user_id", userId)
      .eq("prompt_id", prompt_id)
      .order("shown_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        reflection_id: reflection.id,
        themes: extractedThemes,
        sentiment: sentimentScore,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("submit-reflection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
