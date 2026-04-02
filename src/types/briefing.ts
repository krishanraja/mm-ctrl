/**
 * CTRL Briefing Types
 * Personalised AI news briefing for leaders
 */

export type FrameworkTag = 'signal' | 'noise' | 'decision_trigger' | 'krishs_take';

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
  script_text: string;
  segments: BriefingSegment[];
  audio_url: string | null;
  audio_duration_seconds: number | null;
  context_snapshot: Record<string, unknown> | null;
  news_sources: Record<string, unknown> | null;
  generation_model: string;
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
