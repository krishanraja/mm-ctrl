/**
 * get-industry-seeds Edge Function
 *
 * Returns a curated list of beats + recommended entities for a user's
 * industry. Powers the one-tap "here are the beats creators usually care
 * about" prompt shown to new users before they have declared anything.
 *
 * Matching order:
 *   1. Explicit industry_key in the request body (admin/debug use).
 *   2. The authenticated user's industry fact from user_memory.
 *   3. Fuzzy match: lowercase-substring against every row's aliases + key.
 *   4. Fallback row: industry_key='generic'.
 *
 * Auth: authenticated user only. Read-only.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IndustryRow {
  industry_key: string;
  label: string;
  aliases: string[];
  beats: Array<{ label: string }>;
  entities: Array<{ label: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Parse optional request body.
    let explicitKey: string | undefined;
    let rawIndustry: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.industry_key === "string") explicitKey = body.industry_key;
      if (typeof body?.industry === "string") rawIndustry = body.industry;
    } catch { /* no body or invalid JSON */ }

    // Resolve the user's industry if not provided in the request.
    if (!explicitKey && !rawIndustry) {
      const { data: facts } = await supabase
        .from("user_memory")
        .select("fact_value")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .in("fact_key", ["industry", "vertical"])
        .order("confidence_score", { ascending: false })
        .limit(1);
      if (facts && facts.length > 0 && typeof facts[0].fact_value === "string") {
        rawIndustry = facts[0].fact_value;
      }
    }

    // Load the full library once; pick the best match in-memory. Library is
    // small (~11 rows), so one SELECT is cheaper than multiple targeted queries.
    const { data: rowsRaw, error } = await supabase
      .from("industry_beat_library")
      .select("industry_key, label, aliases, beats, entities")
      .eq("is_active", true);
    if (error) throw error;
    const rows = (rowsRaw ?? []) as IndustryRow[];

    const matched = matchIndustry(rows, explicitKey, rawIndustry);

    // Filter out items the user has already added (as beats/entities or
    // excluded) so we never suggest a duplicate or a dead topic.
    const { data: existingInterests } = await supabase
      .from("briefing_interests")
      .select("kind, text")
      .eq("user_id", user.id)
      .eq("is_active", true);
    const existing = new Set<string>();
    for (const row of (existingInterests ?? []) as Array<{ kind: string; text: string }>) {
      existing.add(`${row.kind}:${row.text.trim().toLowerCase()}`);
    }

    const beats = (matched?.beats ?? []).filter(
      (b) => !existing.has(`beat:${b.label.toLowerCase()}`) && !existing.has(`exclude:${b.label.toLowerCase()}`),
    );
    const entities = (matched?.entities ?? []).filter(
      (e) => !existing.has(`entity:${e.label.toLowerCase()}`) && !existing.has(`exclude:${e.label.toLowerCase()}`),
    );

    return new Response(
      JSON.stringify({
        industry_key: matched?.industry_key ?? null,
        industry_label: matched?.label ?? null,
        resolved_from: explicitKey ? "explicit" : rawIndustry ? "user_memory" : "fallback",
        raw_industry: rawIndustry ?? null,
        beats,
        entities,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-industry-seeds error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/**
 * Resolve the best industry row for an explicit key or raw industry string.
 * Falls back to the 'generic' row when nothing matches — there is always
 * something to suggest.
 */
function matchIndustry(
  rows: IndustryRow[],
  explicitKey: string | undefined,
  rawIndustry: string | undefined,
): IndustryRow | null {
  if (rows.length === 0) return null;
  const byKey = new Map(rows.map((r) => [r.industry_key, r]));

  if (explicitKey && byKey.has(explicitKey)) return byKey.get(explicitKey)!;

  if (rawIndustry && rawIndustry.trim().length > 0) {
    const needle = rawIndustry.trim().toLowerCase();
    if (byKey.has(needle)) return byKey.get(needle)!;

    // Rank by longest-alias match so "creator economy" beats "creator" beats nothing.
    let best: { row: IndustryRow; score: number } | null = null;
    for (const row of rows) {
      const candidates = [row.industry_key.toLowerCase(), ...row.aliases.map((a) => a.toLowerCase())];
      for (const c of candidates) {
        if (!c) continue;
        const matches = needle.includes(c) || c.includes(needle);
        if (!matches) continue;
        const score = c.length;
        if (!best || score > best.score) best = { row, score };
      }
    }
    if (best) return best.row;
  }

  return byKey.get("generic") ?? null;
}
