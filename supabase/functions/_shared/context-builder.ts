// Phase 2: Context builder for rich LLM inputs

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AssessmentContext {
  leader: any;
  currentAssessment: any;
  previousAssessments: any[];
  rawResponses: any[];
  chatHistory: any[];
  existingInsights: {
    riskSignals: any[];
    tensions: any[];
    dimensionScores: any[];
  };
  contextMetadata: {
    dataCompleteness: number;
    hasHistoricalData: boolean;
    assessmentType: string;
    toolContext: string;
  };
}

export async function buildAssessmentContext(
  supabase: any,
  leaderId: string,
  assessmentId: string
): Promise<AssessmentContext> {
  console.log('🔍 Building comprehensive assessment context...');
  
  // 1. Get leader profile
  const { data: leader, error: leaderError } = await supabase
    .from('leaders')
    .select('*')
    .eq('id', leaderId)
    .single();
  
  if (leaderError) {
    console.error('❌ Failed to fetch leader:', leaderError);
  }

  // 2. Get current assessment
  const { data: currentAssessment, error: assessmentError } = await supabase
    .from('leader_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (assessmentError) {
    console.error('❌ Failed to fetch assessment:', assessmentError);
  }

  // 3. Get all previous assessments (for trajectory analysis)
  const { data: previousAssessments, error: prevError } = await supabase
    .from('leader_assessments')
    .select(`
      *,
      leader_dimension_scores(*)
    `)
    .eq('leader_id', leaderId)
    .neq('id', assessmentId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (prevError) {
    console.error('❌ Failed to fetch previous assessments:', prevError);
  }

  // 4. Get current assessment events (Q&A pairs with full question text)
  const { data: rawResponses, error: eventsError } = await supabase
    .from('assessment_events')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at');

  if (eventsError) {
    console.error('❌ Failed to fetch assessment events:', eventsError);
  }

  // 5. Get chat history if exists
  const { data: chatHistory, error: chatError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at')
    .limit(50);

  if (chatError) {
    console.error('❌ Failed to fetch chat history:', chatError);
  }

  // 6. Get existing insights for this assessment
  const [riskSignals, tensions, dimensionScores] = await Promise.all([
    supabase
      .from('leader_risk_signals')
      .select('*')
      .eq('assessment_id', assessmentId)
      .then((r: any) => r.data || []),
    
    supabase
      .from('leader_tensions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .then((r: any) => r.data || []),
    
    supabase
      .from('leader_dimension_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .then((r: any) => r.data || [])
  ]);

  // 7. Calculate data completeness
  const dataPoints = [
    leader ? 1 : 0,
    currentAssessment ? 1 : 0,
    (rawResponses?.length || 0) > 0 ? 1 : 0,
    (previousAssessments?.length || 0) > 0 ? 1 : 0,
    (chatHistory?.length || 0) > 0 ? 1 : 0
  ];
  const dataCompleteness = (dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length) * 100;

  const context: AssessmentContext = {
    leader: leader || {},
    currentAssessment: currentAssessment || {},
    previousAssessments: previousAssessments || [],
    rawResponses: rawResponses || [],
    chatHistory: chatHistory || [],
    existingInsights: {
      riskSignals: riskSignals || [],
      tensions: tensions || [],
      dimensionScores: dimensionScores || []
    },
    contextMetadata: {
      dataCompleteness: Math.round(dataCompleteness),
      hasHistoricalData: (previousAssessments?.length || 0) > 0,
      assessmentType: currentAssessment?.source || 'unknown',
      toolContext: currentAssessment?.source || 'unknown'
    }
  };

  console.log('✅ Context built:', {
    leaderFound: !!leader,
    previousAssessments: previousAssessments?.length || 0,
    rawResponses: rawResponses?.length || 0,
    chatMessages: chatHistory?.length || 0,
    dataCompleteness: `${context.contextMetadata.dataCompleteness}%`
  });

  return context;
}

export function formatContextForPrompt(context: AssessmentContext): string {
  let prompt = `# LEADER PROFILE\n`;
  prompt += `Name: ${context.leader.name || 'Unknown'}\n`;
  prompt += `Email: ${context.leader.email}\n`;
  prompt += `Role: ${context.leader.role || 'Not specified'}\n`;
  prompt += `Company: ${context.leader.company || 'Not specified'}\n`;
  prompt += `Company Size: ${context.leader.company_size_band || 'Not specified'}\n\n`;

  if (context.previousAssessments.length > 0) {
    prompt += `# HISTORICAL CONTEXT (${context.previousAssessments.length} previous assessments)\n`;
    context.previousAssessments.forEach((prev: any, idx: number) => {
      prompt += `Assessment ${idx + 1} (${new Date(prev.created_at).toLocaleDateString()}):\n`;
      prompt += `  - Benchmark Score: ${prev.benchmark_score}/100\n`;
      prompt += `  - Tier: ${prev.benchmark_tier}\n`;
      prompt += `  - Learning Style: ${prev.learning_style || 'N/A'}\n`;
    });
    prompt += `\n`;
  }

  if (context.rawResponses.length > 0) {
    prompt += `# CURRENT ASSESSMENT RESPONSES (${context.rawResponses.length} questions)\n`;
    prompt += `⚠️ CRITICAL: Questions provide essential context - analyze question + answer together!\n\n`;
    context.rawResponses.forEach((response: any) => {
      prompt += `Q: ${response.question_text}\n`;
      prompt += `A: ${response.raw_input}\n`;
      if (response.structured_values && Object.keys(response.structured_values).length > 0) {
        prompt += `Structured: ${JSON.stringify(response.structured_values)}\n`;
      }
      prompt += `Dimension: ${response.dimension_key}\n\n`;
    });
  }

  if (context.chatHistory.length > 0) {
    prompt += `# CHAT HISTORY (${context.chatHistory.length} messages)\n`;
    context.chatHistory.slice(0, 10).forEach((msg: any) => {
      prompt += `[${msg.role}]: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
    });
    prompt += `\n`;
  }

  if (context.existingInsights.dimensionScores.length > 0) {
    prompt += `# EXISTING DIMENSION SCORES\n`;
    context.existingInsights.dimensionScores.forEach((score: any) => {
      prompt += `- ${score.dimension_key}: ${score.score_numeric}/100 (${score.dimension_tier})\n`;
    });
    prompt += `\n`;
  }

  prompt += `# DATA QUALITY METADATA\n`;
  prompt += `Data Completeness: ${context.contextMetadata.dataCompleteness}%\n`;
  prompt += `Has Historical Data: ${context.contextMetadata.hasHistoricalData}\n`;
  prompt += `Assessment Type: ${context.contextMetadata.assessmentType}\n`;
  prompt += `Tool Context: ${context.contextMetadata.toolContext}\n`;

  return prompt;
}
