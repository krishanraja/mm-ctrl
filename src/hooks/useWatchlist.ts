import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Manage company watchlist (stored as user_memory facts with category 'objective')
 */
export function useWatchlist() {
  const [watchedCompanies, setWatchedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_memory')
        .select('fact_value')
        .eq('user_id', user.id)
        .eq('fact_key', 'watching_company')
        .eq('is_current', true);

      if (data) {
        setWatchedCompanies(data.map((d: { fact_value: string }) => d.fact_value.toLowerCase()));
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const watchCompany = useCallback(async (companyName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already watching
      const normalised = companyName.toLowerCase();
      if (watchedCompanies.includes(normalised)) return;

      const { error } = await supabase
        .from('user_memory')
        .insert({
          user_id: user.id,
          fact_key: 'watching_company',
          fact_label: `Watching ${companyName}`,
          fact_value: companyName,
          fact_category: 'objective',
          confidence_score: 1.0,
          is_current: true,
          source_type: 'form',
          tags: ['watchlist', 'company'],
        });

      if (error) {
        console.error('Failed to watch company:', error);
        return;
      }

      setWatchedCompanies((prev) => [...prev, normalised]);
    } catch (err) {
      console.error('Watch company failed:', err);
    }
  }, [watchedCompanies]);

  const unwatchCompany = useCallback(async (companyName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_memory')
        .update({ is_current: false })
        .eq('user_id', user.id)
        .eq('fact_key', 'watching_company')
        .ilike('fact_value', companyName);

      setWatchedCompanies((prev) => prev.filter((c) => c !== companyName.toLowerCase()));
    } catch (err) {
      console.error('Unwatch company failed:', err);
    }
  }, []);

  return { watchedCompanies, watchCompany, unwatchCompany, loading, refetch: fetchWatchlist };
}
