import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedFact {
  fact_key: string;
  fact_category: 'identity' | 'business' | 'objective' | 'blocker' | 'preference';
  fact_label: string;
  fact_value: string;
  fact_context: string;
  confidence_score: number;
  is_high_stakes: boolean;
}

const EXTRACTION_PROMPT = `You are an expert at extracting structured facts about business leaders from their voice transcripts.

Your job is to identify and extract key facts about the person speaking. Be precise and only extract facts that are explicitly stated or strongly implied.

FACT CATEGORIES:
1. IDENTITY - role, title, department, who they report to, team size, seniority level
2. BUSINESS - company name, industry/vertical, company size, growth stage, revenue info
3. OBJECTIVE - main goals, quarterly priorities, success metrics, what they're trying to achieve
4. BLOCKER - personal challenges, team challenges, organizational challenges, time constraints, what's holding them back
5. PREFERENCE - communication style, decision-making approach, delegation comfort, work style

For each fact you extract:
- fact_key: A snake_case identifier (e.g., "role", "company_name", "main_blocker")
- fact_category: One of "identity", "business", "objective", "blocker", "preference"
- fact_label: Human-readable label (e.g., "Your Role", "Company", "Main Challenge")
- fact_value: The extracted value (be concise but complete)
- fact_context: The exact quote or paraphrase from the transcript that supports this
- confidence_score: 0.0-1.0 (how confident are you this is correct?)
- is_high_stakes: true if getting this wrong would be embarrassing (role, company name, main goal)

RULES:
- Only extract facts that are actually mentioned or strongly implied
- Don't invent or assume facts
- Be conservative with confidence scores
- Mark role, company, and main objective as high_stakes
- Extract 5-15 facts maximum
- If the transcript is too short or vague, extract fewer facts

Return a JSON array of facts. If no facts can be extracted, return an empty array.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, session_id } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return new Response(
        JSON.stringify({ error: 'transcript is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
      auth: { persistSession: false },
    });

    // Get authenticated user
    const { data: userData } = await supabaseAuth.auth.getUser();
    const userId = userData?.user?.id;

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Call OpenAI for extraction
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured', facts: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: `Extract facts from this transcript:\n\n"${transcript}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI extraction failed', facts: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;
    
    let extractedFacts: ExtractedFact[] = [];
    
    try {
      const parsed = JSON.parse(content);
      extractedFacts = Array.isArray(parsed) ? parsed : (parsed.facts || []);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse extraction', facts: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user is authenticated, store facts in database
    if (userId && extractedFacts.length > 0) {
      // First, check for existing facts to avoid duplicates
      const { data: existingFacts } = await supabase
        .from('user_memory')
        .select('fact_key')
        .eq('user_id', userId)
        .eq('is_current', true);

      const existingKeys = new Set(existingFacts?.map(f => f.fact_key) || []);

      // Prepare facts for insertion
      const factsToInsert = extractedFacts
        .filter(fact => !existingKeys.has(fact.fact_key))
        .map(fact => ({
          user_id: userId,
          fact_key: fact.fact_key,
          fact_category: fact.fact_category,
          fact_label: fact.fact_label,
          fact_value: fact.fact_value,
          fact_context: fact.fact_context,
          confidence_score: fact.confidence_score,
          is_high_stakes: fact.is_high_stakes,
          verification_status: 'inferred',
          source_type: 'voice',
          source_session_id: session_id || null,
        }));

      // Update existing facts if new extraction has higher confidence
      for (const fact of extractedFacts) {
        if (existingKeys.has(fact.fact_key)) {
          const { data: existing } = await supabase
            .from('user_memory')
            .select('id, confidence_score, verification_status')
            .eq('user_id', userId)
            .eq('fact_key', fact.fact_key)
            .eq('is_current', true)
            .single();

          // Only update if new confidence is higher and fact isn't verified
          if (existing && 
              existing.verification_status === 'inferred' && 
              fact.confidence_score > existing.confidence_score) {
            await supabase
              .from('user_memory')
              .update({
                fact_value: fact.fact_value,
                fact_context: fact.fact_context,
                confidence_score: fact.confidence_score,
              })
              .eq('id', existing.id);
          }
        }
      }

      // Insert new facts
      if (factsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_memory')
          .insert(factsToInsert);

        if (insertError) {
          console.error('Error inserting facts:', insertError);
        }
      }

      // Get pending verifications to return
      const { data: pendingVerifications } = await supabase
        .rpc('get_pending_verifications', { p_user_id: userId });

      return new Response(
        JSON.stringify({
          success: true,
          facts_extracted: extractedFacts.length,
          facts_stored: factsToInsert.length,
          pending_verifications: pendingVerifications || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return facts without storing (unauthenticated)
    return new Response(
      JSON.stringify({
        success: true,
        facts: extractedFacts,
        pending_verifications: extractedFacts.filter(f => f.is_high_stakes),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', facts: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
