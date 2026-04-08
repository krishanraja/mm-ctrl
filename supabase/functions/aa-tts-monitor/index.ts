/**
 * aa-tts-monitor Edge Function
 *
 * Daily monitoring function that fetches TTS quality ratings from Artificial Analysis,
 * compares ElevenLabs ELO vs competitors, and stores snapshots.
 * Triggers an alert if ElevenLabs drops below top 3.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTTSRatings } from "../_shared/aa-cache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CURRENT_PROVIDER = "elevenlabs";
const ALERT_RANK_THRESHOLD = 3; // Alert if ElevenLabs drops below top 3

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const ttsModels = await getTTSRatings(supabase);

    if (ttsModels.length === 0) {
      return new Response(
        JSON.stringify({ error: "No TTS data available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort by ELO descending
    const ranked = ttsModels
      .filter((m) => m.elo_rating != null)
      .sort((a, b) => (b.elo_rating ?? 0) - (a.elo_rating ?? 0));

    // Find ElevenLabs models
    const elevenLabsEntries = ranked.filter(
      (m) =>
        m.name?.toLowerCase().includes("elevenlabs") ||
        m.model_creator?.name?.toLowerCase().includes("elevenlabs") ||
        m.slug?.toLowerCase().includes("elevenlabs")
    );

    const bestElevenLabs = elevenLabsEntries[0] ?? null;
    const elevenLabsRank = bestElevenLabs
      ? ranked.findIndex((m) => m.id === bestElevenLabs.id) + 1
      : null;

    const topProvider = ranked[0] ?? null;
    const alertTriggered =
      elevenLabsRank != null && elevenLabsRank > ALERT_RANK_THRESHOLD;

    // Build provider rankings (top 10)
    const providerRankings = ranked.slice(0, 10).map((m, i) => ({
      rank: i + 1,
      provider: m.model_creator?.name || "Unknown",
      model: m.name,
      elo_rating: m.elo_rating,
    }));

    // Store snapshot
    const snapshotDate = new Date().toISOString().split("T")[0];
    const { error: insertError } = await supabase
      .from("tts_quality_snapshots")
      .insert({
        snapshot_date: snapshotDate,
        provider_rankings: providerRankings,
        current_provider: CURRENT_PROVIDER,
        current_elo: bestElevenLabs?.elo_rating ?? null,
        top_provider: topProvider?.model_creator?.name || null,
        top_elo: topProvider?.elo_rating ?? null,
        alert_triggered: alertTriggered,
      });

    if (insertError) {
      console.warn("Snapshot insert failed:", insertError);
    }

    // Update tts_config if needed (just log for now, manual switching)
    if (alertTriggered) {
      console.warn(
        `ALERT: ElevenLabs ranked #${elevenLabsRank} (ELO: ${bestElevenLabs?.elo_rating}). ` +
          `Top provider: ${topProvider?.model_creator?.name} (ELO: ${topProvider?.elo_rating})`
      );
    }

    return new Response(
      JSON.stringify({
        snapshot_date: snapshotDate,
        current_provider: CURRENT_PROVIDER,
        current_rank: elevenLabsRank,
        current_elo: bestElevenLabs?.elo_rating ?? null,
        top_provider: topProvider?.model_creator?.name || null,
        top_elo: topProvider?.elo_rating ?? null,
        alert_triggered: alertTriggered,
        rankings: providerRankings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("aa-tts-monitor error:", err);
    return new Response(
      JSON.stringify({ error: "TTS monitoring failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
