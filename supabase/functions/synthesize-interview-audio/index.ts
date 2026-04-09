/**
 * synthesize-interview-audio Edge Function
 *
 * Generates TTS audio for onboarding interview questions using
 * Krishan's ElevenLabs voice. Returns audio as base64 (ephemeral,
 * no storage needed).
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getResponseHeaders } from "../_shared/security-headers.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const DEFAULT_VOICE_ID = "7ApmIXLoWa0cKUtJqfHc";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

/**
 * Load TTS config from database (allows admin-configurable voice switching).
 * Falls back to hardcoded defaults if the table doesn't exist or has no rows.
 */
async function loadTTSConfig(
  supabase: ReturnType<typeof createClient>,
): Promise<{ voiceId: string; modelId: string }> {
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
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenLabsKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const ttsConfig = await loadTTSConfig(supabase);

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      throw new Error("text is required");
    }

    // Limit text length to prevent abuse (interview questions are short)
    const trimmedText = text.slice(0, 1000);

    console.log(
      `Synthesizing interview audio: ${trimmedText.length} chars`,
    );

    // Call ElevenLabs TTS
    const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ttsConfig.voiceId}`;
    const ttsResponse = await fetch(elevenlabsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: trimmedText,
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
        `ElevenLabs error: ${ttsResponse.status} ${errText.substring(0, 200)}`,
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const audioBase64 = base64Encode(audioBytes);

    console.log(`Interview audio generated: ${audioBytes.length} bytes`);

    return new Response(
      JSON.stringify({
        audio_base64: audioBase64,
        content_type: "audio/mpeg",
      }),
      { headers: getResponseHeaders() },
    );
  } catch (error) {
    console.error("synthesize-interview-audio error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: getResponseHeaders() },
    );
  }
});
