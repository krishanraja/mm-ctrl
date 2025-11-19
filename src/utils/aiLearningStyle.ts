import { DeepProfileData } from '@/components/DeepProfileQuestionnaire';

export type AILearningStyle = 
  | 'strategic_visionary' 
  | 'pragmatic_executor' 
  | 'collaborative_builder' 
  | 'analytical_optimizer' 
  | 'adaptive_explorer';

export interface LearningStyleProfile {
  id: AILearningStyle;
  label: string;
  description: string;
  strengths: string[];
  aiApproach: string;
  icon: string;
}

export const LEARNING_STYLE_PROFILES: Record<AILearningStyle, LearningStyleProfile> = {
  strategic_visionary: {
    id: 'strategic_visionary',
    label: 'Strategic Visionary',
    description: 'You lead with vision and long-term thinking. You excel at seeing patterns and opportunities.',
    strengths: ['Big picture thinking', 'Innovation focus', 'Market awareness'],
    aiApproach: 'You use AI as a strategic advisor for scenario planning and trend analysis.',
    icon: '🔭'
  },
  pragmatic_executor: {
    id: 'pragmatic_executor',
    label: 'Pragmatic Executor',
    description: 'You focus on getting things done efficiently. You value clear metrics and tangible outcomes.',
    strengths: ['Action-oriented', 'Data-driven decisions', 'Process optimization'],
    aiApproach: 'You leverage AI to automate workflows and accelerate execution.',
    icon: '⚡'
  },
  collaborative_builder: {
    id: 'collaborative_builder',
    label: 'Collaborative Builder',
    description: 'You thrive on teamwork and developing people. You create alignment through connection.',
    strengths: ['Team development', 'Stakeholder engagement', 'Culture building'],
    aiApproach: 'You use AI to enhance communication and empower your team.',
    icon: '🤝'
  },
  analytical_optimizer: {
    id: 'analytical_optimizer',
    label: 'Analytical Optimizer',
    description: 'You dive deep into data and systems. You excel at finding inefficiencies and improvements.',
    strengths: ['Data analysis', 'System thinking', 'Performance metrics'],
    aiApproach: 'You employ AI for deep analytics and continuous optimization.',
    icon: '📊'
  },
  adaptive_explorer: {
    id: 'adaptive_explorer',
    label: 'Adaptive Explorer',
    description: 'You balance multiple approaches and stay flexible. You learn by experimenting.',
    strengths: ['Versatility', 'Learning agility', 'Experimentation'],
    aiApproach: 'You use AI across diverse use cases to discover what works best.',
    icon: '🎯'
  }
};

/**
 * Determines AI Learning Style cohort based on deep profile questionnaire responses
 */
