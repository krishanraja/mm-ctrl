/**
 * Context Builder - Centralized LLM Context Building
 * 
 * Purpose: Builds structured context objects for LLM calls by reading:
 * - All recent events for profile_id
 * - Existing insights/scores for profile
 * - Current tool context and goals
 * 
 * Standard LLM Modes:
 * - assessment_analyzer: Input: profile + raw answers, Output: scores, labels, summary, actions, tension
 * - portfolio_analyzer: Input: companies + scores, Output: rankings, flags, recommended path
 * - session_synthesizer: Input: session events, Output: executive summary + 90-day path
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface LLMContext {
  profile: {
    id: string;
    email: string | null;
    name: string | null;
    role: string | null;
    company: string | null;
  };
  recentEvents: Array<{
    id: string;
    questionText: string;
    rawInput: string;
    structuredValues: Record<string, any>;
    toolName: string;
    flowName: string | null;
    dimensionKey: string | null;
    createdAt: string;
  }>;
  existingInsights: Array<{
    dimensionName: string;
    score: number | null;
    label: string | null;
    llmSummary: string | null;
    generatedAt: string;
  }>;
  dimensionScores: Array<{
    dimensionKey: string;
    scoreNumeric: number;
    dimensionTier: string;
    explanation: string;
  }>;
  toolContext: {
    toolName: string;
    flowName: string | null;
    goals: string[];
  };
}

export interface ContextBuilderOptions {
  profileId: string;
  sessionId?: string | null;
  toolName: string;
  flowName?: string | null;
  limitEvents?: number;
  limitInsights?: number;
}

/**
 * Builds LLM context from profile data, events, and insights
 */
