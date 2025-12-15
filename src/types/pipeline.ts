/**
 * Pipeline Shape Contracts - Anti-Fragile Types
 * Every function that generates data MUST return these shapes
 */

export interface PipelineSafeResponse<T> {
  success: boolean;
  data: T;
  generationSource: 'vertex-ai' | 'openai' | 'fallback' | 'none';
  durationMs: number;
  error?: string;
}

export interface SafeProfileData {
  workBreakdown: {
    strategic_work: number;
    operational_work: number;
    admin_waste: number;
    ai_work: number;
  };
  timeWaste: {
    percentage: number;
    examples: string[];
  };
  delegationTasks: string[];
  biggestChallenge: string;
  keyStakeholders: string[];
  communicationStyle: string;
  informationNeeds: string[];
  transformationGoal: string;
  urgencyLevel: string;
  bottlenecks: string[];
  thinkingProcess: string;
}

export interface SafeAssessmentData {
  [key: string]: any;
}

export interface SafeContactData {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
}

export interface GeneratedInsights {
  yourEdge: string;
  yourRisk: string;
  yourNextMove: string;
  dimensionInsights: Record<string, string>;
}

export interface GeneratedPromptSet {
  category_key: string;
  title: string;
  description: string;
  what_its_for: string;
  when_to_use: string;
  how_to_use: string;
  prompts_json: string[];
  priority_rank: number;
}

export interface GeneratedTension {
  dimension_key: string;
  summary_line: string;
  priority_rank: number;
}

export interface GeneratedRiskSignal {
  risk_key: 'shadow_ai' | 'skills_gap' | 'roi_leakage' | 'decision_friction';
  level: 'low' | 'medium' | 'high';
  description: string;
  priority_rank: number;
}

export interface GeneratedScenario {
  scenario_key: 'stagnation_loop' | 'shadow_ai_instability' | 'high_velocity_path' | 'culture_capability_mismatch';
  summary: string;
  priority_rank: number;
}

// PHASE 5: Edge function response contracts
export interface EdgeFunctionResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  generationSource?: 'vertex-ai' | 'openai' | 'lovable' | 'fallback';
  durationMs?: number;
}

export interface OrchestrationResult {
  success: boolean;
  assessmentId: string | null;
  phases: {
    insights: EdgeFunctionResponse<any>;
    prompts: EdgeFunctionResponse<any>;
    risks: EdgeFunctionResponse<any>;
    tensions: EdgeFunctionResponse<any>;
    scenarios: EdgeFunctionResponse<any>;
  };
  errors: string[];
}
