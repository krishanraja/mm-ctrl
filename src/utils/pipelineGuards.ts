/**
 * Pipeline Guards - Complete Anti-Fragile Design
 * 
 * Purpose: Provides comprehensive validation utilities for the assessment pipeline
 * to ensure data integrity and prevent null/undefined/empty-array failures.
 * 
 * FAILURE POINT ENUMERATION:
 * 
 * 1. CREATE-LEADER-ASSESSMENT FUNCTION:
 *    - contactData.email could be null/undefined → Uses validateContactData()
 *    - leader lookup could fail (RLS/network) → Fallback to create new
 *    - assessment insert could fail (schema mismatch) → Explicit column mapping
 * 
 * 2. AI-GENERATE FUNCTION:
 *    - Vertex AI could timeout/fail → OpenAI fallback
 *    - OpenAI could timeout/fail → Static fallback content
 *    - JSON parse could fail → Regex extraction + parse retry
 *    - Enum values could be invalid → sanitizeEnums() normalization
 *    - Response validation could fail → validateResponse() checks
 * 
 * 3. RUN-ASSESSMENT ORCHESTRATOR:
 *    - assessmentId could be null after create → Throw with clear message
 *    - aiContent arrays could be empty → safeInsert handles gracefully
 *    - DB insert could fail (FK constraint) → Logged + continues
 *    - generation_status update could fail → Caught + logged
 * 
 * 4. AGGREGATE-LEADER-RESULTS:
 *    - assessmentId fetch could fail (RLS) → Compute from dimension scores
 *    - dimension_scores could be empty → Safe defaults array
 *    - Type casting could fail → Explicit type guards
 *    - leadershipComparison generation could fail → Returns null safely
 * 
 * 5. UI AGGREGATION:
 *    - data could be null → safeDefaults object
 *    - arrays could be null/undefined → ensureArray()
 *    - nested properties could be missing → safeAccess()
 *    - component could receive wrong shape → Type validation
 * 
 * Dependencies: None (pure utility functions)
 */

// ============= Type Definitions =============

export interface SafeContactData {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  department?: string;
  primaryFocus?: string;
  roleTitle?: string;
  companySize?: string;
  industry?: string;
}

export interface SafeAssessmentData {
  [key: string]: number | string | boolean | null;
}

export interface SafeDimensionScore {
  dimension_key: string;
  score_numeric: number;
  dimension_tier: string;
  explanation: string;
}

export interface SafeTension {
  dimension_key: string;
  summary_line: string;
  priority_rank: number;
}

export interface SafeRiskSignal {
  risk_key: RiskKey;
  level: RiskLevel;
  description: string;
  priority_rank: number;
}

export interface SafeScenario {
  scenario_key: ScenarioKey;
  summary: string;
  priority_rank: number;
}

export interface SafePromptSet {
  category_key: PromptCategory;
  title: string;
  description: string;
  what_its_for: string;
  when_to_use: string;
  how_to_use: string;
  prompts_json: string[];
  priority_rank: number;
}

export interface SafeFirstMove {
  move_number: number;
  content: string;
}

export interface SafeAggregatedResults {
  assessmentId: string;
  benchmarkScore: number;
  benchmarkTier: string;
  hasFullDiagnostic: boolean;
  dimensionScores: SafeDimensionScore[];
  tensions: SafeTension[];
  riskSignals: SafeRiskSignal[];
  orgScenarios: SafeScenario[];
  firstMoves: SafeFirstMove[];
  promptSets: SafePromptSet[];
}

export interface ValidationResult<T> {
  success: boolean;
  data: T;
  errors: string[];
  fallbacksUsed: string[];
}

// ============= Enum Constants (Schema-Compliant) =============

export const VALID_DIMENSION_KEYS = [
  'ai_fluency', 
  'decision_velocity', 
  'experimentation_cadence', 
  'delegation_augmentation', 
  'alignment_communication', 
  'risk_governance'
] as const;

