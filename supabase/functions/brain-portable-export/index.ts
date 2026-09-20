import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getResponseHeaders } from "../_shared/security-headers.ts";
import { createPortableBrainPackage } from "../_shared/portable-brain-package.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: getResponseHeaders() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return response({ error: "Unauthorized" }, 401);

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return response({ error: "Unauthorized" }, 401);

    const [factsResult, patternsResult, decisionsResult] = await Promise.all([
      client
        .from("user_memory")
        .select("id, fact_key, fact_category, fact_label, fact_value, fact_context, confidence_score, is_high_stakes, verification_status, source_type, temperature, tags, fact_subtype, importance, created_at")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .is("archived_at", null),
      client
        .from("user_patterns")
        .select("pattern_type, pattern_text, confidence, evidence_count, status, explanation, created_at")
        .eq("user_id", user.id)
        .in("status", ["emerging", "confirmed"]),
      client
        .from("user_decisions")
        .select("decision_text, rationale, context_snapshot, status, source, created_at")
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);
    if (factsResult.error) throw new Error(`portable_export_facts_failed:${factsResult.error.code ?? "unknown"}`);
    if (patternsResult.error) throw new Error(`portable_export_patterns_failed:${patternsResult.error.code ?? "unknown"}`);
    if (decisionsResult.error) throw new Error(`portable_export_decisions_failed:${decisionsResult.error.code ?? "unknown"}`);

    const brainPackage = await createPortableBrainPackage({
      facts: (factsResult.data ?? []).map((row) => ({
        fact_key: row.fact_key,
        fact_category: row.fact_category,
        fact_label: row.fact_label,
        fact_value: row.fact_value,
        fact_context: row.fact_context ?? null,
        confidence_score: Number(row.confidence_score),
        is_high_stakes: row.is_high_stakes ?? false,
        verification_status: row.verification_status,
        source_type: row.source_type,
        temperature: row.temperature,
        tags: row.tags ?? [],
        fact_subtype: row.fact_subtype ?? null,
        importance: row.importance ?? null,
        created_at: row.created_at,
      })),
      patterns: (patternsResult.data ?? []).map((row) => ({
        pattern_type: row.pattern_type,
        pattern_text: row.pattern_text,
        confidence: Number(row.confidence),
        evidence_count: row.evidence_count,
        status: row.status,
        explanation: row.explanation ?? null,
        created_at: row.created_at,
      })),
      decisions: (decisionsResult.data ?? []).map((row) => ({
        decision_text: row.decision_text,
        rationale: row.rationale ?? null,
        context_snapshot: row.context_snapshot ?? {},
        status: row.status,
        source: row.source,
        created_at: row.created_at,
      })),
    });

    const touchedFactIds = (factsResult.data ?? []).map((row) => row.id).filter(Boolean);
    if (touchedFactIds.length) {
      const { error } = await client.rpc("touch_memory_facts", { p_fact_ids: touchedFactIds });
      if (error) throw new Error(`portable_export_reliance_failed:${error.code ?? "unknown"}`);
    }

    return response({
      package: brainPackage,
      package_fingerprint: brainPackage.manifest.content_sha256,
      primary_filename: `ctrl-brain-${brainPackage.manifest.content_sha256.slice(0, 12)}.json`,
      primary_mime: "application/json",
      touched_fact_ids: touchedFactIds,
    });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Portable export failed" }, 500);
  }
});
