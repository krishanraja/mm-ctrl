// Types for the Agent Skill Builder feature.
// Mirror the JSON shape returned by the generate-skill-export edge function.

export type SkillTriageResult = "skill" | "custom_instruction" | "memory_fact" | "saved_style";

export type SkillArchetype =
  | "decision-framework"
  | "voice-lock"
  | "reporting-engine"
  | "tool-integration"
  | "getting-started";

export interface SkillTriage {
  passed: boolean;
  result: SkillTriageResult;
  reasoning?: string;
}

export interface SkillReference {
  filename: string;
  content: string;
}

export interface SkillData {
  id?: string | null;
  name: string;
  description: string;
  body: string;
  references: SkillReference[];
  test_prompts: string[];
  gotchas: string[];
  archetype: SkillArchetype | string | null;
}

export interface SkillQualityCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface SkillQualityGate {
  checks: SkillQualityCheck[];
  summary: { passed: number; total: number };
}

export interface SkillExportSuccess {
  triage: SkillTriage;
  skill: SkillData;
  quality_gate: SkillQualityGate;
  zip_base64: string;
  zip_filename: string;
  zip_byte_length: number;
  created_at: string;
}

export interface SkillExportTriageRouted {
  triage: SkillTriage;
}

export type SkillExportResponse = SkillExportSuccess | SkillExportTriageRouted;

export function isSkillSuccess(r: SkillExportResponse): r is SkillExportSuccess {
  return r.triage.passed === true && "skill" in r;
}