export const VALID_TIERS = [
  'AI-Emerging', 
  'AI-Aware', 
  'AI-Confident', 
  'AI-Orchestrator'
] as const;

export const VALID_RISK_KEYS = [
  'shadow_ai', 
  'skills_gap', 
  'roi_leakage', 
  'decision_friction'
] as const;

export const VALID_RISK_LEVELS = ['low', 'medium', 'high'] as const;

export const VALID_SCENARIO_KEYS = [
  'stagnation_loop', 
  'shadow_ai_instability', 
  'high_velocity_path', 
  'culture_capability_mismatch'
] as const;

export const VALID_PROMPT_CATEGORIES = [
  'strategic_planning', 
  'daily_efficiency', 
  'team_enablement', 
  'stakeholder_management'
] as const;

export const VALID_EVENT_TYPES = [
  'question_answered',
  'assessment_started',
  'assessment_completed',
  'voice_captured',
  'consent_given'
] as const;

export const VALID_TOOL_NAMES = [
  'quiz',
  'voice',
  'deep_profile',
  'bootcamp',
  'sprint'
] as const;

export type DimensionKey = typeof VALID_DIMENSION_KEYS[number];
export type TierLabel = typeof VALID_TIERS[number];
export type RiskKey = typeof VALID_RISK_KEYS[number];
export type RiskLevel = typeof VALID_RISK_LEVELS[number];
export type ScenarioKey = typeof VALID_SCENARIO_KEYS[number];
export type PromptCategory = typeof VALID_PROMPT_CATEGORIES[number];
export type EventType = typeof VALID_EVENT_TYPES[number];
export type ToolName = typeof VALID_TOOL_NAMES[number];

// ============= Mapping Tables for AI Output Normalization =============

const DIMENSION_KEY_MAP: Record<string, DimensionKey> = {
  // AI variations → valid schema keys
  'ai_readiness': 'ai_fluency',
  'ai_literacy': 'ai_fluency',
  'ai_awareness': 'ai_fluency',
  'decision_making': 'decision_velocity',
  'decisions': 'decision_velocity',
  'experimentation': 'experimentation_cadence',
  'innovation': 'experimentation_cadence',
  'team_capability': 'delegation_augmentation',
  'delegation': 'delegation_augmentation',
  'team_empowerment': 'delegation_augmentation',
  'value_clarity': 'alignment_communication',
  'alignment': 'alignment_communication',
  'communication': 'alignment_communication',
  'governance_maturity': 'risk_governance',
  'risk_management': 'risk_governance',
  'governance': 'risk_governance',
  // Direct matches
  'ai_fluency': 'ai_fluency',
  'decision_velocity': 'decision_velocity',
  'experimentation_cadence': 'experimentation_cadence',
  'delegation_augmentation': 'delegation_augmentation',
  'alignment_communication': 'alignment_communication',
  'risk_governance': 'risk_governance',
};

const TIER_MAP: Record<string, TierLabel> = {
  'emerging': 'AI-Emerging',
  'ai-emerging': 'AI-Emerging',
  'aware': 'AI-Aware',
  'ai-aware': 'AI-Aware',
  'confident': 'AI-Confident',
  'ai-confident': 'AI-Confident',
  'orchestrator': 'AI-Orchestrator',
  'ai-orchestrator': 'AI-Orchestrator',
  'leading': 'AI-Orchestrator',
  'advancing': 'AI-Confident',
  'establishing': 'AI-Aware',
  'beginner': 'AI-Emerging',
  'intermediate': 'AI-Aware',
  'advanced': 'AI-Confident',
  'expert': 'AI-Orchestrator',
};

// ============= Default Values =============

const DEFAULT_CONTACT: SafeContactData = {
  fullName: 'Anonymous User',
  email: 'unknown@example.com',
  companyName: 'Unknown Company',
  role: 'Leader',
  department: 'Unknown',
  primaryFocus: 'Unknown',
};

