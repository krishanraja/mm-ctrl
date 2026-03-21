import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio');
    const sessionId = formData.get('sessionId');
    const moduleType = formData.get('moduleType');

    if (!audioBlob || !sessionId) {
      throw new Error('Audio and sessionId are required');
    }

    console.log(`Transcribing audio for session ${sessionId}, module ${moduleType}`);
    
    const startTime = Date.now();

    // Send to OpenAI Whisper API with verbose_json for real confidence scores
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioBlob, 'audio.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en');
    whisperFormData.append('response_format', 'verbose_json');
    whisperFormData.append('temperature', '0');
    whisperFormData.append('prompt', 'The speaker is an executive or leader discussing leadership, team management, strategy, decisions, delegation, priorities, KPIs, OKRs, quarterly goals, direct reports, stakeholders, cross-functional collaboration, performance reviews, and business operations.');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: whisperFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${errorText}`);
    }

    const whisperResult = await response.json();
    const text = whisperResult.text;
    const duration = (Date.now() - startTime) / 1000;

    // Compute real confidence from segment-level scores returned by Whisper.
    // Each segment has avg_logprob; we convert to probability and average.
    let confidence = 0.95; // fallback
    if (whisperResult.segments && whisperResult.segments.length > 0) {
      const segmentProbs = whisperResult.segments.map(
        (seg: { avg_logprob: number; no_speech_prob?: number }) => {
          // avg_logprob is negative; exp() gives probability 0-1
          const prob = Math.exp(seg.avg_logprob);
          // Penalize segments with high no-speech probability
          const noSpeechPenalty = seg.no_speech_prob ? (1 - seg.no_speech_prob * 0.5) : 1;
          return prob * noSpeechPenalty;
        }
      );
      confidence = segmentProbs.reduce((a: number, b: number) => a + b, 0) / segmentProbs.length;
      // Clamp to [0, 1]
      confidence = Math.max(0, Math.min(1, confidence));
      confidence = Math.round(confidence * 100) / 100;
    }

    console.log(`Transcription complete in ${duration}s: "${text.substring(0, 100)}..."`);

    // Log instrumentation
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Validate we're using the correct database (Mindmaker AI, ID: bkyuxvschuwngtcdhsyg)
    const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';
    let skipInstrumentation = false;
    if (!supabaseUrl || !supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
      console.warn(`⚠️ Database validation: SUPABASE_URL does not match expected project ID (${EXPECTED_PROJECT_ID}). Skipping instrumentation.`);
      skipInstrumentation = true;
    } else {
      console.log(`✅ Database validated: Using Mindmaker AI (${EXPECTED_PROJECT_ID})`);
    }
    
    if (!skipInstrumentation) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Some callers provide non-UUID session identifiers (e.g. deep-profile quick inputs).
      // We must not fail transcription for instrumentation logging issues.
      const sessionIdStr = String(sessionId);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionIdStr);
      const moduleName = moduleType ? String(moduleType) : null;

      try {
        const { error: instrumentationError } = await supabase.from('voice_instrumentation').insert({
          session_id: isUuid ? sessionIdStr : null,
          event_type: 'transcription_complete',
          module_name: moduleName,
          metadata: {
            duration_seconds: duration,
            transcript_length: text.length,
            confidence,
            session_id_raw: isUuid ? null : sessionIdStr,
          }
        });
        if (instrumentationError) {
          console.warn('⚠️ Instrumentation insert failed (non-blocking):', instrumentationError.message);
        }
      } catch (e) {
        console.warn('⚠️ Instrumentation insert threw (non-blocking):', e);
      }
    }

    return new Response(
      JSON.stringify({
        transcript: text,
        confidence,
        duration_seconds: duration,
        needs_clarification: confidence < 0.5
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in voice-transcribe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
