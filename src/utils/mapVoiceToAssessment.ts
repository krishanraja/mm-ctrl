import { CompassResults, RoiEstimate } from '@/types/voice';

interface VoiceAssessmentData {
  // V2 format: 6 dimension scores (0-100 scale)
  aiFluencyScore: number;
  experimentationScore: number;
  alignmentScore: number;
  decisionVelocityScore: number;
  delegationScore: number;
  riskGovernanceScore: number;
  estimatedScore: number;
  tier: string;
}

/**
 * Converts 1-5 Compass score to 0-100 percentage
 */
function normalizeCompassScore(score: number | undefined): number {
  if (!score || score <= 0) return 0;
  if (score >= 5) return 100;
  return Math.round((score / 5) * 100);
}

/**
 * Maps voice assessment data (compass + ROI) to v2 format
 * This allows voice users to access v2 diagnostic features
 * 
 * Compass dimensions → V2 dimensions mapping:
 * - ai_fluency → aiFluencyScore
 * - experimentation → experimentationScore  
 * - alignment → alignmentScore
 * - decision_velocity → decisionVelocityScore
 * - vision → delegationScore (proxy: strategic vision drives delegation)
 * - governance → riskGovernanceScore
 */
export function mapVoiceToAssessment(
  compassResults: CompassResults,
  roiEstimate: RoiEstimate | null
): VoiceAssessmentData {
  const { scores, tier } = compassResults;

  // Convert compass scores to v2 dimension scores (0-100 scale)
  const v2Data = {
    aiFluencyScore: normalizeCompassScore(scores.ai_fluency),
    experimentationScore: normalizeCompassScore(scores.experimentation),
    alignmentScore: normalizeCompassScore(scores.alignment),
    decisionVelocityScore: normalizeCompassScore(scores.decision_velocity),
    delegationScore: normalizeCompassScore(scores.vision), // Vision as proxy for delegation
    riskGovernanceScore: normalizeCompassScore(scores.governance),
  };

  // Calculate average score
  const totalScore = Object.values(v2Data).reduce((sum, val) => sum + val, 0);
  const avgScore = Math.round(totalScore / 6);

  console.log('🎤 Voice to V2 conversion:', { compassScores: scores, v2Data, avgScore });

  return {
    ...v2Data,
    estimatedScore: avgScore,
    tier: tier || 'Establishing'
  };
}

/**
 * Creates minimal deep profile data from voice assessment
 */
export function createMinimalDeepProfile(
  compassResults: CompassResults,
  contactEmail: string
) {
  return {
    industry: 'Not specified',
    companySize: 'Not specified',
    currentChallenges: compassResults.focusAreas || [],
    aiExperience: 'Voice assessment - see compass results',
    urgency: 'High (completed voice assessment)',
    contactEmail
  };
}
