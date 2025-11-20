/**
 * Central validation utility for deepProfileData
 * Ensures all orchestration functions receive guaranteed safe shapes
 */

export interface SafeProfileData {
  workBreakdown: {
    writing: number;
    presentations: number;
    planning: number;
    decisions: number;
    coaching: number;
  };
  timeWaste: number;
  timeWasteExamples: string;
  delegationTasks: string[];
  delegateTasks: string[];
  biggestChallenge: string;
  stakeholders: string[];
  communicationStyle: string[];
  informationNeeds: string[];
  transformationGoal: string;
  urgency: string;
  primaryBottleneck: string;
  thinkingProcess: string;
}

const DEFAULT_PROFILE: SafeProfileData = {
  workBreakdown: {
    writing: 20,
    presentations: 20,
    planning: 20,
    decisions: 20,
    coaching: 20
  },
  timeWaste: 30,
  timeWasteExamples: "status updates, meeting prep, email management",
  delegationTasks: ["routine reporting", "data gathering"],
  delegateTasks: ["routine reporting", "data gathering"],
  biggestChallenge: "scaling team capacity",
  stakeholders: ["executive team", "direct reports"],
  communicationStyle: ["Concise & data-driven"],
  informationNeeds: ["Performance metrics"],
  transformationGoal: "operational efficiency",
  urgency: "moderate",
  primaryBottleneck: "time constraints",
  thinkingProcess: "systematic and methodical"
};

/**
 * Validates and normalizes deepProfileData with safe defaults
 * Never crashes - always returns a valid SafeProfileData object
 */
export function validateProfileData(profile: any): SafeProfileData {
  if (!profile || typeof profile !== 'object') {
    console.warn('⚠️ Invalid profile data, using defaults:', profile);
    return DEFAULT_PROFILE;
  }

  // Validate workBreakdown with all required fields
  const safeWorkBreakdown = profile.workBreakdown && typeof profile.workBreakdown === 'object'
    ? {
        writing: typeof profile.workBreakdown.writing === 'number' ? profile.workBreakdown.writing : DEFAULT_PROFILE.workBreakdown.writing,
        presentations: typeof profile.workBreakdown.presentations === 'number' ? profile.workBreakdown.presentations : DEFAULT_PROFILE.workBreakdown.presentations,
        planning: typeof profile.workBreakdown.planning === 'number' ? profile.workBreakdown.planning : DEFAULT_PROFILE.workBreakdown.planning,
        decisions: typeof profile.workBreakdown.decisions === 'number' ? profile.workBreakdown.decisions : DEFAULT_PROFILE.workBreakdown.decisions,
        coaching: typeof profile.workBreakdown.coaching === 'number' ? profile.workBreakdown.coaching : DEFAULT_PROFILE.workBreakdown.coaching,
      }
    : DEFAULT_PROFILE.workBreakdown;

  return {
    workBreakdown: safeWorkBreakdown,
    timeWaste: typeof profile.timeWaste === 'number' ? profile.timeWaste : DEFAULT_PROFILE.timeWaste,
    timeWasteExamples: typeof profile.timeWasteExamples === 'string' ? profile.timeWasteExamples : DEFAULT_PROFILE.timeWasteExamples,
    delegationTasks: Array.isArray(profile.delegationTasks) ? profile.delegationTasks : DEFAULT_PROFILE.delegationTasks,
    delegateTasks: Array.isArray(profile.delegateTasks) ? profile.delegateTasks : DEFAULT_PROFILE.delegateTasks,
    biggestChallenge: typeof profile.biggestChallenge === 'string' ? profile.biggestChallenge : DEFAULT_PROFILE.biggestChallenge,
    stakeholders: Array.isArray(profile.stakeholders) ? profile.stakeholders : DEFAULT_PROFILE.stakeholders,
    communicationStyle: Array.isArray(profile.communicationStyle) ? profile.communicationStyle : DEFAULT_PROFILE.communicationStyle,
    informationNeeds: Array.isArray(profile.informationNeeds) ? profile.informationNeeds : DEFAULT_PROFILE.informationNeeds,
    transformationGoal: typeof profile.transformationGoal === 'string' ? profile.transformationGoal : DEFAULT_PROFILE.transformationGoal,
    urgency: typeof profile.urgency === 'string' ? profile.urgency : DEFAULT_PROFILE.urgency,
    primaryBottleneck: typeof profile.primaryBottleneck === 'string' ? profile.primaryBottleneck : DEFAULT_PROFILE.primaryBottleneck,
    thinkingProcess: typeof profile.thinkingProcess === 'string' ? profile.thinkingProcess : DEFAULT_PROFILE.thinkingProcess,
  };
}
