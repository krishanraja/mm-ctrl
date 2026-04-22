import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SuggestedBriefingInterest, BriefingInterestKind } from '@/types/briefing';

interface State {
  suggestions: SuggestedBriefingInterest[];
  loading: boolean;
  error: string | null;
}

/**
 * Reads pending entries from `suggested_briefing_interests` (medium-confidence
 * inferences from `infer-briefing-interests`). User can accept (promote into
 * `briefing_interests`) or dismiss (mark dismissed_at). Both actions hide the
 * row from future fetches.
 */
export function useSuggestedInterests() {
  const [state, setState] = useState<State>({ suggestions: [], loading: true, error: null });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ suggestions: [], loading: false, error: null });
        return;
      }
      const { data, error } = await supabase
        .from('suggested_briefing_interests')
        .select('*')
        .eq('user_id', user.id)
        .is('accepted_at', null)
        .is('dismissed_at', null)
        .order('confidence', { ascending: false });
      if (error) throw error;
      setState({
        suggestions: (data ?? []) as SuggestedBriefingInterest[],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: (err as Error).message }));
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const accept = useCallback(
    async (suggestion: SuggestedBriefingInterest) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Promote into briefing_interests (idempotent against duplicate text).
        const { data: existing } = await supabase
          .from('briefing_interests')
          .select('id')
          .eq('user_id', user.id)
          .eq('kind', suggestion.kind)
          .ilike('text', suggestion.text)
          .maybeSingle();

        if (!existing) {
          const { error: insertError } = await supabase.from('briefing_interests').insert({
            user_id: user.id,
            kind: suggestion.kind,
            text: suggestion.text,
            weight: Math.max(1.0, suggestion.confidence),
            source: 'inferred_auto',
            is_active: true,
          });
          if (insertError) throw insertError;
        }

        const { error } = await supabase
          .from('suggested_briefing_interests')
          .update({ accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', suggestion.id);
        if (error) throw error;
        await refetch();
      } catch (err) {
        console.error('suggested_briefing_interests accept failed:', err);
        setState((s) => ({ ...s, error: (err as Error).message }));
      }
    },
    [refetch],
  );

  const dismiss = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('suggested_briefing_interests')
          .update({ dismissed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        await refetch();
      } catch (err) {
        console.error('suggested_briefing_interests dismiss failed:', err);
        setState((s) => ({ ...s, error: (err as Error).message }));
      }
    },
    [refetch],
  );

  const acceptAll = useCallback(async () => {
    for (const s of state.suggestions) {
      // eslint-disable-next-line no-await-in-loop
      await accept(s);
    }
  }, [state.suggestions, accept]);

  return { ...state, accept, dismiss, acceptAll, refetch };
}

export type { SuggestedBriefingInterest, BriefingInterestKind };
