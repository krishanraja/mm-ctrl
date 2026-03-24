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

const EXTRACTION_PROMPT = `You are an expert at extracting structured facts about business leaders from their written or spoken input.

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
    const { transcript, session_id, source_type } = await req.json();

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
          { role: 'user', content: `Extract facts from this ${source_type === 'markdown' ? 'document' : 'transcript'}:\n\n"${transcript}"` },
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

    // === VALIDATION PASS ===
    // Second LLM call to cross-check extracted facts against the original transcript.
    // This catches hallucinations, misinterpretations, and temporal/negation errors.
    if (extractedFacts.length > 0) {
      try {
        const validationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a strict fact-checker. Given a transcript and a list of extracted facts, verify each fact against the transcript.

For each fact, determine:
- "valid": The fact is clearly stated or strongly implied in the transcript
- "invalid": The fact is NOT in the transcript, is hallucinated, or misinterprets what was said
- "adjusted": The fact needs correction (e.g. negation missed, temporal context wrong, value slightly off)

COMMON ERRORS TO CATCH:
- Negations: "I'm NOT a micromanager" extracted as a preference for micromanagement
- Temporal: "I was a VP" vs "I am a VP" - check tense carefully
- Hypotheticals: "If I had more time I'd..." is NOT a current fact
- Exaggerations: Numbers or claims that don't match the transcript
- Invented details: Facts that sound plausible but aren't in the transcript

Return a JSON object with a "results" array. Each entry has:
- fact_key: string (matching the input)
- status: "valid" | "invalid" | "adjusted"
- adjusted_value: string | null (only if status is "adjusted")
- adjusted_confidence: number | null (suggested confidence 0-1, only if status is "adjusted")
- reason: string (brief explanation)`,
              },
              {
                role: 'user',
                content: `TRANSCRIPT:\n"${transcript}"\n\nEXTRACTED FACTS:\n${JSON.stringify(extractedFacts, null, 2)}`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });

        if (validationResponse.ok) {
          const validationData = await validationResponse.json();
          const validationContent = validationData.choices?.[0]?.message?.content;
          const validation = JSON.parse(validationContent);
          const results = validation.results || [];

          // Build a lookup map from validation results
          const validationMap = new Map<string, {
            status: string;
            adjusted_value?: string;
            adjusted_confidence?: number;
            reason?: string;
          }>();
          for (const r of results) {
            validationMap.set(r.fact_key, r);
          }

          // Filter out invalid facts, adjust corrected ones
          extractedFacts = extractedFacts
            .filter(fact => {
              const v = validationMap.get(fact.fact_key);
              if (v?.status === 'invalid') {
                console.log(`Validation rejected fact "${fact.fact_key}": ${v.reason}`);
                return false;
              }
              return true;
            })
            .map(fact => {
              const v = validationMap.get(fact.fact_key);
              if (v?.status === 'adjusted') {
                console.log(`Validation adjusted fact "${fact.fact_key}": ${v.reason}`);
                return {
                  ...fact,
                  fact_value: v.adjusted_value || fact.fact_value,
                  confidence_score: v.adjusted_confidence ?? Math.max(fact.confidence_score - 0.15, 0.3),
                };
              }
              return fact;
            });
        } else {
          console.warn('Validation pass failed, proceeding with unvalidated facts');
        }
      } catch (validationError) {
        console.warn('Validation pass error (non-blocking):', validationError);
      }
    }

    // If user is authenticated, store facts in database
    if (userId && extractedFacts.length > 0) {
      // Fetch existing facts (key + value + metadata for semantic comparison)
      const { data: existingFacts } = await supabase
        .from('user_memory')
        .select('id, fact_key, fact_value, fact_category, confidence_score, verification_status')
        .eq('user_id', userId)
        .eq('is_current', true);

      const existingList = existingFacts || [];
      const existingKeys = new Set(existingList.map(f => f.fact_key));

      // === SEMANTIC DEDUPLICATION ===
      // Use embeddings to detect duplicate or contradictory facts even when
      // fact_key strings differ (e.g. "role" vs "job_title" for the same info).
      let semanticDuplicates = new Map<string, { existingId: string; existingKey: string; similarity: number }>();

      // Only run embedding-based dedup for new facts (keys not already in DB)
      const newFacts = extractedFacts.filter(f => !existingKeys.has(f.fact_key));

      if (newFacts.length > 0 && existingList.length > 0) {
        try {
          // Build embedding texts: "category: label = value" for semantic comparison
          const existingTexts = existingList.map(f => `${f.fact_category}: ${f.fact_key} = ${f.fact_value}`);
          const newTexts = newFacts.map(f => `${f.fact_category}: ${f.fact_key} = ${f.fact_value}`);
          const allTexts = [...existingTexts, ...newTexts];

          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: allTexts,
            }),
          });

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            const embeddings: number[][] = embeddingData.data.map((d: { embedding: number[] }) => d.embedding);
            const existingEmbeddings = embeddings.slice(0, existingTexts.length);
            const newEmbeddings = embeddings.slice(existingTexts.length);

            // Cosine similarity helper
            const cosineSim = (a: number[], b: number[]): number => {
              let dot = 0, normA = 0, normB = 0;
              for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
              }
              return dot / (Math.sqrt(normA) * Math.sqrt(normB));
            };

            // Check each new fact against all existing facts
            const SIMILARITY_THRESHOLD = 0.85;
            for (let ni = 0; ni < newFacts.length; ni++) {
              let bestSim = 0;
              let bestExistingIdx = -1;
              for (let ei = 0; ei < existingList.length; ei++) {
                // Only compare within same category
                if (existingList[ei].fact_category !== newFacts[ni].fact_category) continue;
                const sim = cosineSim(newEmbeddings[ni], existingEmbeddings[ei]);
                if (sim > bestSim) {
                  bestSim = sim;
                  bestExistingIdx = ei;
                }
              }
              if (bestSim >= SIMILARITY_THRESHOLD && bestExistingIdx >= 0) {
                const existing = existingList[bestExistingIdx];
                console.log(
                  `Semantic duplicate: "${newFacts[ni].fact_key}" ≈ "${existing.fact_key}" (similarity: ${bestSim.toFixed(3)})`
                );
                semanticDuplicates.set(newFacts[ni].fact_key, {
                  existingId: existing.id,
                  existingKey: existing.fact_key,
                  similarity: bestSim,
                });
              }
            }
          } else {
            console.warn('Embedding API failed, falling back to key-based dedup only');
          }
        } catch (embeddingError) {
          console.warn('Semantic dedup error (non-blocking):', embeddingError);
        }
      }

      // Prepare facts for insertion: exclude exact key matches AND semantic duplicates
      const factsToInsert = extractedFacts
        .filter(fact => !existingKeys.has(fact.fact_key) && !semanticDuplicates.has(fact.fact_key))
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
          source_type: source_type || 'voice',
          source_session_id: session_id || null,
        }));

      // Update existing facts if new extraction has higher confidence
      // (handles both exact key matches and semantic duplicates)
      const factsToUpdate = extractedFacts.filter(
        f => existingKeys.has(f.fact_key) || semanticDuplicates.has(f.fact_key)
      );

      for (const fact of factsToUpdate) {
        const semanticMatch = semanticDuplicates.get(fact.fact_key);
        const matchId = semanticMatch?.existingId;
        const matchKey = semanticMatch?.existingKey || fact.fact_key;

        const { data: existing } = await supabase
          .from('user_memory')
          .select('id, confidence_score, verification_status')
          .eq('user_id', userId)
          .eq(matchId ? 'id' : 'fact_key', matchId || matchKey)
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

      // Trigger Edge profile re-synthesis in the background (non-blocking)
      try {
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        // Check if user has an edge profile before triggering synthesis
        const { data: edgeProfile } = await serviceClient
          .from('edge_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        if (edgeProfile) {
          // Fire and forget — don't block the response
          fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/synthesize-edge-profile`, {
            method: 'POST',
            headers: {
              'Authorization': req.headers.get('Authorization')!,
              'Content-Type': 'application/json',
            },
          }).catch(err => console.warn('Edge re-synthesis trigger failed (non-critical):', err));
        }
      } catch {
        // Non-critical — don't fail the extraction
      }

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
