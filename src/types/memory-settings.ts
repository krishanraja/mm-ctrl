/**
 * Memory Settings Types
 * User privacy and retention preferences for memory system
 */

export interface MemorySettings {
  id: string;
  user_id: string;
  store_memory_enabled: boolean;
  store_voice_transcripts: boolean;
  auto_summarize_enabled: boolean;
  retention_days: number | null; // null = forever, 30, 90
  created_at: string;
  updated_at: string;
}

export interface MemorySettingsUpdate {
  store_memory_enabled?: boolean;
  store_voice_transcripts?: boolean;
  auto_summarize_enabled?: boolean;
  retention_days?: number | null;
}

export type RetentionOption = 'forever' | '90' | '30';

export const RETENTION_OPTIONS: { value: RetentionOption; label: string; days: number | null }[] = [
  { value: 'forever', label: 'Keep forever', days: null },
  { value: '90', label: '90 days', days: 90 },
  { value: '30', label: '30 days', days: 30 },
];

export function retentionDaysToOption(days: number | null): RetentionOption {
  if (days === null) return 'forever';
  if (days === 90) return '90';
  if (days === 30) return '30';
  return 'forever';
}

export function optionToRetentionDays(option: RetentionOption): number | null {
  if (option === 'forever') return null;
  return parseInt(option);
}
