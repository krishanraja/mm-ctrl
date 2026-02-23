export type MissionStatus = 'active' | 'completed' | 'skipped' | 'extended';
export type MomentumLevel = 'accelerating' | 'steady' | 'slowing' | 'new';
export type SnapshotType = 'assessment' | 'check_in' | 'weekly';

export interface Mission {
  id: string;
  leader_id: string;
  assessment_id: string | null;
  first_move_id: string | null;
  mission_text: string;
  check_in_date: string;
  status: MissionStatus;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProgressSnapshot {
  id: string;
  leader_id: string;
  assessment_id: string | null;
  dimension_scores: Record<string, number>;
  comparison_to_baseline: Record<string, number>;
  benchmark_score: number | null;
  benchmark_tier: string | null;
  snapshot_type: SnapshotType;
  created_at: string | null;
}

export interface CheckIn {
  id: string;
  leader_id: string;
  mission_id: string | null;
  check_in_text: string;
  ai_reflection: string | null;
  ai_recommendation: string | null;
  ai_suggested_move: string | null;
  accepted_as_mission: boolean | null;
  voice_url: string | null;
  created_at: string | null;
}

export interface MissionStats {
  activeMission: Mission | null;
  completedCount: number;
  totalCount: number;
  momentum: MomentumLevel;
}
