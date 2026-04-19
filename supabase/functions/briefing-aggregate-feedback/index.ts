/**
 * briefing-aggregate-feedback Edge Function
 *
 * Scans recent not_useful reactions in briefing_feedback, groups by
 * (user, lens_item_signature), and writes a weight_delta = -0.4 row to
 * briefing_lens_feedback once a signature has accumulated 3+ negatives.
 *
 * Run modes:
 *   - No body: aggregate for ALL users with recent feedback.
 *   - { user_id: "..." }: aggregate just that user (useful for inline calls
 *     from generate-briefing before a generation to keep the delta fresh
 *     without requiring a cron).
 *
 * Auth: service-role only. Schedule via pg_cron or Supabase scheduled
 * function. A future iteration can flip to a lightweight incremental run.
 *
 * Idempotent: upserts on (user_id, signature, source='not_useful_aggregate')
 * and updates evidence_count. Existing 'kill' rows are independent and not
 * touched.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeLensSignature } from "../_shared/lens-signature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WINDOW_DAYS = 30;
const PROMOTE_THRESHOLD = 3;
const AGGREGATE_DELTA = -0.4;

interface FeedbackRow {
  lens_item_id: string | null;
  briefing_id: string;
}
interface BriefingRow {
  id: string;
  user_id: string;
  context_snapshot: { lens?: Array<{ id: string; type: string; text: string }> } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

    // This function is only callable with the service role key (via direct
    // call from cron or another edge function). We accept the Authorization
    // header as a service-role JWT; do NOT expose it to end-user auth.
    const authHeader = req.headers.get("Authorization") ?? "";
    const providedToken = authHeader.replace(/^Bearer\s+/i, "");
    if (providedToken !== supabaseServiceKey) {
      // Also allow anon-key + service context (for locally-signed requests).
      return new Response(
        JSON.stringify({ error: "Service role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const scopeUserId = typeof body.user_id === "string" ? body.user_id as string : null;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Pull recent not_useful rows with a lens_item_id (v2 feedback only).
    let fbQuery = supabase
      .from("briefing_feedback")
      .select("lens_item_id, briefing_id")
      .eq("reaction", "not_useful")
      .not("lens_item_id", "is", null)
      .gte("created_at", since);
    const { data: feedbackRaw, error: fbErr } = await fbQuery;
    if (fbErr) throw fbErr;
    const feedbackRows = (feedbackRaw ?? []) as FeedbackRow[];
    if (feedbackRows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, scanned: 0, promoted: 0, users_touched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Load briefings referenced by the feedback, filtered to our scope.
    const briefingIds = [...new Set(feedbackRows.map((r) => r.briefing_id))];
    let brQuery = supabase
      .from("briefings")
      .select("id, user_id, context_snapshot")
      .in("id", briefingIds);
    if (scopeUserId) brQuery = brQuery.eq("user_id", scopeUserId);
    const { data: briefingsRaw, error: brErr } = await brQuery;
    if (brErr) throw brErr;
    const briefings = (briefingsRaw ?? []) as BriefingRow[];
    const briefingById = new Map(briefings.map((b) => [b.id, b]));

    // Group counts keyed on (user_id, lens_item_signature).
    // Signature is computed from the lens item in the briefing's snapshot.
    type Bucket = {
      user_id: string;
      signature: string;
      lens_item_type: string;
      lens_item_text: string;
      count: number;
    };
    const buckets = new Map<string, Bucket>();

    for (const fb of feedbackRows) {
      if (!fb.lens_item_id) continue;
      const briefing = briefingById.get(fb.briefing_id);
      if (!briefing) continue; // filtered out by scope
      const lens = briefing.context_snapshot?.lens ?? [];
      const lensItem = lens.find((l) => l.id === fb.lens_item_id);
      if (!lensItem) continue;

      const signature = await computeLensSignature(lensItem.type, lensItem.text);
      const key = `${briefing.user_id}|${signature}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, {
          user_id: briefing.user_id,
          signature,
          lens_item_type: lensItem.type,
          lens_item_text: lensItem.text,
          count: 1,
        });
      }
    }

    // Upsert a feedback delta for any bucket at or above threshold.
    let promoted = 0;
    const touched = new Set<string>();
    for (const b of buckets.values()) {
      if (b.count < PROMOTE_THRESHOLD) continue;
      const { error: upErr } = await supabase
        .from("briefing_lens_feedback")
        .upsert(
          {
            user_id: b.user_id,
            lens_item_signature: b.signature,
            lens_item_type: b.lens_item_type,
            lens_item_text: b.lens_item_text,
            weight_delta: AGGREGATE_DELTA,
            source: "not_useful_aggregate",
            evidence_count: b.count,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lens_item_signature,source" },
        );
      if (!upErr) {
        promoted += 1;
        touched.add(b.user_id);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scanned: feedbackRows.length,
        buckets: buckets.size,
        promoted,
        users_touched: touched.size,
        window_days: WINDOW_DAYS,
        scope: scopeUserId ?? "all",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("briefing-aggregate-feedback error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
