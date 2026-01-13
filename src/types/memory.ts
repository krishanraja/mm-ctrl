/**
 * User Memory System Types
 * Voice-first context extraction and verification
 */

export type FactCategory = 'identity' | 'business' | 'objective' | 'blocker' | 'preference';

export type VerificationStatus = 'inferred' | 'verified' | 'corrected' | 'rejected';

export type MemorySourceType = 'voice' | 'form' | 'linkedin' | 'calendar' | 'enrichment';

export interface UserMemoryFact {
  id: string;
  user_id: string;
  fact_key: string;
  fact_category: FactCategory;
  fact_label: string;
  fact_value: string;
  fact_context?: string;
  confidence_score: number;
  is_high_stakes: boolean;
  verification_status: VerificationStatus;
  verified_at?: string;
  source_type: MemorySourceType;
  source_session_id?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingVerification {
  id: string;
  fact_key: string;
  fact_category: FactCategory;
  fact_label: string;
  fact_value: string;
  fact_context?: string;
  confidence_score: number;
}

export interface ExtractedFact {
  fact_key: string;
  fact_category: FactCategory;
  fact_label: string;
  fact_value: string;
  fact_context: string;
  confidence_score: number;
  is_high_stakes: boolean;
}

export interface ExtractionResult {
  success: boolean;
  facts_extracted?: number;
  facts_stored?: number;
  facts?: ExtractedFact[];
  pending_verifications: PendingVerification[];
  error?: string;
}

export interface MemoryContext {
  verified: UserMemoryFact[];
  inferred: UserMemoryFact[];
  formatted: string;
}

// Category metadata for UI
export const FACT_CATEGORY_META: Record<FactCategory, { icon: string; label: string; color: string }> = {
  identity: { icon: 'User', label: 'About You', color: 'blue' },
  business: { icon: 'Building', label: 'Your Business', color: 'purple' },
  objective: { icon: 'Target', label: 'Your Goals', color: 'green' },
  blocker: { icon: 'AlertTriangle', label: 'Challenges', color: 'orange' },
  preference: { icon: 'Settings', label: 'Preferences', color: 'gray' },
};

// Common fact keys and their labels
export const FACT_KEY_LABELS: Record<string, string> = {
  role: 'Your Role',
  title: 'Job Title',
  department: 'Department',
  team_size: 'Team Size',
  reports_to: 'Reports To',
  seniority: 'Seniority Level',
  company_name: 'Company',
  company: 'Company',
  industry: 'Industry',
  vertical: 'Business Vertical',
  company_size: 'Company Size',
  growth_stage: 'Growth Stage',
  main_goal: 'Main Goal',
  main_objective: 'Main Objective',
  quarterly_priority: 'Quarterly Priority',
  success_metric: 'Success Metric',
  main_blocker: 'Main Challenge',
  personal_blocker: 'Personal Challenge',
  team_blocker: 'Team Challenge',
  org_blocker: 'Organizational Challenge',
  time_constraint: 'Time Constraint',
  communication_style: 'Communication Style',
  decision_style: 'Decision Making Style',
  delegation_comfort: 'Delegation Comfort',
};
