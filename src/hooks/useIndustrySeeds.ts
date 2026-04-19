import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IndustrySeedItem {
  label: string;
}

export interface IndustrySeedsResponse {
  industry_key: string | null;
  industry_label: string | null;
  resolved_from: 'explicit' | 'user_memory' | 'fallback';
  raw_industry: string | null;
  beats: IndustrySeedItem[];
  entities: IndustrySeedItem[];
}

/**
 * Fetch industry-specific seed beats + entities via the get-industry-seeds
 * edge function. Pre-filters anything the user has already declared or
 * excluded, so the caller can render the result directly without extra
 * deduping work.
 */
export function useIndustrySeeds(enabled: boolean = true) {
  const [data, setData] = useState<IndustrySeedsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: resp, error: err } = await supabase.functions.invoke<IndustrySeedsResponse>(
        'get-industry-seeds',
      );
      if (err) throw err;
      setData(resp ?? null);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refetch();
  }, [enabled, refetch]);

  return { data, loading, error, refetch };
}
