import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLLM } from "../_shared/llm-utils.ts";

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

    const aiResult = await callLLM(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `A leader shared this situation with you:

"${userInput}"

Analyze this and provide your coaching response. Remember to be warm, specific to their situation, and focus on ONE key insight that will help them think better about AI.`
          }
        ],
        task: 'chat',
        temperature: 0.7,
        json_output: true,
      },
      { functionName: 'sharpen-analyze' },
    );

    console.log('AI response received');

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResult.content);
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