const DEFAULT_DIMENSION_SCORES: SafeDimensionScore[] = [
  { dimension_key: 'ai_fluency', score_numeric: 50, dimension_tier: 'AI-Aware', explanation: 'Foundation established with room for growth' },
  { dimension_key: 'decision_velocity', score_numeric: 50, dimension_tier: 'AI-Aware', explanation: 'Balanced decision-making approach' },
  { dimension_key: 'experimentation_cadence', score_numeric: 50, dimension_tier: 'AI-Aware', explanation: 'Moderate experimentation capacity' },
  { dimension_key: 'delegation_augmentation', score_numeric: 50, dimension_tier: 'AI-Aware', explanation: 'Team enablement in progress' },
  { dimension_key: 'alignment_communication', score_numeric: 50, dimension_tier: 'AI-Aware', explanation: 'Clear communication baseline' },
  { dimension_key: 'risk_governance', score_numeric: 50, dimension_tier: 'AI-Aware', explanation: 'Standard governance practices' },
];

const DEFAULT_TENSIONS: SafeTension[] = [
  { dimension_key: 'speed_vs_quality', summary_line: 'Balancing rapid AI adoption with governance requirements', priority_rank: 1 },
];

const DEFAULT_RISKS: SafeRiskSignal[] = [
  { risk_key: 'shadow_ai', level: 'medium', description: 'Uncoordinated AI adoption creating governance gaps', priority_rank: 1 },
];

const DEFAULT_SCENARIOS: SafeScenario[] = [
  { scenario_key: 'high_velocity_path', summary: 'Accelerate through focused pilot programs', priority_rank: 1 },
];

const DEFAULT_FIRST_MOVES: SafeFirstMove[] = [
  { move_number: 1, content: 'Identify 2-3 high-impact AI use cases this week' },
  { move_number: 2, content: 'Schedule AI literacy session for team' },
  { move_number: 3, content: 'Create experimentation framework with clear metrics' },
];

const DEFAULT_PROMPT_SETS: SafePromptSet[] = [
  {
    category_key: 'strategic_planning',
    title: 'AI Strategy Prompts',
    description: 'Strategic planning and roadmap development',
    what_its_for: 'Building AI initiatives aligned with business goals',
    when_to_use: 'During quarterly planning or strategy sessions',
    how_to_use: 'Copy into ChatGPT and customize with your context',
    prompts_json: [
      'What are the top 3 business processes where AI could reduce cycle time by 50%?',
      'Generate a 90-day AI pilot roadmap for my department',
    ],
    priority_rank: 1,
  },
];

const REQUIRED_SCORE_KEYS = [
  'awarenessScore',
  'applicationScore',
  'governanceScore',
  'trustScore'
];

// ============= Core Validation Functions =============

/**
 * Validates and normalizes contact data with safe defaults
 */
