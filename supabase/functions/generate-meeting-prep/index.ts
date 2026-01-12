import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenAI, selectModel } from '../_shared/openai-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Create auth client for user verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
      auth: { persistSession: false }
    });

    // Get authenticated user
    const { data: userData } = await supabaseAuth.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const {
      assessment_id,
      company_context_id,
      meeting_title,
      meeting_date,
      agenda_text,
    } = requestBody;

    if (!assessment_id || !meeting_title || !agenda_text) {
      return new Response(
        JSON.stringify({ error: 'assessment_id, meeting_title, and agenda_text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Generating meeting prep for: ${meeting_title}`);

    // Step 1: Fetch diagnostic results
    const { data: assessment } = await supabase
      .from('leader_assessments')
      .select('benchmark_score, benchmark_tier, leader_id')
      .eq('id', assessment_id)
      .single();

    if (!assessment) {
      return new Response(
        JSON.stringify({ error: 'Assessment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch dimension scores
    const { data: dimensionScores } = await supabase
      .from('leader_dimension_scores')
      .select('dimension_key, score_numeric, dimension_tier, explanation')
      .eq('assessment_id', assessment_id)
      .order('score_numeric', { ascending: false });

    // Fetch tensions
    const { data: tensions } = await supabase
      .from('leader_tensions')
      .select('dimension_key, summary_line, priority_rank')
      .eq('assessment_id', assessment_id)
      .order('priority_rank', { ascending: true })
      .limit(5);

    // Fetch risk signals
    const { data: riskSignals } = await supabase
      .from('leader_risk_signals')
      .select('risk_key, level, description, priority_rank')
      .eq('assessment_id', assessment_id)
      .order('priority_rank', { ascending: true })
      .limit(5);

    // Fetch first moves
    const { data: firstMoves } = await supabase
      .from('leader_first_moves')
      .select('move_number, content')
      .eq('assessment_id', assessment_id)
      .order('move_number', { ascending: true });

    // Step 2: Fetch company context if available
    let companyContext: any = null;
    if (company_context_id) {
      const { data: context } = await supabase
        .from('company_context')
        .select('*')
        .eq('id', company_context_id)
        .single();

      if (context) {
        companyContext = context;
      }
    }

    // Step 3: Build diagnostic summary
    const diagnosticSummary = {
      benchmark_score: assessment.benchmark_score,
      benchmark_tier: assessment.benchmark_tier,
      top_dimensions: dimensionScores?.slice(0, 3).map(d => ({
        name: d.dimension_key,
        score: d.score_numeric,
        tier: d.dimension_tier,
      })) || [],
      top_tensions: tensions?.map(t => t.summary_line) || [],
      top_risks: riskSignals?.map(r => `${r.risk_key}: ${r.description}`) || [],
      first_moves: firstMoves?.map(m => m.content) || [],
    };

    // Step 4: Build company context summary
    const companySummary = companyContext ? {
      name: companyContext.company_name,
      industry: companyContext.apollo_data?.industry || 'Unknown',
      employees: companyContext.apollo_data?.num_employees || 'Unknown',
      website_summary: companyContext.website_content?.substring(0, 500) || null,
    } : null;

    // Step 5: Build LLM prompt
    const prompt = `You are an executive AI leadership coach preparing personalized meeting prep materials.

DIAGNOSTIC RESULTS:
- Benchmark Score: ${diagnosticSummary.benchmark_score}/100 (${diagnosticSummary.benchmark_tier})
- Top Strengths: ${diagnosticSummary.top_dimensions.map(d => `${d.name} (${d.score}/100)`).join(', ')}
- Key Tensions: ${diagnosticSummary.top_tensions.join('; ')}
- Risk Areas: ${diagnosticSummary.top_risks.join('; ')}
- Recommended First Moves: ${diagnosticSummary.first_moves.join('; ')}

${companySummary ? `COMPANY CONTEXT:
- Company: ${companySummary.name}
- Industry: ${companySummary.industry}
- Size: ${companySummary.employees} employees
${companySummary.website_summary ? `- Website Summary: ${companySummary.website_summary}` : ''}
` : ''}

MEETING DETAILS:
- Title: ${meeting_title}
${meeting_date ? `- Date: ${meeting_date}` : ''}
- Agenda:
${agenda_text}

Generate comprehensive meeting prep materials that:
1. Connect diagnostic insights to specific agenda items
2. Identify strategic questions to ask based on tensions and risks
3. Suggest talking points that leverage strengths
4. Highlight risk areas to address
5. Recommend specific first moves relevant to the meeting topics
${companySummary ? '6. Incorporate company-specific context and industry considerations' : ''}

Return ONLY valid JSON (no markdown code blocks):
{
  "prep_sections": [
    {
      "title": "Section title",
      "content": "Detailed content for this section",
      "priority": "high|medium|low",
      "diagnostic_tie": "Which diagnostic insight this relates to (e.g., 'AI Fluency tension: gap between current and desired state')"
    }
  ],
  "talking_points": [
    "Key point 1",
    "Key point 2"
  ],
  "strategic_questions": [
    "Question 1 based on tensions",
    "Question 2 based on risks"
  ],
  "risk_considerations": [
    "Risk area 1 to address",
    "Risk area 2 to monitor"
  ],
  "recommended_actions": [
    "Action 1 from first moves",
    "Action 2 from first moves"
  ]
}`;

    // Step 6: Call LLM
    const aiResult = await callOpenAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an executive AI leadership coach. Always return valid JSON only, no additional text or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: selectModel('complex'),
        max_tokens: 3000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      { useCache: false, supabase }
    );

    let prepMaterials: any;
    try {
      prepMaterials = JSON.parse(aiResult.content);
    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error);
      // Fallback structure
      prepMaterials = {
        prep_sections: [
          {
            title: 'Meeting Preparation',
            content: 'Review the agenda and prepare talking points based on your diagnostic results.',
            priority: 'high',
            diagnostic_tie: 'General preparation'
          }
        ],
        talking_points: ['Review key agenda items', 'Prepare questions based on your diagnostic insights'],
        strategic_questions: ['How does this relate to our AI strategy?', 'What risks should we consider?'],
        risk_considerations: ['Monitor alignment with diagnostic findings'],
        recommended_actions: diagnosticSummary.first_moves || [],
      };
    }

    // Step 7: Store in meeting_prep_sessions
    const { data: prepSession, error: insertError } = await supabase
      .from('meeting_prep_sessions')
      .insert({
        assessment_id,
        company_context_id: company_context_id || null,
        meeting_title,
        meeting_date: meeting_date || null,
        agenda_text,
        prep_materials: prepMaterials,
        generated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Error storing prep session:', insertError);
      throw insertError;
    }

    console.log('✅ Meeting prep generated and stored:', prepSession.id);

    return new Response(
      JSON.stringify({
        success: true,
        prep_session_id: prepSession.id,
        meeting_title,
        prep_materials: prepMaterials,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error generating meeting prep:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate meeting prep',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
