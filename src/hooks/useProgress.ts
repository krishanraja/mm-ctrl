import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type { ProgressSnapshot } from '@/types/missions';

export function useProgressSnapshots() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSnapshots = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('leader_progress_snapshots')
        .select('*')
        .eq('leader_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setSnapshots((data as ProgressSnapshot[]) || []);
    } catch (err) {
      console.error('Error fetching progress snapshots:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Calculate biggest improvement across dimensions
  const biggestImprovement = (() => {
    if (snapshots.length < 2) return null;
    const first = snapshots[0]?.dimension_scores || {};
    const last = snapshots[snapshots.length - 1]?.dimension_scores || {};

    let bestDim = '';
    let bestDelta = 0;

    for (const key of Object.keys(last)) {
      const delta = (last[key] || 0) - (first[key] || 0);
      if (delta > bestDelta) {
        bestDelta = delta;
        bestDim = key;
      }
    }

    return bestDim && bestDelta > 0 ? { dimension: bestDim, delta: bestDelta } : null;
  })();

  return { snapshots, biggestImprovement, loading, error, refetch: fetchSnapshots };
}