export function validateContactData(input: unknown): ValidationResult<SafeContactData> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  const inputObj = input as Record<string, unknown> | null | undefined;

  const data: SafeContactData = {
    fullName: '',
    email: '',
    companyName: '',
    role: '',
  };

  // Validate fullName
  if (typeof inputObj?.fullName === 'string' && inputObj.fullName.trim().length > 0) {
    data.fullName = inputObj.fullName.trim();
  } else {
    data.fullName = DEFAULT_CONTACT.fullName;
    fallbacksUsed.push('fullName');
    if (!inputObj?.fullName) errors.push('fullName is missing');
  }

  // Validate email
  if (typeof inputObj?.email === 'string' && isValidEmail(inputObj.email)) {
    data.email = inputObj.email.trim().toLowerCase();
  } else {
    data.email = DEFAULT_CONTACT.email;
    fallbacksUsed.push('email');
    if (!inputObj?.email) errors.push('email is missing');
    else errors.push('email is invalid');
  }

  // Validate companyName
  if (typeof inputObj?.companyName === 'string' && inputObj.companyName.trim().length > 0) {
    data.companyName = inputObj.companyName.trim();
  } else {
    data.companyName = DEFAULT_CONTACT.companyName;
    fallbacksUsed.push('companyName');
  }

  // Validate role
  if (typeof inputObj?.role === 'string' && inputObj.role.trim().length > 0) {
    data.role = inputObj.role.trim();
  } else {
    data.role = DEFAULT_CONTACT.role;
    fallbacksUsed.push('role');
  }

  // Optional fields
  if (typeof inputObj?.department === 'string') data.department = inputObj.department.trim();
  if (typeof inputObj?.primaryFocus === 'string') data.primaryFocus = inputObj.primaryFocus.trim();
  if (typeof inputObj?.roleTitle === 'string') data.roleTitle = inputObj.roleTitle.trim();
  if (typeof inputObj?.companySize === 'string') data.companySize = inputObj.companySize.trim();
  if (typeof inputObj?.industry === 'string') data.industry = inputObj.industry.trim();

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
export function validateAssessmentData(input: unknown): ValidationResult<SafeAssessmentData> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  const data: SafeAssessmentData = {};
  const inputObj = input as Record<string, unknown> | null | undefined;

  if (!inputObj || typeof inputObj !== 'object') {
    errors.push('Assessment data is missing or invalid');
    REQUIRED_SCORE_KEYS.forEach(key => {
      data[key] = 50;
      fallbacksUsed.push(key);
    });
    return { success: false, data, errors, fallbacksUsed };
  }

  // Validate each score key
  REQUIRED_SCORE_KEYS.forEach(key => {
    const value = inputObj[key];
    if (typeof value === 'number' && value >= 0 && value <= 100) {
      data[key] = value;
    } else {
      data[key] = 50;
      fallbacksUsed.push(key);
      if (value === undefined) {
        errors.push(`${key} is missing`);
      } else {
        errors.push(`${key} is invalid (got ${typeof value}: ${value})`);
      }
    }
  });

  // Copy any additional fields
  Object.keys(inputObj).forEach(key => {
    if (!REQUIRED_SCORE_KEYS.includes(key)) {
      data[key] = inputObj[key] as SafeAssessmentData[string];
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
 * Validates AI-generated content structure with comprehensive fallbacks
 */
export function validateAIContent(input: unknown): ValidationResult<{
  yourEdge: string;
  yourRisk: string;
  yourNextMove: string;
  dimensionScores: SafeDimensionScore[];
  tensions: SafeTension[];
  risks: SafeRiskSignal[];
  scenarios: SafeScenario[];
  prompts: SafePromptSet[];
  firstMoves: SafeFirstMove[];
}> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  const inputObj = input as Record<string, unknown> | null | undefined;

  const data = {
    yourEdge: ensureString(inputObj?.yourEdge, 'Your systematic approach positions you for sustainable growth'),
    yourRisk: ensureString(inputObj?.yourRisk, 'Without action, competitive advantage may erode'),
    yourNextMove: ensureString(inputObj?.yourNextMove, 'Schedule a strategy session with your team this week'),
    dimensionScores: normalizeDimensionScores(inputObj?.dimensionScores, DEFAULT_DIMENSION_SCORES),
    tensions: normalizeTensions(inputObj?.tensions, DEFAULT_TENSIONS),
    risks: normalizeRisks(inputObj?.risks, DEFAULT_RISKS),
    scenarios: normalizeScenarios(inputObj?.scenarios, DEFAULT_SCENARIOS),
    prompts: normalizePrompts(inputObj?.prompts, DEFAULT_PROMPT_SETS),
    firstMoves: normalizeFirstMoves(inputObj?.firstMoves, DEFAULT_FIRST_MOVES),
  };

  // Track fallbacks
  if (!inputObj?.yourEdge) fallbacksUsed.push('yourEdge');
  if (!inputObj?.yourRisk) fallbacksUsed.push('yourRisk');
  if (!inputObj?.yourNextMove) fallbacksUsed.push('yourNextMove');
  if (!Array.isArray(inputObj?.dimensionScores) || (inputObj.dimensionScores as unknown[]).length === 0) fallbacksUsed.push('dimensionScores');
  if (!Array.isArray(inputObj?.tensions) || (inputObj.tensions as unknown[]).length === 0) fallbacksUsed.push('tensions');
  if (!Array.isArray(inputObj?.risks) || (inputObj.risks as unknown[]).length === 0) fallbacksUsed.push('risks');
  if (!Array.isArray(inputObj?.scenarios) || (inputObj.scenarios as unknown[]).length === 0) fallbacksUsed.push('scenarios');
  if (!Array.isArray(inputObj?.firstMoves) || (inputObj.firstMoves as unknown[]).length === 0) fallbacksUsed.push('firstMoves');

  return {
    success: fallbacksUsed.length === 0,
    data,
    errors,
    fallbacksUsed
  };
}

/**
 * Validates aggregated results for UI consumption
 */
export function validateAggregatedResults(input: unknown): ValidationResult<SafeAggregatedResults> {
  const errors: string[] = [];
  const fallbacksUsed: string[] = [];
  const inputObj = input as Record<string, unknown> | null | undefined;

  const data: SafeAggregatedResults = {
    assessmentId: ensureString(inputObj?.assessmentId, ''),
    benchmarkScore: ensureNumber(inputObj?.benchmarkScore, 50, 0, 100),
    benchmarkTier: sanitizeTier(inputObj?.benchmarkTier),
    hasFullDiagnostic: typeof inputObj?.hasFullDiagnostic === 'boolean' ? inputObj.hasFullDiagnostic : false,
    dimensionScores: normalizeDimensionScores(inputObj?.dimensionScores, DEFAULT_DIMENSION_SCORES),
    tensions: normalizeTensions(inputObj?.tensions, DEFAULT_TENSIONS),
    riskSignals: normalizeRisks(inputObj?.riskSignals, DEFAULT_RISKS),
    orgScenarios: normalizeScenarios(inputObj?.orgScenarios, DEFAULT_SCENARIOS),
    firstMoves: normalizeFirstMoves(inputObj?.firstMoves, DEFAULT_FIRST_MOVES),
    promptSets: normalizePrompts(inputObj?.promptSets, DEFAULT_PROMPT_SETS),
  };

  if (!inputObj?.assessmentId) {
    errors.push('assessmentId is missing');
    fallbacksUsed.push('assessmentId');
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    fallbacksUsed
  };
}

// ============= Normalization Functions =============

function normalizeDimensionScores(input: unknown, fallback: SafeDimensionScore[]): SafeDimensionScore[] {
  if (!Array.isArray(input) || input.length === 0) return fallback;
  
  return input.map((d, idx) => ({
    dimension_key: sanitizeDimensionKey(d?.key || d?.dimension_key, idx),
    score_numeric: ensureNumber(d?.score || d?.score_numeric, 50, 0, 100),
    dimension_tier: sanitizeTier(d?.label || d?.tier || d?.dimension_tier),
    explanation: ensureString(d?.summary || d?.insight_summary || d?.explanation, ''),
  }));
}

function normalizeTensions(input: unknown, fallback: SafeTension[]): SafeTension[] {
  if (!Array.isArray(input) || input.length === 0) return fallback;
  
  return input.map((t, idx) => ({
    dimension_key: ensureString(t?.key || t?.dimension_key, 'general'),
    summary_line: ensureString(t?.summary || t?.summary_line, ''),
    priority_rank: idx + 1,
  }));
}

function normalizeRisks(input: unknown, fallback: SafeRiskSignal[]): SafeRiskSignal[] {
  if (!Array.isArray(input) || input.length === 0) return fallback;
  
  return input.map((r, idx) => ({
    risk_key: sanitizeRiskKey(r?.key || r?.risk_key),
    level: sanitizeRiskLevel(r?.level || r?.risk_level),
    description: ensureString(r?.description, ''),
    priority_rank: idx + 1,
  }));
}

function normalizeScenarios(input: unknown, fallback: SafeScenario[]): SafeScenario[] {
  if (!Array.isArray(input) || input.length === 0) return fallback;
  
  return input.map((s, idx) => ({
    scenario_key: sanitizeScenarioKey(s?.key || s?.scenario_key),
    summary: ensureString(s?.summary, ''),
    priority_rank: idx + 1,
  }));
}

function normalizePrompts(input: unknown, fallback: SafePromptSet[]): SafePromptSet[] {
  if (!Array.isArray(input) || input.length === 0) return fallback;
  
  return input.map((p, idx) => ({
    category_key: sanitizePromptCategory(p?.category || p?.category_key),
    title: ensureString(p?.title, 'Untitled Prompt Set'),
    description: ensureString(p?.description, ''),
    what_its_for: ensureString(p?.whatItsFor || p?.what_its_for, ''),
    when_to_use: ensureString(p?.whenToUse || p?.when_to_use, ''),
    how_to_use: ensureString(p?.howToUse || p?.how_to_use, ''),
    prompts_json: ensureArray(p?.prompts || p?.prompts_json, []),
    priority_rank: idx + 1,
  }));
}

function normalizeFirstMoves(input: unknown, fallback: SafeFirstMove[]): SafeFirstMove[] {
  if (!Array.isArray(input) || input.length === 0) return fallback;
  
  return input.map((m, idx) => {
    const content = typeof m === 'string' ? m : ensureString(m?.content || m?.text, '');
    return {
      move_number: idx + 1,
      content,
    };
  });
}

// ============= Sanitization Functions =============

export function sanitizeDimensionKey(value: unknown, fallbackIndex: number = 0): DimensionKey {
  if (typeof value !== 'string') return VALID_DIMENSION_KEYS[fallbackIndex % VALID_DIMENSION_KEYS.length];
  const normalized = value.toLowerCase().replace(/[^a-z_]/g, '_');
  return DIMENSION_KEY_MAP[normalized] || VALID_DIMENSION_KEYS[fallbackIndex % VALID_DIMENSION_KEYS.length];
}

export function sanitizeTier(value: unknown): TierLabel {
  if (typeof value !== 'string') return 'AI-Emerging';
  const normalized = value.toLowerCase().replace(/[^a-z-]/g, '');
  return TIER_MAP[normalized] || 'AI-Emerging';
}

export function sanitizeRiskKey(value: unknown): RiskKey {
  if (typeof value === 'string' && VALID_RISK_KEYS.includes(value as RiskKey)) {
    return value as RiskKey;
  }
  return 'shadow_ai';
}

export function sanitizeRiskLevel(value: unknown): RiskLevel {
  if (typeof value === 'string' && VALID_RISK_LEVELS.includes(value as RiskLevel)) {
    return value as RiskLevel;
  }
  return 'medium';
}

export function sanitizeScenarioKey(value: unknown): ScenarioKey {
  if (typeof value === 'string' && VALID_SCENARIO_KEYS.includes(value as ScenarioKey)) {
    return value as ScenarioKey;
  }
  return 'high_velocity_path';
}

export function sanitizePromptCategory(value: unknown): PromptCategory {
  if (typeof value === 'string' && VALID_PROMPT_CATEGORIES.includes(value as PromptCategory)) {
    return value as PromptCategory;
  }
  return 'strategic_planning';
}

export function sanitizeEventType(value: unknown): EventType {
  if (typeof value === 'string' && VALID_EVENT_TYPES.includes(value as EventType)) {
    return value as EventType;
  }
  return 'question_answered';
}

export function sanitizeToolName(value: unknown): ToolName {
  if (typeof value === 'string' && VALID_TOOL_NAMES.includes(value as ToolName)) {
    return value as ToolName;
  }
  return 'quiz';
}

/**
 * Generic enum sanitizer
 */
export function sanitizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

// ============= Utility Functions =============

/**
 * Safe property access with default value
 */
export function safeAccess<T>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current !== undefined && current !== null ? current : defaultValue) as T;
}

