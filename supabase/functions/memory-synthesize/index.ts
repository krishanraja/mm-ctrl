import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLLM } from "../_shared/llm-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Load hot + warm facts
    const { data: facts } = await supabase
      .from("user_memory")
      .select("id, fact_category, fact_label, fact_value, temperature, verification_status, confidence_score")
      .eq("user_id", userId)
      .eq("is_current", true)
      .is("archived_at", null)
      .in("temperature", ["hot", "warm"])
      .order("created_at", { ascending: false });

    if (!facts || facts.length < 5) {
      return new Response(
        JSON.stringify({
          success: true,
          patterns_found: 0,
          patterns_new: 0,
          patterns_updated: 0,
          patterns_confirmed: 0,
          message: "Need at least 5 facts to detect patterns",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build facts summary for LLM
    const factsSummary = facts.map((f: any) =>
      `[${f.id}] (${f.fact_category}) ${f.fact_value}`
    ).join("\n");

    // Call LLM for pattern detection (with built-in fallback chain)
    const result = await callLLM(
      {
        messages: [
          {
            role: "system",
            content: `You are analyzing facts about a person to identify behavioral patterns. Given these facts, identify:
- Recurring themes or priorities (type: preference)
- Things they consistently avoid or reject (type: anti_preference)
- Behavioral tendencies in how they work or decide (type: behavior)
- Potential blind spots based on what's missing or overemphasized (type: blindspot)
- Clear strengths evidenced by multiple facts (type: strength)

Only identify patterns supported by 2+ facts. Return JSON:
{"patterns": [{"pattern_type": "preference|anti_preference|behavior|blindspot|strength", "pattern_text": "specific actionable pattern", "confidence": 0.0-1.0, "supporting_fact_ids": ["uuid1", "uuid2"]}]}

Be specific and actionable, not generic. Max 10 patterns.`,
          },
          {
            role: "user",
            content: `Here are the facts:\n\n${factsSummary}`,
          },
        ],
        task: 'analysis',
        temperature: 0.3,
        max_tokens: 1500,
        json_output: true,
      },
      {
        functionName: 'memory-synthesize',
        userId: userId,
        useCache: false,
      },
    );

    if (!result.content) {
      throw new Error("No content in LLM response");
    }

    const parsed = JSON.parse(result.content);
    const detectedPatterns = parsed.patterns || [];

    let patternsNew = 0;
    let patternsUpdated = 0;
    let patternsConfirmed = 0;

    // Load existing patterns
    const { data: existingPatterns } = await supabase
      .from("user_patterns")
      .select("id, pattern_text, pattern_type, evidence_count, confidence, status")
      .eq("user_id", userId)
      .neq("status", "deprecated");

    for (const detected of detectedPatterns) {
      // Check if a similar pattern already exists (fuzzy match by type + text similarity)
      const existing = (existingPatterns || []).find((ep: any) =>
        ep.pattern_type === detected.pattern_type &&
        (ep.pattern_text.toLowerCase().includes(detected.pattern_text.toLowerCase().slice(0, 30)) ||
         detected.pattern_text.toLowerCase().includes(ep.pattern_text.toLowerCase().slice(0, 30)))
      );

      if (existing) {
        // Update existing pattern
        const newEvidence = (existing as any).evidence_count + 1;
        const newConfidence = Math.min(1, Math.max(detected.confidence, (existing as any).confidence));
        const newStatus = newConfidence > 0.8 && newEvidence > 3 ? "confirmed" : (existing as any).status;

        await supabase
          .from("user_patterns")
          .update({
            evidence_count: newEvidence,
            confidence: newConfidence,
            last_confirmed_at: new Date().toISOString(),
            source_facts: detected.supporting_fact_ids || [],
            status: newStatus,
          })
          .eq("id", (existing as any).id);

        patternsUpdated++;
        if (newStatus === "confirmed" && (existing as any).status !== "confirmed") {
          patternsConfirmed++;
        }
      } else {
        // Insert new pattern
        await supabase
          .from("user_patterns")
          .insert({
            user_id: userId,
            pattern_type: detected.pattern_type,
            pattern_text: detected.pattern_text,
            confidence: detected.confidence,
            evidence_count: 1,
            source_facts: detected.supporting_fact_ids || [],
            status: "emerging",
          });
        patternsNew++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        patterns_found: detectedPatterns.length,
        patterns_new: patternsNew,
        patterns_updated: patternsUpdated,
        patterns_confirmed: patternsConfirmed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
