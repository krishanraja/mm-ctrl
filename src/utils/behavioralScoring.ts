import { DeepProfileData } from '@/components/DeepProfileQuestionnaire';

/**
 * Behavioral Scoring Engine
 * Analyzes deep profile data to create behavioral multipliers that adjust raw quiz scores
 */

export interface BehavioralMultipliers {
  experimentationWeight: number; // 0.7 - 1.3
  delegationWeight: number; // 0.7 - 1.3
  stakeholderComplexity: number; // 0.8 - 1.2
  timeOptimization: number; // 0.8 - 1.2
}

export interface ExecutionGap {
  dimension: string;
  gapSize: number; // -30 to +30
  insight: string;
  recommendation: string;
}

/**
 * Calculate behavioral multipliers from deep profile data
 */
export function calculateBehavioralMultipliers(
  deepProfile: DeepProfileData | null
): BehavioralMultipliers {
  if (!deepProfile) {
    return {
      experimentationWeight: 1.0,
      delegationWeight: 1.0,
      stakeholderComplexity: 1.0,
      timeOptimization: 1.0,
    };
  }

  // Experimentation Reality Check
  const experimentationWeight = calculateExperimentationReality(deepProfile);
  
  // Delegation Readiness
  const delegationWeight = calculateDelegationReadiness(deepProfile);
  
  // Stakeholder Complexity Load
  const stakeholderComplexity = calculateStakeholderLoad(deepProfile);
  
  // Time Optimization Impact
  const timeOptimization = calculateTimeWasteImpact(deepProfile);

  return {
    experimentationWeight,
    delegationWeight,
    stakeholderComplexity,
    timeOptimization,
  };
}

/**
 * Experimentation Reality: Do they actually test AI or just talk about it?
 */
function calculateExperimentationReality(profile: DeepProfileData): number {
  let weight = 1.0;
  
  // Time waste indicates potential for AI adoption
  const timeWaste = profile.timeWaste || 0;
  if (timeWaste >= 50) weight += 0.2; // High waste = high potential
  else if (timeWaste >= 30) weight += 0.1; // Medium waste
  else if (timeWaste < 15) weight -= 0.1; // Already optimized
  
  // Work breakdown shows hands-on complexity
  const planningTime = profile.workBreakdown?.planning || 0;
  const decisionsTime = profile.workBreakdown?.decisions || 0;
  const strategicWork = planningTime + decisionsTime;
  if (strategicWork >= 50) weight += 0.1; // High strategic load = AI opportunity
  
  return Math.max(0.7, Math.min(1.3, weight));
}

/**
 * Delegation Readiness: Do they actually let go of control?
 */
function calculateDelegationReadiness(profile: DeepProfileData): number {
  let weight = 1.0;
  
  // Delegation tasks indicate willingness to let go
  const delegateCount = profile.delegateTasks?.length || 0;
  if (delegateCount >= 3) weight += 0.2; // Ready to delegate
  else if (delegateCount >= 1) weight += 0.1; // Some delegation
  else weight -= 0.15; // Control issues
  
  // Coaching time shows investment in team capability
  const coachingTime = profile.workBreakdown?.coaching || 0;
  if (coachingTime >= 30) weight += 0.1; // High delegation enabler
  else if (coachingTime < 10) weight -= 0.1; // Not building team capacity
  
  return Math.max(0.7, Math.min(1.3, weight));
}

/**
 * Stakeholder Complexity: More audiences = harder to align
 */
function calculateStakeholderLoad(profile: DeepProfileData): number {
  let weight = 1.0;
  
  const stakeholderCount = profile.stakeholders?.length || 0;
  if (stakeholderCount >= 5) weight -= 0.15; // High complexity
  else if (stakeholderCount >= 3) weight -= 0.05; // Medium complexity
  else if (stakeholderCount <= 1) weight += 0.1; // Simple stakeholder map
  
  // Communication style complexity
  const commStyleCount = profile.communicationStyle?.length || 0;
  if (commStyleCount >= 4) weight -= 0.05; // Many styles = complex alignment
  
  return Math.max(0.8, Math.min(1.2, weight));
}

/**
 * Time Optimization: Do they have capacity to adopt AI?
 */
