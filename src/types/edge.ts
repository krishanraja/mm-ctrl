/**
 * The Edge: Leadership Amplifier Types
 * Strengths/weaknesses profile with AI capabilities
 */

// ===== Profile Types =====

export interface EdgeStrength {
  key: string;
  label: string;
  summary: string;
  confidence: number;
  evidence: string[];
  capabilities: SharpenCapability[];
}

export interface EdgeWeakness {
  key: string;
  label: string;
  summary: string;
  confidence: number;
  evidence: string[];
  capabilities: CoverCapability[];
}

export type GapCategory = 'fact_gap' | 'assessment_missing' | 'stale_data' | 'low_confidence' | 'external_context';
export type GapResolution = 'voice_capture' | 'diagnostic' | 'md_upload' | 'quick_confirm';

export interface IntelligenceGap {
  key: string;
  category: GapCategory;
  prompt: string;
  impact: string;
  priority: number;
  resolution: GapResolution;
}

export interface EdgeProfile {
  id: string;
  user_id: string;
  strengths: EdgeStrength[];
  weaknesses: EdgeWeakness[];
  intelligence_gaps: IntelligenceGap[];
  profile_version: number;
  last_synthesized_at: string;
  synthesis_inputs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ===== Capability Types =====

export type SharpenCapability = 'systemize' | 'teach' | 'lean_into';
export type CoverCapability = 'board_memo' | 'strategy_doc' | 'email' | 'meeting_agenda' | 'template';
export type EdgeCapability = SharpenCapability | CoverCapability | 'framework' | 'teaching_doc';

export type ActionType = 'sharpen' | 'cover';

export interface EdgeAction {
  id: string;
  user_id: string;
  action_type: ActionType;
  capability_key: string;
  target_key: string;
  title: string;
  input_context: Record<string, unknown>;
  output_content: string | null;
  output_format: string;
  delivered_via: 'app' | 'email' | 'both' | null;
  delivered_to_email: string | null;
  user_rating: number | null;
  was_used: boolean;
  created_at: string;
}

// ===== Feedback Types =====

export type FeedbackType = 'strength_confirm' | 'strength_reject' | 'weakness_confirm' | 'weakness_reject';

export interface EdgeFeedback {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  target_key: string;
  created_at: string;
}

// ===== Subscription Types =====

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'inactive';

export interface EdgeSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// ===== UI Types =====

export type EdgeView = 'memory' | 'edge';

export interface CapabilityCardDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  actionType: ActionType;
  capability: EdgeCapability;
  targetKey: string;
  isPaid: boolean;
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  actionType: ActionType;
  capability: EdgeCapability;
  targetKey: string;
  timeContext?: string;
}

// ===== Edge Generation Request/Response =====

export interface EdgeGenerateRequest {
  capability: EdgeCapability;
  targetKey: string;
  voiceInput?: string;
  additionalContext?: string;
  deliverToEmail?: string;
}

export interface EdgeGenerateResponse {
  actionId: string;
  content: string;
  title: string;
  format: string;
}

export interface EdgeSynthesisResponse {
  profile: EdgeProfile;
  isNew: boolean;
}

// ===== Capability metadata for UI =====

export const COVER_CAPABILITY_META: Record<CoverCapability, { label: string; description: string; icon: string }> = {
  board_memo: {
    label: 'Board Memo',
    description: 'Draft a polished board memo from your key points',
    icon: 'FileText',
  },
  strategy_doc: {
    label: 'Strategy Doc',
    description: 'Build a strategy document with your context baked in',
    icon: 'Target',
  },
  email: {
    label: 'Email',
    description: 'Draft an email in your communication style',
    icon: 'Mail',
  },
  meeting_agenda: {
    label: 'Meeting Agenda',
    description: 'Prepare a meeting agenda with relevant context',
    icon: 'Calendar',
  },
  template: {
    label: 'Template',
    description: 'Pre-filled template with your actual facts',
    icon: 'Layout',
  },
};

export const SHARPEN_CAPABILITY_META: Record<SharpenCapability, { label: string; description: string; icon: string }> = {
  systemize: {
    label: 'Systemize It',
    description: 'Turn your instinct into a repeatable framework',
    icon: 'Layers',
  },
  teach: {
    label: 'Teach It',
    description: 'Create a doc to share how you think about this',
    icon: 'BookOpen',
  },
  lean_into: {
    label: 'Lean Into It',
    description: 'Find missions that leverage this strength',
    icon: 'TrendingUp',
  },
};
