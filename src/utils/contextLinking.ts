/**
 * Context Linking - Link Responses Across Tools
 * 
 * Purpose: Links responses to tool_name, question_block, and enables cross-tool context queries
 * Enables queries like "Given everything this person said, how does their ai_posture look?"
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureArray, ensureString } from './pipelineGuards';

export interface QuestionMetadata {
  id?: string;
  toolName: string;
  dimensionKey?: string | null;
  questionId: string;
  questionBlock?: string | null;
  promptText: string;
  weight?: number;
}

export interface CrossToolContext {
  profileId: string;
  toolNames: string[];
  questionBlocks: string[];
  dimensions: string[];
  totalEvents: number;
  recentEvents: Array<{
    toolName: string;
    questionBlock: string | null;
    dimensionKey: string | null;
    questionText: string;
    rawInput: string;
    createdAt: string;
  }>;
}

/**
 * Links a response to context (tool_name, question_block)
 */
export async function linkResponseToContext(
  questionMetadata: QuestionMetadata
): Promise<{ success: boolean; questionId: string | null; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Upsert question metadata
    const { data: question, error: questionError } = await supabase
      .from('assessment_questions')
      .upsert({
        tool_name: questionMetadata.toolName,
        question_id: questionMetadata.questionId,
        dimension_key: questionMetadata.dimensionKey || null,
        question_block: questionMetadata.questionBlock || null,
        question_text: questionMetadata.promptText,
        weight: questionMetadata.weight || 1.0,
        active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tool_name,question_id'
      })
      .select('id')
      .single();

    if (questionError) {
      errors.push(`Failed to store question metadata: ${questionError.message}`);
      return { success: false, questionId: null, errors };
    }

    return {
      success: true,
      questionId: question?.id || questionMetadata.questionId,
      errors
    };
  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return { success: false, questionId: null, errors };
  }
}

/**
 * Builds cross-tool context for a profile
 */
export async function buildCrossToolContext(
  profileId: string,
  limit: number = 50
): Promise<{ success: boolean; context: CrossToolContext | null; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Fetch all events for this profile
    const { data: events, error: eventsError } = await supabase
      .from('assessment_events')
      .select('tool_name, flow_name, question_text, raw_input, dimension_key, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventsError) {
      errors.push(`Failed to fetch events: ${eventsError.message}`);
      return { success: false, context: null, errors };
    }

    const safeEvents = ensureArray(events, []);
    
    // Extract unique tool names, question blocks, and dimensions
    const toolNames = [...new Set(safeEvents.map(e => ensureString(e.tool_name, 'quiz')))];
    const questionBlocks = [...new Set(
      safeEvents
        .map(e => e.flow_name || null)
        .filter(Boolean)
        .map(b => ensureString(b, ''))
    )];
    const dimensions = [...new Set(
      safeEvents
        .map(e => e.dimension_key)
        .filter(Boolean)
        .map(d => ensureString(d, ''))
    )];

    const context: CrossToolContext = {
      profileId,
      toolNames,
      questionBlocks,
      dimensions,
      totalEvents: safeEvents.length,
      recentEvents: safeEvents.slice(0, 20).map(e => ({
        toolName: ensureString(e.tool_name, 'quiz'),
        questionBlock: e.flow_name || null,
        dimensionKey: e.dimension_key || null,
        questionText: ensureString(e.question_text, ''),
        rawInput: ensureString(e.raw_input, ''),
        createdAt: e.created_at || new Date().toISOString()
      }))
    };

    return {
      success: true,
      context,
      errors
    };
  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return { success: false, context: null, errors };
  }
}

/**
 * Queries insights across all tools for a dimension
 */
export async function queryDimensionAcrossTools(
  profileId: string,
  dimensionName: string
): Promise<{
  success: boolean;
  insights: Array<{
    toolName: string;
    score: number | null;
    label: string | null;
    llmSummary: string | null;
    generatedAt: string;
  }>;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const { data: insights, error: insightsError } = await supabase
      .from('profile_insights')
      .select('tool_name, score, label, llm_summary, generated_at')
      .eq('profile_id', profileId)
      .eq('dimension_name', dimensionName)
      .order('generated_at', { ascending: false })
      .limit(10);

    if (insightsError) {
      errors.push(`Failed to fetch insights: ${insightsError.message}`);
      return { success: false, insights: [], errors };
    }

    return {
      success: true,
      insights: ensureArray(insights, []).map(insight => ({
        toolName: ensureString(insight.tool_name, 'quiz'),
        score: insight.score,
        label: insight.label,
        llmSummary: insight.llm_summary,
        generatedAt: insight.generated_at || new Date().toISOString()
      })),
      errors
    };
  } catch (error: any) {
    errors.push(`Unexpected error: ${error.message || String(error)}`);
    return { success: false, insights: [], errors };
  }
}