export async function buildLLMContext(
  supabase: any,
  options: ContextBuilderOptions
): Promise<{
  success: boolean;
  context: LLMContext | null;
  errors: string[];
}> {
  const errors: string[] = [];
  const {
    profileId,
    sessionId = null,
    toolName,
    flowName = null,
    limitEvents = 50,
    limitInsights = 20
  } = options;

  try {
    // Step 1: Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('leaders')
      .select('id, email, name, role, company')
      .eq('id', profileId)
      .is('archived_at', null)
      .maybeSingle();

    if (profileError) {
      errors.push(`Profile fetch failed: ${profileError.message}`);
    }

    if (!profile) {
      errors.push(`Profile not found: ${profileId}`);
      return { success: false, context: null, errors };
    }

    // Step 2: Fetch recent events
    let recentEvents: LLMContext['recentEvents'] = [];
    try {
      let eventsQuery = supabase
        .from('assessment_events')
        .select('id, question_text, raw_input, structured_values, tool_name, flow_name, dimension_key, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limitEvents);

      if (sessionId) {
        eventsQuery = eventsQuery.eq('session_id', sessionId);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.warn('⚠️ Events fetch failed:', eventsError.message);
        errors.push(`Events fetch failed: ${eventsError.message}`);
      } else {
        recentEvents = (events || []).map(event => ({
          id: event.id,
          questionText: event.question_text || '',
          rawInput: event.raw_input || '',
          structuredValues: event.structured_values || {},
          toolName: event.tool_name || 'quiz',
          flowName: event.flow_name || null,
          dimensionKey: event.dimension_key || null,
          createdAt: event.created_at || new Date().toISOString()
        }));
      }
    } catch (error: any) {
      console.warn('⚠️ Error fetching events:', error);
      errors.push(`Events fetch error: ${error.message}`);
    }

    // Step 3: Fetch existing insights
    let existingInsights: LLMContext['existingInsights'] = [];
    try {
      const { data: insights, error: insightsError } = await supabase
        .rpc('get_latest_profile_insights', {
          p_profile_id: profileId,
          p_dimension_name: null
        })
        .limit(limitInsights);

      if (insightsError) {
        console.warn('⚠️ Insights fetch failed:', insightsError.message);
        errors.push(`Insights fetch failed: ${insightsError.message}`);
      } else {
        existingInsights = (insights || []).map(insight => ({
          dimensionName: insight.dimension_name || 'general',
          score: insight.score,
          label: insight.label,
          llmSummary: insight.llm_summary,
          generatedAt: insight.generated_at || new Date().toISOString()
        }));
      }
    } catch (error: any) {
      console.warn('⚠️ Error fetching insights:', error);
      errors.push(`Insights fetch error: ${error.message}`);
    }

    // Step 4: Fetch dimension scores from latest assessment
    let dimensionScores: LLMContext['dimensionScores'] = [];
    try {
      // Get latest assessment for this profile
      const { data: latestAssessment, error: assessmentError } = await supabase
        .from('leader_assessments')
        .select('id')
        .eq('leader_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentError) {
        console.warn('⚠️ Assessment fetch failed:', assessmentError.message);
        errors.push(`Assessment fetch failed: ${assessmentError.message}`);
      } else if (latestAssessment) {
        const { data: scores, error: scoresError } = await supabase
          .from('leader_dimension_scores')
          .select('dimension_key, score_numeric, dimension_tier, explanation')
          .eq('assessment_id', latestAssessment.id)
          .order('dimension_key');

        if (scoresError) {
          console.warn('⚠️ Dimension scores fetch failed:', scoresError.message);
          errors.push(`Dimension scores fetch failed: ${scoresError.message}`);
        } else {
          dimensionScores = (scores || []).map(score => ({
            dimensionKey: score.dimension_key || 'unknown',
            scoreNumeric: score.score_numeric || 50,
            dimensionTier: score.dimension_tier || 'AI-Aware',
            explanation: score.explanation || ''
          }));
        }
      }
    } catch (error: any) {
      console.warn('⚠️ Error fetching dimension scores:', error);
      errors.push(`Dimension scores fetch error: ${error.message}`);
    }

    // Step 5: Build tool context
    const toolContext: LLMContext['toolContext'] = {
      toolName,
      flowName,
      goals: getToolGoals(toolName, flowName)
    };

    const context: LLMContext = {
      profile: {
        id: profile.id,
        email: profile.email || null,
        name: profile.name || null,
        role: profile.role || null,
        company: profile.company || null
      },
      recentEvents,
      existingInsights,
      dimensionScores,
      toolContext
    };

    return {
      success: true,
      context,
      errors
    };
  } catch (error: any) {
    console.error('❌ Unexpected error in buildLLMContext:', error);
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return {
      success: false,
      context: null,
      errors
    };
  }
}

/**
 * Gets tool-specific goals
 */
function getToolGoals(toolName: string, flowName: string | null): string[] {
  const goals: Record<string, string[]> = {
    quiz: [
      'Assess AI leadership readiness',
      'Identify key strengths and gaps',
      'Generate personalized insights'
    ],
    voice: [
      'Capture voice responses',
      'Extract decision-making patterns',
      'Identify communication style'
    ],
    chat: [
      'Engage in conversational assessment',
      'Explore AI leadership challenges',
      'Provide real-time guidance'
    ],
    deep_profile: [
      'Build comprehensive leadership profile',
      'Identify bottlenecks and opportunities',
      'Create personalized development path'
    ]
  };

  return goals[toolName] || ['Complete assessment', 'Generate insights'];
}

/**
 * Formats context for assessment_analyzer mode
 */
export function formatContextForAssessmentAnalyzer(context: LLMContext): string {
  const { profile, recentEvents, existingInsights, dimensionScores, toolContext } = context;

  let formatted = `=== PROFILE ===
Name: ${profile.name || 'Anonymous'}
Role: ${profile.role || 'Leader'}
Company: ${profile.company || 'Unknown'}

=== RECENT RESPONSES (${recentEvents.length} events) ===
`;

  recentEvents.slice(0, 10).forEach((event, idx) => {
    formatted += `${idx + 1}. ${event.questionText}
   Response: "${event.rawInput.substring(0, 200)}${event.rawInput.length > 200 ? '...' : ''}"
   Dimension: ${event.dimensionKey || 'general'}
   
`;
  });

  if (dimensionScores.length > 0) {
    formatted += `=== EXISTING DIMENSION SCORES ===
`;
    dimensionScores.forEach(score => {
      formatted += `${score.dimensionKey}: ${score.scoreNumeric}/100 (${score.dimensionTier})
   ${score.explanation}
   
`;
    });
  }

  if (existingInsights.length > 0) {
    formatted += `=== EXISTING INSIGHTS ===
`;
    existingInsights.slice(0, 5).forEach(insight => {
      formatted += `${insight.dimensionName}: ${insight.label || 'N/A'} (${insight.score || 'N/A'}/100)
   ${insight.llmSummary || 'No summary'}
   
`;
    });
  }

  formatted += `=== TOOL CONTEXT ===
Tool: ${toolContext.toolName}
Flow: ${toolContext.flowName || 'default'}
Goals: ${toolContext.goals.join(', ')}
`;

  return formatted;
}

/**
 * Formats context for portfolio_analyzer mode
 */
export function formatContextForPortfolioAnalyzer(context: LLMContext): string {
  // Similar to assessment_analyzer but focused on portfolio/company-level analysis
  return formatContextForAssessmentAnalyzer(context) + `

=== PORTFOLIO ANALYSIS FOCUS ===
Analyze across multiple assessments/companies
Identify patterns and trends
Recommend strategic path (Bootcamp / Sprint / Diagnostic)
`;
}

/**
 * Formats context for session_synthesizer mode
 */
export function formatContextForSessionSynthesizer(context: LLMContext): string {
  const { profile, recentEvents, toolContext } = context;

  let formatted = `=== SESSION SYNTHESIS ===
Profile: ${profile.name || 'Anonymous'} (${profile.role || 'Leader'})
Session Events: ${recentEvents.length}
Tool: ${toolContext.toolName}
Flow: ${toolContext.flowName || 'default'}

=== KEY INTERACTIONS ===
`;

  recentEvents.forEach((event, idx) => {
    formatted += `${idx + 1}. ${event.questionText}
   → ${event.rawInput.substring(0, 150)}${event.rawInput.length > 150 ? '...' : ''}
   
`;
  });

  formatted += `=== SYNTHESIS GOALS ===
Generate executive summary of session
Create 90-day development path
Identify immediate next steps
`;

  return formatted;
}
