// Phase 1: Store assessment events with question+answer pairs for full context

import { supabase } from '@/integrations/supabase/client';

export async function storeAssessmentEvents(
  assessmentId: string,
  leaderId: string,
  sessionId: string,
  assessmentData: any,
  deepProfileData: any,
  source: 'quiz' | 'voice'
): Promise<void> {
  console.log('💾 Storing assessment events with question+answer context...');
  
  const events: any[] = [];
  
  // Get question definitions (will be in DB after migration, for now use mappings)
  const dimensionQuestions: Record<string, string> = {
    aiFluencyScore: "I can clearly explain AI's impact on our industry in growth terms",
    decisionVelocityScore: "I know which areas of our business can be accelerated by AI-first workflows",
    experimentationScore: "My leadership team shares a common AI growth narrative",
    delegationScore: "AI is part of our external positioning (investors, market)",
    alignmentScore: "I connect AI adoption directly to KPIs (margin, speed, risk-adjusted growth)",
    riskGovernanceScore: "I actively coach emerging AI champions in my org"
  };
  
  // Store quiz responses
  Object.entries(assessmentData).forEach(([key, value]) => {
    if (dimensionQuestions[key]) {
      events.push({
        assessment_id: assessmentId,
        session_id: sessionId,
        profile_id: leaderId,
        event_type: 'question_answered',
        tool_name: source,
        flow_name: 'assessment_quiz',
        question_id: key,
        question_text: dimensionQuestions[key],
        dimension_key: key.replace('Score', ''),
        raw_input: `Score: ${value}/100`,
        structured_values: {
          score: Number(value) || 0,
          normalized_score: (Number(value) || 0) / 100
        }
      });
    }
  });
  
  // Store deep profile responses
  if (deepProfileData) {
    const deepProfileQuestions: Record<string, string> = {
      timeWaste: "What percentage of your time is spent on repetitive tasks that could be automated?",
      delegationTasks: "How many tasks do you currently delegate regularly?",
      stakeholderNeeds: "How many different stakeholder groups do you serve?",
      urgency: "What's your urgency level for AI adoption?",
      primaryBottleneck: "What's your primary bottleneck?"
    };
    
    Object.entries(deepProfileData).forEach(([key, value]) => {
      if (deepProfileQuestions[key] && value !== undefined && value !== null) {
        events.push({
          assessment_id: assessmentId,
          session_id: sessionId,
          profile_id: leaderId,
          event_type: 'deep_profile_completed',
          tool_name: source,
          flow_name: 'deep_profile',
          question_id: `deep_${key}`,
          question_text: deepProfileQuestions[key],
          dimension_key: key,
          raw_input: String(value),
          structured_values: {
            value,
            type: typeof value
          }
        });
      }
    });
  }
  
  // Batch insert all events
  if (events.length > 0) {
    const { error } = await supabase
      .from('assessment_events')
      .insert(events);
    
    if (error) {
      console.error('❌ Failed to store assessment events:', error);
    } else {
      console.log('✅ Stored', events.length, 'assessment events with full question context');
    }
  }
}

export async function storeBehavioralAdjustments(
  assessmentId: string,
  deepProfileData: any,
  adjustedScores: any,
  baseScores: any
): Promise<void> {
  console.log('💾 Storing behavioral adjustments for transparency...');
  
  // Calculate weights based on deep profile
  const experimentationWeight = deepProfileData.urgency === 'immediate' ? 1.15 : 1.0;
  const delegationWeight = deepProfileData.delegationTasks > 5 ? 1.1 : 1.0;
  const stakeholderComplexity = deepProfileData.stakeholderNeeds > 3 ? 1.1 : 1.0;
  const timeOptimization = deepProfileData.timeWaste > 30 ? 1.15 : 1.0;
  
  const adjustment = {
    assessment_id: assessmentId,
    experimentation_weight: experimentationWeight,
    delegation_weight: delegationWeight,
    stakeholder_complexity: stakeholderComplexity,
    time_optimization: timeOptimization,
    adjustment_rationale: {
      urgency_impact: deepProfileData.urgency === 'immediate' ? 'High urgency boosts experimentation score by 15%' : 'Normal urgency, no boost',
      delegation_impact: deepProfileData.delegationTasks > 5 ? 'Strong delegation habits boost delegation score by 10%' : 'Limited delegation, no boost',
      stakeholder_impact: deepProfileData.stakeholderNeeds > 3 ? 'High stakeholder complexity boosts alignment score by 10%' : 'Normal stakeholder count, no boost',
      time_impact: deepProfileData.timeWaste > 30 ? 'High time waste (>30%) boosts AI fluency potential by 15%' : 'Low time waste, no boost'
    },
    raw_inputs: {
      timeWaste: deepProfileData.timeWaste,
      delegationTasks: deepProfileData.delegationTasks,
      stakeholderNeeds: deepProfileData.stakeholderNeeds,
      urgency: deepProfileData.urgency,
      base_scores: baseScores,
      adjusted_scores: adjustedScores
    }
  };
  
  const { error } = await supabase
    .from('assessment_behavioral_adjustments')
    .insert(adjustment);
  
  if (error) {
    console.error('❌ Failed to store behavioral adjustments:', error);
  } else {
    console.log('✅ Stored behavioral adjustments with full rationale');
  }
}