/**
 * Ensures value is an array with fallback
 */
export function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value) && value.length > 0) {
    return value as T[];
  }
  return fallback;
}

/**
 * Ensures value is a non-empty string with fallback
 */
export function ensureString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

/**
 * Ensures value is a number within range with fallback
 */
export function ensureNumber(value: unknown, fallback: number, min = 0, max = 100): number {
  if (typeof value === 'number' && !isNaN(value) && value >= min && value <= max) {
    return value;
  }
  return fallback;
}

/**
 * Ensures value is a boolean with fallback
 */
export function ensureBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
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

// ============= Tier Calculation Helpers =============

/**
 * Calculate tier from score
 */
export function scoreToBenchmarkTier(score: number): TierLabel {
  if (score >= 80) return 'AI-Orchestrator';
  if (score >= 60) return 'AI-Confident';
  if (score >= 40) return 'AI-Aware';
  return 'AI-Emerging';
}

/**
 * Calculate score from dimension scores
 */
export function calculateBenchmarkScore(dimensionScores: SafeDimensionScore[]): number {
  if (!dimensionScores || dimensionScores.length === 0) return 50;
  const total = dimensionScores.reduce((sum, d) => sum + (d.score_numeric || 0), 0);
  return Math.round(total / dimensionScores.length);
}

