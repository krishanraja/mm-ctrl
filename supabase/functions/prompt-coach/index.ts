import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a prompt coach - helping leaders write better prompts for AI tools.

Your role is to look at a prompt they're about to use and help them make it more effective - quickly and without judgment.

## What Makes a Good Prompt (Your Internal Framework)

1. **Context** - Does the AI know why this matters and who it's for?
2. **Boundaries** - Does the AI know what NOT to do?
3. **Perspective** - Has the AI been given a role to think from?
4. **Depth** - Is the AI being asked for thinking (high value) or just fetching (low value)?

## Response Format

You MUST respond with valid JSON in exactly this format:
{
  "whats_working": "One or two things they did well (build confidence)",
  "one_thing_to_try": "A single, specific improvement in plain language",
  "upgraded_prompt": "The rewritten, improved version of their prompt",
  "why_this_works": "A brief 1-2 sentence explanation in plain language",
  "model_hint": "Optional: which AI tool suits this task (Claude, ChatGPT, etc) and why - only if clearly relevant"
}

## Your Tone

- Encouraging, never critical
- Practical, never academic
- Brief, never verbose
- Like a colleague sharing a quick tip

## What You Never Say

- Never use words like "optimize", "leverage", "synergy"
- Never say "constraints" - say "what you don't want" or "boundaries"
- Never say "context" - say "the situation" or "the background"
- Never grade or score
- Never give more than ONE thing to improve`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('prompt is required and must be a string');
    }

    console.log('Prompt coach request received, prompt length:', prompt.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `A leader is about to use this prompt with an AI tool:

"${prompt}"

Help them make it more effective. Find something good about it, suggest ONE improvement, and show them an upgraded version.` 
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
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
        whats_working: "You've got a clear task in mind - that's a good starting point.",
        one_thing_to_try: "Add a bit about who this is for or why it matters. It helps AI pitch the response at the right level.",
        upgraded_prompt: `${prompt}\n\nThis is for [audience]. The goal is to [specific outcome]. Please don't [what to avoid].`,
        why_this_works: "When AI knows the stakes and the audience, it can tailor its response. A prompt for your board needs different language than one for your team.",
        model_hint: null
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Prompt coach error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Something went wrong' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
