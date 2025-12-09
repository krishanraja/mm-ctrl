/**
 * Pipeline Guards - Input Validation with Safe Defaults
 * 
 * Purpose: Provides validation utilities for the assessment pipeline
 * to ensure data integrity and prevent null/undefined failures.
 * 
 * Dependencies: None (pure utility functions)
 * 
 * Usage:
 *   import { validateContactData, validateAssessmentData, safeAccess } from './pipelineGuards';
 */

// ============= Type Definitions =============

export interface SafeContactData {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
}

export interface SafeAssessmentData {
  [key: string]: number | string | boolean | null;
}

export interface ValidationResult<T> {
  success: boolean;
  data: T;
  errors: string[];
  fallbacksUsed: string[];
}

// ============= Default Values =============

const DEFAULT_CONTACT: SafeContactData = {
  fullName: 'Anonymous User',
  email: 'unknown@example.com',
  companyName: 'Unknown Company',
  role: 'Leader'
};

const REQUIRED_SCORE_KEYS = [
  'awarenessScore',
  'applicationScore',
  'governanceScore',
  'trustScore'
];

// ============= Validation Functions =============

/**
 * Validates and normalizes contact data with safe defaults
 */
export function validateContactData(input: any): ValidationResult<SafeContactData> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];

  const data: SafeContactData = {
    fullName: '',
    email: '',
    companyName: '',
    role: ''
  };

  // Validate fullName
  if (typeof input?.fullName === 'string' && input.fullName.trim().length > 0) {
    data.fullName = input.fullName.trim();
  } else {
    data.fullName = DEFAULT_CONTACT.fullName;
    fallbacksUsed.push('fullName');
    if (!input?.fullName) errors.push('fullName is missing');
  }

  // Validate email
  if (typeof input?.email === 'string' && isValidEmail(input.email)) {
    data.email = input.email.trim().toLowerCase();
  } else {
    data.email = DEFAULT_CONTACT.email;
    fallbacksUsed.push('email');
    if (!input?.email) errors.push('email is missing');
    else errors.push('email is invalid');
  }

  // Validate companyName
  if (typeof input?.companyName === 'string' && input.companyName.trim().length > 0) {
    data.companyName = input.companyName.trim();
  } else {
    data.companyName = DEFAULT_CONTACT.companyName;
    fallbacksUsed.push('companyName');
  }

  // Validate role
  if (typeof input?.role === 'string' && input.role.trim().length > 0) {
    data.role = input.role.trim();
  } else {
    data.role = DEFAULT_CONTACT.role;
    fallbacksUsed.push('role');
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    fallbacksUsed
  };
}

/**
 * Validates assessment scores with safe defaults
 */
export function validateAssessmentData(input: any): ValidationResult<SafeAssessmentData> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  const data: SafeAssessmentData = {};

  if (!input || typeof input !== 'object') {
    errors.push('Assessment data is missing or invalid');
    // Return with default scores
    REQUIRED_SCORE_KEYS.forEach(key => {
      data[key] = 50; // Neutral default
      fallbacksUsed.push(key);
    });
    return { success: false, data, errors, fallbacksUsed };
  }

  // Validate each score key
  REQUIRED_SCORE_KEYS.forEach(key => {
    const value = input[key];
    if (typeof value === 'number' && value >= 0 && value <= 100) {
      data[key] = value;
    } else {
      data[key] = 50; // Neutral default
      fallbacksUsed.push(key);
      if (value === undefined) {
        errors.push(`${key} is missing`);
      } else {
        errors.push(`${key} is invalid (got ${typeof value}: ${value})`);
      }
    }
  });

  // Copy any additional fields
  Object.keys(input).forEach(key => {
    if (!REQUIRED_SCORE_KEYS.includes(key)) {
      data[key] = input[key];
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    fallbacksUsed
  };
}

/**
 * Validates AI-generated content structure
 */
export function validateAIContent(input: any): ValidationResult<any> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];

  const data = {
    yourEdge: input?.yourEdge || 'Your systematic approach positions you for sustainable growth',
    yourRisk: input?.yourRisk || 'Without action, competitive advantage may erode',
    yourNextMove: input?.yourNextMove || 'Schedule a strategy session with your team this week',
    dimensionScores: ensureArray(input?.dimensionScores, [
      { key: 'ai_readiness', score: 65, label: 'Establishing', summary: 'Strong foundation with opportunities' }
    ]),
    tensions: ensureArray(input?.tensions, [
      { key: 'speed_vs_quality', summary: 'Balancing rapid adoption with governance' }
    ]),
    risks: ensureArray(input?.risks, [
      { key: 'shadow_ai', level: 'medium', description: 'Uncoordinated AI adoption' }
    ]),
    scenarios: ensureArray(input?.scenarios, [
      { key: 'high_velocity_path', summary: 'Accelerate through focused pilots' }
    ]),
    prompts: ensureArray(input?.prompts, []),
    firstMoves: ensureArray(input?.firstMoves, [
      'Identify 2-3 high-impact AI use cases',
      'Schedule AI literacy session for team',
      'Create experimentation framework'
    ])
  };

  // Track fallbacks
  if (!input?.yourEdge) fallbacksUsed.push('yourEdge');
  if (!input?.yourRisk) fallbacksUsed.push('yourRisk');
  if (!input?.yourNextMove) fallbacksUsed.push('yourNextMove');
  if (!input?.dimensionScores?.length) fallbacksUsed.push('dimensionScores');
  if (!input?.tensions?.length) fallbacksUsed.push('tensions');
  if (!input?.risks?.length) fallbacksUsed.push('risks');
  if (!input?.scenarios?.length) fallbacksUsed.push('scenarios');
  if (!input?.firstMoves?.length) fallbacksUsed.push('firstMoves');

  return {
    success: fallbacksUsed.length === 0,
    data,
    errors,
    fallbacksUsed
  };
}

// ============= Utility Functions =============

/**
 * Safe property access with default value
 */
export function safeAccess<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : defaultValue;
}

/**
 * Ensures value is an array with fallback
 */
export function ensureArray<T>(value: any, fallback: T[]): T[] {
  if (Array.isArray(value) && value.length > 0) {
    return value;
  }
  return fallback;
}

/**
 * Ensures value is a non-empty string with fallback
 */
export function ensureString(value: any, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

/**
 * Ensures value is a number within range with fallback
 */
export function ensureNumber(value: any, fallback: number, min = 0, max = 100): number {
  if (typeof value === 'number' && !isNaN(value) && value >= min && value <= max) {
    return value;
  }
  return fallback;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes enum value to allowed options
 */
export function sanitizeEnum<T extends string>(value: any, allowed: T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

// ============= Enum Constants =============

export const VALID_RISK_KEYS = ['shadow_ai', 'skills_gap', 'roi_leakage', 'decision_friction'] as const;
export const VALID_RISK_LEVELS = ['low', 'medium', 'high'] as const;
export const VALID_SCENARIO_KEYS = ['stagnation_loop', 'shadow_ai_instability', 'high_velocity_path', 'culture_capability_mismatch'] as const;
export const VALID_PROMPT_CATEGORIES = ['strategic_planning', 'daily_efficiency', 'team_enablement', 'stakeholder_management'] as const;

export type RiskKey = typeof VALID_RISK_KEYS[number];
export type RiskLevel = typeof VALID_RISK_LEVELS[number];
export type ScenarioKey = typeof VALID_SCENARIO_KEYS[number];
export type PromptCategory = typeof VALID_PROMPT_CATEGORIES[number];
