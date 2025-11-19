/**
 * Converts quiz assessment data to v2 format expected by orchestrateAssessmentV2
 * 
 * Quiz categories -> V2 Dimensions mapping:
 * - industry_impact → aiFluencyScore (Q1: "I can clearly explain AI's impact")
 * - business_acceleration → experimentationScore (Q2: "I know which areas can be accelerated")
 * - team_alignment → alignmentScore (Q3: "My team shares a common AI narrative")
 * - external_positioning → decisionVelocityScore (Q4: "AI is part of our external positioning")
 * - kpi_connection → delegationScore (Q5: "I connect AI to KPIs")
 * - coaching_champions → riskGovernanceScore (Q6: "I coach AI champions")
 */

export interface QuizAssessmentData {
  industry_impact?: string;
  business_acceleration?: string;
  team_alignment?: string;
  external_positioning?: string;
  kpi_connection?: string;
  coaching_champions?: string;
}

export interface V2AssessmentData {
  aiFluencyScore: number;
  experimentationScore: number;
  alignmentScore: number;
  decisionVelocityScore: number;
  delegationScore: number;
  riskGovernanceScore: number;
}

/**
 * Extracts numeric score from Likert scale string answer
 * Examples: "5 - Strongly Agree" → 5, "3 - Neutral" → 3
 */
function extractNumericScore(answer: string | undefined): number {
  if (!answer) return 0;
  
  const match = answer.match(/^(\d+)/);
  if (!match) return 0;
  
  const score = parseInt(match[1], 10);
  return isNaN(score) ? 0 : score;
}

/**
 * Converts raw score (1-5) to percentage (0-100)
 */
function normalizeScore(rawScore: number): number {
  if (rawScore <= 0) return 0;
  if (rawScore >= 5) return 100;
  return Math.round((rawScore / 5) * 100);
}

/**
 * Main conversion function: transforms quiz data to v2 format
 */
export function convertQuizToV2Format(quizData: QuizAssessmentData): V2AssessmentData {
  console.log('🔄 Converting quiz data to v2 format:', quizData);
  
  const rawScores = {
    industry_impact: extractNumericScore(quizData.industry_impact),
    business_acceleration: extractNumericScore(quizData.business_acceleration),
    team_alignment: extractNumericScore(quizData.team_alignment),
    external_positioning: extractNumericScore(quizData.external_positioning),
    kpi_connection: extractNumericScore(quizData.kpi_connection),
    coaching_champions: extractNumericScore(quizData.coaching_champions),
  };
  
  console.log('📊 Raw scores extracted:', rawScores);
  
  const v2Data: V2AssessmentData = {
    aiFluencyScore: normalizeScore(rawScores.industry_impact),
    experimentationScore: normalizeScore(rawScores.business_acceleration),
    alignmentScore: normalizeScore(rawScores.team_alignment),
    decisionVelocityScore: normalizeScore(rawScores.external_positioning),
    delegationScore: normalizeScore(rawScores.kpi_connection),
    riskGovernanceScore: normalizeScore(rawScores.coaching_champions),
  };
  
  console.log('✅ V2 format data:', v2Data);
  
  return v2Data;
}
