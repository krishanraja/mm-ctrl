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
    const { sessionId, transcripts } = await req.json();

    if (!sessionId || !transcripts) {
      throw new Error('sessionId and transcripts are required');
    }

    console.log(`Analyzing compass for session ${sessionId}`);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build the prompt with all transcripts
    const transcriptText = Object.entries(transcripts)
      .map(([dimension, text]) => `${dimension}: ${text}`)
      .join('\n\n');

    const prompt = `You are an executive AI leadership coach assessing an executive's readiness to start their AI journey. Analyze these 7 voice responses (15s each) and score across dimensions (0-100):

1. AI Awareness & Competitive Pressure - Do they understand AI's relevance to their industry?
2. Priority Problem Identification - Can they articulate specific, high-value problems AI could solve?
3. Leadership Readiness - How aligned/prepared is their leadership team?
4. Stakeholder Confidence - How confidently can they discuss AI with investors/board/customers?
5. Value Metric Clarity - Have they identified which business metrics AI should move?
6. Champion Identification - Do they know who on their team could drive AI adoption?
7. Near-Term Action Bias - Are they ready to take concrete action in the next 30 days?

**CRITICAL SCORING GUIDANCE:**
- This is an EARLY-STAGE assessment - most executives will score 20-60
- Score based on AWARENESS and READINESS, not current execution
- "We don't have that yet but I know we need it" = 40-50 (Establishing)
- "I'm not sure where to start" = 20-35 (Emerging)
- "Here's my specific plan to address it" = 60-75 (Advancing)
- Use tier bands:
  - Emerging (0-40): Just beginning to explore AI, limited awareness
  - Establishing (41-65): Aware of gaps, identifying priorities, building readiness
  - Advancing (66-85): Clear priorities, strong readiness, starting execution
  - Leading (86-100): Already executing with momentum (rare at this stage)

Transcripts:
${transcriptText}

Return ONLY valid JSON (no markdown code blocks):
{
  "scores": {
    "ai_literacy": 45,
    "strategic_vision": 52,
    "cultural_leadership": 38,
    "operational_readiness": 48,
    "risk_management": 50,
    "innovation_mindset": 55,
    "stakeholder_engagement": 42
  },
  "tier": "Establishing",
  "tierDescription": "Emerging Leader - Building awareness, ready to start experimenting.",
  "focusAreas": ["Identify one high-value AI use case this month", "Run team AI workshop to build excitement", "Craft simple AI story for next board meeting"],
  "quickWins": ["This week: Try ChatGPT for one daily task", "This month: Host 30-min AI demo with team"]
}`;

    // Call OpenAI API with caching and optimized model
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { callOpenAI, selectModel } = await import('../_shared/openai-utils.ts');
    
    const aiResult = await callOpenAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a leadership assessment AI. Always return valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: selectModel('analysis'), // Use optimized model selection
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      {
        useCache: true,
        supabase: supabase,
      }
    );
    
    if (aiResult.cached) {
      console.log('✅ Used cached response for compass analysis');
    }
    
    // Parse JSON response - strip markdown code blocks if present
    let cleanContent = aiResult.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    const results = JSON.parse(cleanContent);

    // Store in database (supabase already initialized above)

    await supabase.from('voice_sessions').upsert({
      session_id: sessionId,
      voice_enabled: true,
      compass_scores: results.scores,
      compass_tier: results.tier,
      compass_focus_areas: results.focusAreas,
      compass_completed_at: new Date().toISOString()
    }, {
      onConflict: 'session_id'
    });

    console.log(`Compass analysis complete for ${sessionId}: Tier ${results.tier}`);

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in compass-analyze:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
