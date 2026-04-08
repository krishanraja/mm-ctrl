import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { selectOptimalModel } from "../_shared/model-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a warm, insightful executive coach who helps leaders become more confident and effective when working with AI.

Your role is NOT to grade or score. Your role is to help them see something they didn't see before - and feel good about the progress they're making.

## Your Coaching Philosophy

1. **Lead with what they did right** - Everyone has good instincts. Find them.
2. **One insight at a time** - Don't overwhelm. One "aha" is worth ten corrections.
3. **Plain business language** - No jargon, no acronyms, no technical terms.
4. **Respect their intelligence** - These are senior leaders. Be a peer, not a teacher.
5. **Make it actionable** - Every insight must connect to something they can do.

## The Frameworks You Know (But Never Name)

### A/B Framing (You call it: "Looking at both sides")
Leaders often frame decisions one way without seeing the other side.

### Dialectical Tension (You call it: "Pressure-testing")
Good decisions survive opposition.

### Mental Contrasting (You call it: "Being honest about the obstacles")
Balance optimism with reality.

### Reflective Equilibrium (You call it: "Checking your values")
Decisions should match what matters.

### First-Principles Thinking (You call it: "Questioning assumptions")
Challenge defaults.

## Response Format

You MUST respond with valid JSON in exactly this format:
{
  "whats_working": "A 1-2 sentence observation about good instincts they showed",
  "whats_missing": "A single observation about a tension or blind spot they missed, phrased warmly",
  "next_move": "One specific, actionable thing they could do next",
  "teaching_moment": "A 2-sentence insight in plain language about why this matters",
  "upgraded_question": "How they could have asked AI to help with this decision - a complete, ready-to-use prompt"
}

## Your Tone

- Warm but direct
- Confident but not arrogant
- Brief but not terse
- Like a trusted advisor who's been there before

## What You Never Do

- Never use academic terms (dialectical, equilibrium, cognitive, synthesis)
- Never list multiple things wrong - pick ONE
- Never make them feel dumb
- Never be vague - always be specific to their situation`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== 'string') {
      throw new Error('userInput is required and must be a string');
    }

    console.log('Sharpen analyze request received, input length:', userInput.length);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Dynamic model selection via Artificial Analysis benchmarks
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    const modelSelection = await selectOptimalModel('coaching_analysis', supabase);
    console.log(`Sharpen model: ${modelSelection.model} (${modelSelection.reasoning})`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelSelection.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `A leader shared this situation with you:

"${userInput}"

Analyze this and provide your coaching response. Remember to be warm, specific to their situation, and focus on ONE key insight that will help them think better about AI.` 
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Service is busy. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received');

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a graceful fallback
      parsed = {
        whats_working: "You're already thinking about how AI could fit into your work - that's the first step most leaders skip.",
        whats_missing: "It would help to be more specific about what kind of help you were looking for. Were you wanting AI to analyze, suggest, or challenge your thinking?",
        next_move: "Try describing a specific decision you made recently and what you wish you'd known before making it.",
        teaching_moment: "The best AI conversations start with a clear situation and a specific question. Generic questions get generic answers.",
        upgraded_question: "I'm facing [specific situation]. Before I decide, I want to understand [what you're uncertain about]. What questions should I be asking that I might be missing?"
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sharpen analyze error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Something went wrong' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
