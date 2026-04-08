/**
 * synthesize-briefing Edge Function
 *
 * Converts a briefing script to audio via ElevenLabs TTS
 * and stores the MP3 in Supabase Storage.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_VOICE_ID = "7ApmIXLoWa0cKUtJqfHc";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

/**
 * Load TTS config from database (allows admin-configurable provider switching).
 * Falls back to hardcoded defaults if the table doesn't exist or has no rows.
 */
async function loadTTSConfig(supabase: any): Promise<{ voiceId: string; modelId: string }> {
  try {
    const { data } = await supabase
      .from("tts_config")
      .select("voice_id, model_id")
      .eq("is_active", true)
      .limit(1)
      .single();
    if (data?.voice_id && data?.model_id) {
      return { voiceId: data.voice_id, modelId: data.model_id };
    }
  } catch {
    // Table may not exist yet; fall through to defaults
  }
  return { voiceId: DEFAULT_VOICE_ID, modelId: DEFAULT_MODEL_ID };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");

    if (!elevenLabsKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const ttsConfig = await loadTTSConfig(supabase);

    const { briefing_id } = await req.json();
    if (!briefing_id) throw new Error("briefing_id required");

    // Fetch briefing
    const { data: briefing, error: fetchError } = await supabase
      .from("briefings")
      .select("id, user_id, briefing_date, script_text, audio_url")
      .eq("id", briefing_id)
      .single();

    if (fetchError || !briefing) throw new Error("Briefing not found");
    if (briefing.audio_url) {
      return new Response(
        JSON.stringify({ audio_url: briefing.audio_url, already_exists: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Synthesizing audio for briefing ${briefing.id}...`);

    // Call ElevenLabs TTS (voice/model from tts_config or defaults)
    const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ttsConfig.voiceId}`;
    const ttsResponse = await fetch(elevenlabsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: briefing.script_text,
        model_id: ttsConfig.modelId,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.45,
          use_speaker_boost: true,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text().catch(() => "");
      throw new Error(
        `ElevenLabs error: ${ttsResponse.status} ${errText.substring(0, 200)}`
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    console.log(`Audio generated: ${audioBytes.length} bytes`);

    // Estimate duration (~150 words/min for TTS)
    const wordCount = briefing.script_text.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    // Upload to Supabase Storage (include briefing ID for uniqueness across types)
    const storagePath = `${briefing.user_id}/${briefing.briefing_date}-${briefing.id.substring(0, 8)}.mp3`;

    // Ensure bucket exists (ignore error if already exists)
    await supabase.storage.createBucket("ctrl-briefings", {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    }).catch(() => {});

    const { error: uploadError } = await supabase.storage
      .from("ctrl-briefings")
      .upload(storagePath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get signed URL (24h expiry)
    const { data: signedData } = await supabase.storage
      .from("ctrl-briefings")
      .createSignedUrl(storagePath, 86400);

    const audioUrl = signedData?.signedUrl || storagePath;

    // Update briefing row
    const { error: updateError } = await supabase
      .from("briefings")
      .update({
        audio_url: audioUrl,
        audio_duration_seconds: estimatedDuration,
      })
      .eq("id", briefing.id);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    console.log(
      `Synthesis complete: ${storagePath} (~${estimatedDuration}s)`
    );

    return new Response(
      JSON.stringify({
        audio_url: audioUrl,
        duration_seconds: estimatedDuration,
        already_exists: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("synthesize-briefing error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
