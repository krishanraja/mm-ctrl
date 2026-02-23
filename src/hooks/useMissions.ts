import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Mission, MissionStatus, MomentumLevel, MissionStats } from '@/types/missions';

function calculateMomentum(missions: Mission[]): MomentumLevel {
  const completed = missions.filter(m => m.status === 'completed');
  if (completed.length === 0) return 'new';
  if (completed.length < 2) return 'steady';

  // Check recent completion velocity
  const sorted = completed.sort((a, b) =>
    new Date(b.completed_at || b.created_at || '').getTime() -
    new Date(a.completed_at || a.created_at || '').getTime()
  );

  const recentGap = sorted.length >= 2
    ? (new Date(sorted[0].completed_at || '').getTime() - new Date(sorted[1].completed_at || '').getTime()) / (1000 * 60 * 60 * 24)
    : 30;

  if (recentGap < 14) return 'accelerating';
  if (recentGap < 28) return 'steady';
  return 'slowing';
}

export function useMissions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('leader_missions')
        .select('*')
        .eq('leader_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMissions((data as Mission[]) || []);
    } catch (err) {
      console.error('Error fetching missions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const activeMission = missions.find(m => m.status === 'active') || null;
  const completedCount = missions.filter(m => m.status === 'completed').length;
  const momentum = calculateMomentum(missions);

  const stats: MissionStats = {
    activeMission,
    completedCount,
    totalCount: missions.length,
    momentum,
  };

  return { missions, stats, loading, error, refetch: fetchMissions };
}

export function useCreateMission() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createMission = async (params: {
    missionText: string;
    checkInDate: string;
    assessmentId?: string;
    firstMoveId?: string;
  }) => {
    if (!user?.id) throw new Error('Not authenticated');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('leader_missions')
        .insert({
          leader_id: user.id,
          mission_text: params.missionText,
          check_in_date: params.checkInDate,
          assessment_id: params.assessmentId || null,
          first_move_id: params.firstMoveId || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Mission;
    } finally {
      setLoading(false);
    }
  };

  return { createMission, loading };
}

export function useCompleteMission() {
  const [loading, setLoading] = useState(false);

  const completeMission = async (missionId: string, notes?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leader_missions')
        .update({
          status: 'completed' as string,
          completion_notes: notes || null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', missionId);

      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return { completeMission, loading };
}

export function useExtendMission() {
  const [loading, setLoading] = useState(false);

  const extendMission = async (missionId: string, newDate: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leader_missions')
        .update({
          status: 'extended' as string,
          check_in_date: newDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', missionId);

      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return { extendMission, loading };
}
