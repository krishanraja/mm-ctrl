import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llm-utils.ts";

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

    // Get user's reflections (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: reflections } = await supabase
      .from("leader_reflections" as never)
      .select("id, response_text, extracted_themes, created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!reflections || reflections.length < 3) {
      return new Response(
        JSON.stringify({
          success: true,
          patterns: [],
          message: "Need at least 3 reflections to detect patterns",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use AI to detect patterns
    const patterns: Array<{
      pattern_type: string;
      description: string;
      evidence_reflection_ids: string[];
      confidence_score: number;
    }> = [];

    try {
      const reflectionTexts = reflections
        .map((r: any) => r.response_text)
        .filter(Boolean)
        .join("\n\n---\n\n");

      const result = await callLLM(
        {
          messages: [
            {
              role: "system",
              content: `Analyze these executive reflections and detect behavioral patterns. Return JSON array: [{pattern_type: "avoidance"|"strength"|"blind_spot", description: string, confidence_score: 0-1}]. Focus on recurring themes, decision-making patterns, and blind spots.`,
            },
            {
              role: "user",
              content: reflectionTexts,
            },
          ],
          task: "simple",
          json_output: true,
        },
        { functionName: "detect-patterns" },
      );

      const parsed = JSON.parse(result.content || "{}");
      const detectedPatterns = parsed.patterns || [];

      for (const pattern of detectedPatterns) {
        // Find evidence reflections
        const evidenceIds = reflections
          .filter((r: any) => {
            const themes = r.extracted_themes || [];
            return themes.some((t: string) =>
              pattern.description.toLowerCase().includes(t.toLowerCase()) ||
              t.toLowerCase().includes(pattern.description.toLowerCase().split(" ")[0])
            );
          })
          .map((r: any) => r.id)
          .slice(0, 5);

        patterns.push({
          pattern_type: pattern.pattern_type || "blind_spot",
          description: pattern.description,
          evidence_reflection_ids: evidenceIds,
          confidence_score: pattern.confidence_score || 0.7,
        });
      }
    } catch (aiErr) {
      console.warn("AI pattern detection failed (non-blocking):", aiErr);
    }

    // Store patterns (insert new ones, update existing)
    for (const pattern of patterns) {
      if (pattern.confidence_score >= 0.6) {
        // Check if pattern already exists
        const { data: existing } = await supabase
          .from("leader_patterns" as never)
          .select("id")
          .eq("user_id", userId)
          .eq("pattern_type", pattern.pattern_type)
          .eq("description", pattern.description)
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from("leader_patterns" as never)
            .update({
              evidence_reflection_ids: pattern.evidence_reflection_ids,
              confidence_score: pattern.confidence_score,
              surfaced_at: new Date().toISOString(),
            } as never)
            .eq("id", existing.id);
        } else {
          // Insert new
          await supabase
            .from("leader_patterns" as never)
            .insert({
              user_id: userId,
              pattern_type: pattern.pattern_type,
              description: pattern.description,
              evidence_reflection_ids: pattern.evidence_reflection_ids,
              confidence_score: pattern.confidence_score,
              surfaced_at: new Date().toISOString(),
            } as never);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        patterns: patterns.map((p) => ({
          type: p.pattern_type,
          description: p.description,
          confidence: p.confidence_score,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("detect-patterns error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
