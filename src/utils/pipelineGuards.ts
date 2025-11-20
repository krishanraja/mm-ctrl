import { SafeProfileData, SafeAssessmentData, SafeContactData } from '@/types/pipeline';

/**
 * Pipeline Guards - Input Validation & Safe Defaults
 * Never trust input data. Always validate and provide safe defaults.
 */

export const DEFAULT_PROFILE: SafeProfileData = {
  workBreakdown: {
    strategic_work: 30,
    operational_work: 40,
    admin_waste: 20,
    ai_work: 10,
  },
  timeWaste: {
    percentage: 20,
    examples: [],
  },
  delegationTasks: [],
  biggestChallenge: 'Not specified',
  keyStakeholders: [],
  communicationStyle: 'balanced',
  informationNeeds: [],
  transformationGoal: 'Not specified',
  urgencyLevel: '6-12',
  bottlenecks: [],
  thinkingProcess: 'structured',
};

export function validateProfileData(profile: any): SafeProfileData {
  if (!profile || typeof profile !== 'object') {
    return DEFAULT_PROFILE;
  }

  return {
    workBreakdown: validateWorkBreakdown(profile.workBreakdown),
    timeWaste: validateTimeWaste(profile.timeWaste),
    delegationTasks: Array.isArray(profile.delegationTasks) ? profile.delegationTasks : [],
    biggestChallenge: typeof profile.biggestChallenge === 'string' ? profile.biggestChallenge : DEFAULT_PROFILE.biggestChallenge,
    keyStakeholders: Array.isArray(profile.keyStakeholders) ? profile.keyStakeholders : [],
    communicationStyle: typeof profile.communicationStyle === 'string' ? profile.communicationStyle : DEFAULT_PROFILE.communicationStyle,
    informationNeeds: Array.isArray(profile.informationNeeds) ? profile.informationNeeds : [],
    transformationGoal: typeof profile.transformationGoal === 'string' ? profile.transformationGoal : DEFAULT_PROFILE.transformationGoal,
    urgencyLevel: typeof profile.urgencyLevel === 'string' ? profile.urgencyLevel : DEFAULT_PROFILE.urgencyLevel,
    bottlenecks: Array.isArray(profile.bottlenecks) ? profile.bottlenecks : [],
    thinkingProcess: typeof profile.thinkingProcess === 'string' ? profile.thinkingProcess : DEFAULT_PROFILE.thinkingProcess,
  };
}

function validateWorkBreakdown(breakdown: any): SafeProfileData['workBreakdown'] {
  if (!breakdown || typeof breakdown !== 'object') {
    return DEFAULT_PROFILE.workBreakdown;
  }

  return {
    strategic_work: typeof breakdown.strategic_work === 'number' ? breakdown.strategic_work : DEFAULT_PROFILE.workBreakdown.strategic_work,
    operational_work: typeof breakdown.operational_work === 'number' ? breakdown.operational_work : DEFAULT_PROFILE.workBreakdown.operational_work,
    admin_waste: typeof breakdown.admin_waste === 'number' ? breakdown.admin_waste : DEFAULT_PROFILE.workBreakdown.admin_waste,
    ai_work: typeof breakdown.ai_work === 'number' ? breakdown.ai_work : DEFAULT_PROFILE.workBreakdown.ai_work,
  };
}

function validateTimeWaste(timeWaste: any): SafeProfileData['timeWaste'] {
  if (!timeWaste || typeof timeWaste !== 'object') {
    return DEFAULT_PROFILE.timeWaste;
  }

  return {
    percentage: typeof timeWaste.percentage === 'number' ? timeWaste.percentage : DEFAULT_PROFILE.timeWaste.percentage,
    examples: Array.isArray(timeWaste.examples) ? timeWaste.examples : DEFAULT_PROFILE.timeWaste.examples,
  };
}

export function validateAssessmentData(assessment: any): SafeAssessmentData {
  if (!assessment || typeof assessment !== 'object') {
    return {};
  }
  return assessment;
}

export function validateContactData(contact: any): SafeContactData | null {
  if (!contact || typeof contact !== 'object') {
    return null;
  }

  if (!contact.fullName || !contact.email) {
    return null;
  }

  return {
    fullName: String(contact.fullName),
    email: String(contact.email),
    companyName: contact.companyName ? String(contact.companyName) : '',
    role: contact.role ? String(contact.role) : '',
  };
}

/**
 * Check if array has valid content (not null, not empty, not all defaults)
 */
export function hasValidContent<T>(arr: T[] | null | undefined): boolean {
  if (!arr || !Array.isArray(arr)) return false;
  if (arr.length === 0) return false;
  return true;
}

/**
 * Safely get first N items from array with fallback
 */
export function safeSlice<T>(arr: T[] | null | undefined, count: number, fallback: T[] = []): T[] {
  if (!hasValidContent(arr)) return fallback;
  return arr!.slice(0, count);
}
