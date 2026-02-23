import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type { CheckIn } from '@/types/missions';

export function useCheckIns() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCheckIns = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('leader_check_ins')
        .select('*')
        .eq('leader_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCheckIns((data as CheckIn[]) || []);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  return { checkIns, loading, error, refetch: fetchCheckIns };
}

export function useCreateCheckIn() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createCheckIn = async (params: {
    checkInText: string;
    missionId?: string;
    voiceUrl?: string;
  }) => {
    if (!user?.id) throw new Error('Not authenticated');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('leader_check_ins')
        .insert({
          leader_id: user.id,
          check_in_text: params.checkInText,
          mission_id: params.missionId || null,
          voice_url: params.voiceUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CheckIn;
    } finally {
      setLoading(false);
    }
  };

  return { createCheckIn, loading };
}