function calculateTimeWasteImpact(profile: DeepProfileData): number {
  let weight = 1.0;
  
  const timeWaste = profile.timeWaste || 0;
  
  // More waste = higher potential for AI impact
  if (timeWaste >= 50) weight += 0.15; // Lots of inefficiency to fix
  else if (timeWaste >= 30) weight += 0.1; // Some inefficiency
  else if (timeWaste < 15) weight -= 0.1; // Already optimized
  
  return Math.max(0.8, Math.min(1.2, weight));
}

/**
 * Adjust dimension scores based on behavioral reality
 */
export function applyBehavioralAdjustments(
  baseScores: Record<string, number>,
  deepProfile: DeepProfileData | null
): Record<string, number> {
  if (!deepProfile) return baseScores;
  
  const multipliers = calculateBehavioralMultipliers(deepProfile);
  
  return {
    aiFluencyScore: Math.round(baseScores.aiFluencyScore * multipliers.experimentationWeight),
    decisionVelocityScore: Math.round(baseScores.decisionVelocityScore * multipliers.delegationWeight),
    experimentationScore: Math.round(baseScores.experimentationScore * multipliers.experimentationWeight),
    delegationScore: Math.round(baseScores.delegationScore * multipliers.delegationWeight),
    alignmentScore: Math.round(baseScores.alignmentScore * multipliers.stakeholderComplexity),
    riskGovernanceScore: Math.round(baseScores.riskGovernanceScore * multipliers.delegationWeight),
  };
}

/**
 * Identify execution gaps (theory vs practice)
 */
export function calculateExecutionGaps(
  baseScores: Record<string, number>,
  adjustedScores: Record<string, number>,
  deepProfile: DeepProfileData | null
): ExecutionGap[] {
  if (!deepProfile) return [];
  
  const gaps: ExecutionGap[] = [];
  
  // Check each dimension for gaps
  const dimensions = [
    { key: 'aiFluencyScore', name: 'AI Fluency' },
    { key: 'decisionVelocityScore', name: 'Decision Velocity' },
    { key: 'experimentationScore', name: 'Experimentation' },
    { key: 'delegationScore', name: 'Delegation' },
    { key: 'alignmentScore', name: 'Alignment' },
  ];
  
  dimensions.forEach(({ key, name }) => {
    const base = baseScores[key] || 0;
    const adjusted = adjustedScores[key] || 0;
    const gapSize = adjusted - base;
    
    // Only report significant gaps (>5 points)
    if (Math.abs(gapSize) > 5) {
      gaps.push({
        dimension: name,
        gapSize,
        insight: generateGapInsight(name, gapSize, deepProfile),
        recommendation: generateGapRecommendation(name, gapSize, deepProfile),
      });
    }
  });
  
  return gaps;
}

function generateGapInsight(dimension: string, gap: number, profile: DeepProfileData): string {
  if (gap > 0) {
    return `Your ${dimension} is stronger in practice than in awareness. You're doing better than you think.`;
  } else {
    switch (dimension) {
      case 'AI Fluency':
        return `You're aware of AI opportunities but ${profile.timeWaste || 0}% time waste suggests execution gaps. Theory-practice gap detected.`;
      case 'Experimentation':
        return `Strong AI awareness, but with ${profile.timeWaste || 0}% time waste, there's room to experiment more with AI solutions.`;
      case 'Delegation':
        const delegateCount = profile.delegateTasks?.length || 0;
        return `Conceptually ready to delegate to AI, but only ${delegateCount} tasks identified suggests lingering control concerns.`;
      default:
        return `Gap between awareness and execution in ${dimension}. Behavioral patterns limiting impact.`;
    }
  }
}

function generateGapRecommendation(dimension: string, gap: number, profile: DeepProfileData): string {
  if (gap > 0) {
    return `Document your current practices—you're further ahead than you realize. Share your approach with peers.`;
  } else {
    const timeWaste = profile.timeWaste || 0;
    switch (dimension) {
      case 'AI Fluency':
        return `Block 5hrs/week for hands-on AI experimentation. With ${timeWaste}% time waste, reclaim that time for AI learning.`;
      case 'Experimentation':
        return `Commit to one 2-week AI pilot this quarter. Target areas from your time waste examples: "${profile.timeWasteExamples?.substring(0, 50)}..."`;
      case 'Delegation':
        const delegateCount = profile.delegateTasks?.length || 0;
        return `Add 3 more tasks to your delegation list (currently: ${delegateCount}). Practice "AI-first decisions" for low-stakes choices.`;
      default:
        return `Close the gap with structured action: measure current baseline, set 30-day target, track weekly progress.`;
    }
  }
}
