/**
 * Backfill Embeddings
 *
 * One-shot edge function to generate embeddings for all user_memory facts
 * that don't have one yet. Processes in batches to stay within API limits.
 *
 * Invoke: POST /functions/v1/backfill-embeddings
 * Auth: requires service_role key (admin only)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { embedFacts } from "../_shared/embeddings.ts";

const BATCH_SIZE = 50; // OpenAI embeddings API handles up to ~2048 inputs, but keep batches small for reliability

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Count facts missing embeddings
    const { count: totalMissing, error: countError } = await supabase
      .from("user_memory")
      .select("id", { count: "exact", head: true })
      .is("embedding", null)
      .eq("is_current", true)
      .is("archived_at", null);

    if (countError) {
      return new Response(JSON.stringify({ error: countError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📊 Found ${totalMissing} facts missing embeddings`);

    let processed = 0;
    let embedded = 0;
    let offset = 0;

    while (true) {
      // Fetch a batch of facts without embeddings
      const { data: facts, error: fetchError } = await supabase
        .from("user_memory")
        .select("id, fact_category, fact_label, fact_value")
        .is("embedding", null)
        .eq("is_current", true)
        .is("archived_at", null)
        .order("created_at", { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        break;
      }

      if (!facts || facts.length === 0) break;

      console.log(`⚙️ Processing batch: ${facts.length} facts (offset ${offset})`);

      const count = await embedFacts(supabase, facts);
      embedded += count;
      processed += facts.length;

      // If embedFacts stored them successfully, don't increment offset
      // because the next query will skip already-embedded rows.
      // But if it failed (count === 0), move offset to avoid infinite loop.
      if (count === 0) {
        offset += facts.length;
      }

      // Safety: stop if we've processed way more than expected
      if (processed > (totalMissing || 0) + BATCH_SIZE) break;
    }

    const result = {
      total_missing: totalMissing,
      processed,
      embedded,
      status: "complete",
    };

    console.log("✅ Backfill complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Backfill error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
