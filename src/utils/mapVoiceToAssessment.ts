import { CompassResults, RoiEstimate } from '@/types/voice';

interface VoiceAssessmentData {
  responses: Record<string, number>;
  estimatedScore: number;
  tier: string;
}

/**
 * Maps voice assessment data (compass + ROI) to the quiz assessment format
 * This allows voice users to access v2 diagnostic features
 */
export function mapVoiceToAssessment(
  compassResults: CompassResults,
  roiEstimate: RoiEstimate | null
): VoiceAssessmentData {
  const { scores, tier } = compassResults;

  // Map compass dimensions to quiz question responses
  // Voice captures: vision, experimentation, decision_velocity, ai_fluency, governance, alignment
  // Quiz has similar dimensions but more granular questions
  
  const responses: Record<string, number> = {
    // Industry impact (vision-related)
    q1_industry_impact: scores.vision || 3,
    
    // Personal workflows (experimentation + ai_fluency)
    q2_personal_workflows: Math.round((scores.experimentation + scores.ai_fluency) / 2) || 3,
    
    // Team coaching (alignment + ai_fluency)
    q3_team_coaching: Math.round((scores.alignment + scores.ai_fluency) / 2) || 3,
    
    // Decision velocity
    q4_decision_velocity: scores.decision_velocity || 3,
    
    // Experimentation culture
    q5_experimentation: scores.experimentation || 3,
    
    // Risk governance (governance)
    q6_governance: scores.governance || 3,
    
    // Strategic alignment
    q7_alignment: scores.alignment || 3,
    
    // Business acceleration (derived from ROI if available)
    q8_business_acceleration: roiEstimate 
      ? Math.min(5, Math.ceil(roiEstimate.conservativeValue.monthly / 10000))
      : Math.round((scores.vision + scores.decision_velocity) / 2) || 3,
  };

  // Calculate average score from all responses
  const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0);
  const avgScore = Math.round((totalScore / Object.keys(responses).length) * 20); // Scale to 0-100

  return {
    responses,
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
