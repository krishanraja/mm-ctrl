/**
 * CTRL Briefing Types
 * Personalised AI news briefing for leaders
 */

export type FrameworkTag = 'signal' | 'noise' | 'decision_trigger' | 'krishs_take';

export type BriefingType =
  | 'default'
  | 'macro_trends'
  | 'vendor_landscape'
  | 'competitive_intel'
  | 'boardroom_prep'
  | 'team_update'
  | 'ai_landscape'
  | 'custom_voice';

export interface BriefingTypeConfig {
  type: BriefingType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  isProOnly: boolean;
}

export const BRIEFING_TYPES: BriefingTypeConfig[] = [
  {
    type: 'default',
    label: "Daily Brief",
    description: 'The most important AI and business news for your world',
    icon: 'Radio',
    isProOnly: false,
  },
  {
    type: 'macro_trends',
    label: 'Macro Trends',
    description: 'Big-picture shifts in AI, markets, and regulation',
    icon: 'TrendingUp',
    isProOnly: false,
  },
  {
    type: 'vendor_landscape',
    label: 'Vendor Landscape',
    description: 'Product launches, pricing changes, and vendor moves',
    icon: 'Layers',
    isProOnly: true,
  },
  {
    type: 'competitive_intel',
    label: 'Competitive Intel',
    description: 'What your watchlist companies are doing right now',
    icon: 'Target',
    isProOnly: true,
  },
  {
    type: 'boardroom_prep',
    label: 'Boardroom Prep',
    description: 'Trends and data points for executive presentations',
    icon: 'Briefcase',
    isProOnly: true,
  },
  {
    type: 'ai_landscape',
    label: 'AI Model Landscape',
    description: 'Live benchmark data on the AI models that matter for your work',
    icon: 'BarChart3',
    isProOnly: true,
  },
  {
    type: 'custom_voice',
    label: 'Custom',
    description: 'Describe what you need and we will build it',
    icon: 'Mic',
    isProOnly: true,
  },
];

export interface BriefingSegment {
  headline: string;
  analysis: string;
  framework_tag: FrameworkTag;
  source: string;
  relevance_reason: string;
}

export interface Briefing {
  id: string;
  user_id: string;
  briefing_date: string;
  briefing_type: BriefingType;
  script_text: string | null;
  segments: BriefingSegment[];
  audio_url: string | null;
  audio_duration_seconds: number | null;
  context_snapshot: Record<string, unknown> | null;
  news_sources: Record<string, unknown> | null;
  generation_model: string;
  custom_context: string | null;
  voice_note_url: string | null;
  is_pro_only: boolean;
  created_at: string;
}

export interface BriefingFeedback {
  id: string;
  briefing_id: string;
  segment_index: number;
  reaction: 'useful' | 'not_useful' | 'save';
  created_at: string;
}

export type PlaybackSpeed = 1 | 1.25 | 1.5 | 2;

export interface BriefingPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;
  currentSegmentIndex: number;
  hasListened: boolean;
}

export const FRAMEWORK_TAG_CONFIG: Record<FrameworkTag, {
  label: string;
  className: string;
}> = {
  signal: {
    label: 'SIGNAL',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  },
  noise: {
    label: 'NOISE',
    className: 'bg-muted text-muted-foreground border-border',
  },
  decision_trigger: {
    label: 'DECISION TRIGGER',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  krishs_take: {
    label: "KRISH'S TAKE",
    className: 'bg-accent/10 text-accent border-accent/30',
  },
};