// ============= DB Insert Helpers =============

/**
 * Prepares dimension scores for DB insert with schema compliance
 */
export function prepareDimensionScoresForInsert(
  assessmentId: string,
  scores: Array<{ key?: string; dimension_key?: string; score?: number; score_numeric?: number; label?: string; tier?: string; dimension_tier?: string; summary?: string; insight_summary?: string; explanation?: string }>
): Array<{ assessment_id: string; dimension_key: DimensionKey; score_numeric: number; dimension_tier: TierLabel; explanation: string }> {
  return scores.map((d, idx) => ({
    assessment_id: assessmentId,
    dimension_key: sanitizeDimensionKey(d.key || d.dimension_key, idx),
    score_numeric: ensureNumber(d.score || d.score_numeric, 50, 0, 100),
    dimension_tier: sanitizeTier(d.label || d.tier || d.dimension_tier),
    explanation: ensureString(d.summary || d.insight_summary || d.explanation, ''),
  }));
}

/**
 * Prepares risk signals for DB insert with schema compliance
 */
export function prepareRisksForInsert(
  assessmentId: string,
  risks: Array<{ key?: string; risk_key?: string; level?: string; risk_level?: string; description?: string }>
): Array<{ assessment_id: string; risk_key: RiskKey; level: RiskLevel; description: string; priority_rank: number }> {
  return risks.map((r, idx) => ({
    assessment_id: assessmentId,
    risk_key: sanitizeRiskKey(r.key || r.risk_key),
    level: sanitizeRiskLevel(r.level || r.risk_level),
    description: ensureString(r.description, ''),
    priority_rank: idx + 1,
  }));
}

/**
 * Prepares scenarios for DB insert with schema compliance
 */
export function prepareScenariosForInsert(
  assessmentId: string,
  scenarios: Array<{ key?: string; scenario_key?: string; summary?: string }>
): Array<{ assessment_id: string; scenario_key: ScenarioKey; summary: string; priority_rank: number }> {
  return scenarios.map((s, idx) => ({
    assessment_id: assessmentId,
    scenario_key: sanitizeScenarioKey(s.key || s.scenario_key),
    summary: ensureString(s.summary, ''),
    priority_rank: idx + 1,
  }));
}

/**
 * Prepares first moves for DB insert with schema compliance
 */
export function prepareFirstMovesForInsert(
  assessmentId: string,
  moves: Array<string | { content?: string; text?: string }>
): Array<{ assessment_id: string; move_number: number; content: string }> {
  return moves.map((m, idx) => ({
    assessment_id: assessmentId,
    move_number: idx + 1,
    content: typeof m === 'string' ? m : ensureString(m.content || m.text, ''),
  }));
}
