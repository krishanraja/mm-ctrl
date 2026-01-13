/**
 * Core TypeScript Types
 * 
 * Shared types used across the application.
 */

import type { User } from '@supabase/supabase-js';

/**
 * Device Type
 */
export type DeviceType = 'mobile' | 'desktop';

/**
 * Leader State
 */
export interface LeaderState {
  user: User | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  hasBaseline: boolean;
  assessmentId: string | null;
  isLoading: boolean;
}

/**
 * Weekly Action
 */
export interface WeeklyAction {
  action_text: string;
  why_text: string | null;
  iso_week: string;
  created_at: string;
}

/**
 * Daily Provocation
 */
export interface DailyProvocation {
  id: string;
  question: string;
  category: string;
  created_at?: string;
}

/**
 * Baseline Data
 */
export interface BaselineData {
  benchmarkTier: string;
  benchmarkScore: number;
  percentile: number;
  tensions: Array<{
    summary_line: string;
    description: string;
  }>;
  riskSignals: Array<{
    level: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

/**
 * Voice Recording State
 */
export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  audioBlob: Blob | null;
  error: string | null;
}

/**
 * Navigation Item
 */
export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}