export function determineAILearningStyle(deepProfile: DeepProfileData): AILearningStyle {
  const scores = {
    strategic_visionary: 0,
    pragmatic_executor: 0,
    collaborative_builder: 0,
    analytical_optimizer: 0,
    adaptive_explorer: 0
  };

  // Strategic Visionary scoring (max 100 points)
  scores.strategic_visionary += (deepProfile.workBreakdown.planning / 100) * 30;
  
  const strategyKeywords = ['innovation', 'market', 'strategy', 'vision', 'future', 'competitive', 'positioning'];
  const transformationLower = deepProfile.transformationGoal.toLowerCase();
  const matchingKeywords = strategyKeywords.filter(kw => transformationLower.includes(kw));
  scores.strategic_visionary += matchingKeywords.length * 8;
  
  if (deepProfile.informationNeeds.includes('Market trends')) scores.strategic_visionary += 15;
  if (deepProfile.informationNeeds.includes('Competitive intelligence')) scores.strategic_visionary += 10;
  
  const thinkingLower = deepProfile.thinkingProcess.toLowerCase();
  if (thinkingLower.includes('big picture') || thinkingLower.includes('vision') || thinkingLower.includes('strategic')) {
    scores.strategic_visionary += 15;
  }

  // Pragmatic Executor scoring (max 100 points)
  scores.pragmatic_executor += (deepProfile.workBreakdown.decisions / 100) * 30;
  
  const concise = deepProfile.communicationStyle.includes('Concise & data-driven');
  const directive = deepProfile.communicationStyle.includes('Directive & action-oriented');
  if (concise || directive) scores.pragmatic_executor += 20;
  
  if (deepProfile.delegateTasks.length > 3) scores.pragmatic_executor += 15;
  
  const wasteExamplesLower = deepProfile.timeWasteExamples.toLowerCase();
  if (wasteExamplesLower.includes('meeting') || wasteExamplesLower.includes('admin') || wasteExamplesLower.includes('bureaucracy')) {
    scores.pragmatic_executor += 15;
  }
  
  if (deepProfile.timeWaste > 30) scores.pragmatic_executor += 10;
  
  if (deepProfile.informationNeeds.includes('Performance metrics')) scores.pragmatic_executor += 10;

  // Collaborative Builder scoring (max 100 points)
  scores.collaborative_builder += (deepProfile.workBreakdown.coaching / 100) * 30;
  
  const storytelling = deepProfile.communicationStyle.includes('Storytelling & narrative');
  const empathetic = deepProfile.communicationStyle.includes('Empathetic & relationship-focused');
  if (storytelling || empathetic) scores.collaborative_builder += 20;
  
  if (deepProfile.stakeholders.length > 4) scores.collaborative_builder += 15;
  
  const challengeLower = deepProfile.biggestChallenge.toLowerCase();
  if (challengeLower.includes('team') || challengeLower.includes('alignment') || challengeLower.includes('culture') || challengeLower.includes('people')) {
    scores.collaborative_builder += 15;
  }
  
  const transformationTeam = transformationLower.includes('team') || transformationLower.includes('culture') || transformationLower.includes('people');
  if (transformationTeam) scores.collaborative_builder += 10;
  
  if (deepProfile.informationNeeds.includes('Team performance data')) scores.collaborative_builder += 10;

  // Analytical Optimizer scoring (max 100 points)
  const writingPresentation = deepProfile.workBreakdown.writing + deepProfile.workBreakdown.presentations;
  scores.analytical_optimizer += (writingPresentation / 100) * 25;
  
  if (thinkingLower.includes('data') || thinkingLower.includes('analytic') || thinkingLower.includes('systematic') || thinkingLower.includes('methodical')) {
    scores.analytical_optimizer += 20;
  }
  
  const analyticalInfo = ['Performance metrics', 'Industry benchmarks', 'Process documentation'].filter(
    item => deepProfile.informationNeeds.includes(item)
  );
  scores.analytical_optimizer += analyticalInfo.length * 10;
  
  if (deepProfile.communicationStyle.includes('Visual & data-focused')) scores.analytical_optimizer += 15;
  
  if (challengeLower.includes('efficiency') || challengeLower.includes('process') || challengeLower.includes('optimize')) {
    scores.analytical_optimizer += 10;
  }

  // Adaptive Explorer scoring (earned points only - no baseline advantage)
  scores.adaptive_explorer = 0;
  
  // Bonus for balanced work breakdown (no single area dominates)
  const workValues = Object.values(deepProfile.workBreakdown);
  const maxWork = Math.max(...workValues);
  const minWork = Math.min(...workValues);
  const workRange = maxWork - minWork;
  
  // Reward true balance (smaller range = more balanced)
  if (workRange < 15) scores.adaptive_explorer += 30; // Very balanced
  else if (workRange < 25) scores.adaptive_explorer += 20; // Balanced
  else if (workRange < 35) scores.adaptive_explorer += 10; // Somewhat balanced
  
  // Bonus for diverse communication styles
  if (deepProfile.communicationStyle.length >= 3) scores.adaptive_explorer += 15;
  else if (deepProfile.communicationStyle.length >= 2) scores.adaptive_explorer += 8;
  
  // Bonus for diverse information needs
  if (deepProfile.informationNeeds.length >= 5) scores.adaptive_explorer += 15;
  else if (deepProfile.informationNeeds.length >= 4) scores.adaptive_explorer += 10;
  else if (deepProfile.informationNeeds.length >= 3) scores.adaptive_explorer += 5;
  
  // Bonus for learning/experimentation/flexibility mentions
  const adaptiveKeywords = ['learn', 'experiment', 'adapt', 'flexible', 'versatile', 'explore'];
  const matchingAdaptive = adaptiveKeywords.filter(kw => 
    thinkingLower.includes(kw) || transformationLower.includes(kw) || challengeLower.includes(kw)
  );
  scores.adaptive_explorer += matchingAdaptive.length * 8;

  // Return cohort with highest score
  const entries = Object.entries(scores) as [AILearningStyle, number][];
  const winner = entries.reduce((a, b) => b[1] > a[1] ? b : a);
  
  console.log('🎯 AI Learning Style Scores:', scores);
  console.log('🏆 Winner:', winner[0], 'with', winner[1], 'points');
  console.log('📊 Score breakdown:', {
    strategic_visionary: scores.strategic_visionary,
    pragmatic_executor: scores.pragmatic_executor,
    collaborative_builder: scores.collaborative_builder,
    analytical_optimizer: scores.analytical_optimizer,
    adaptive_explorer: scores.adaptive_explorer
  });
  
  return winner[0];
}

/**
 * Get learning style profile by ID
 */
export function getLearningStyleProfile(style: AILearningStyle): LearningStyleProfile {
  return LEARNING_STYLE_PROFILES[style];
}

/**
 * Format learning style for display
 */
export function formatLearningStyle(style: AILearningStyle): string {
  return LEARNING_STYLE_PROFILES[style].label;
}
