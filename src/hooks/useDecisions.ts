import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type { UserDecision, DecisionSource } from '@/types/memory';

export function useDecisions() {
  const [decisions, setDecisions] = useState<UserDecision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchDecisions = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('user_decisions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setDecisions((data || []) as unknown as UserDecision[]);
    setIsLoading(false);
  }, [user?.id]);

  const addDecision = useCallback(
    async (decisionText: string, rationale: string | null, source: DecisionSource = 'manual') => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_decisions')
        .insert({
          user_id: user.id,
          decision_text: decisionText,
          rationale,
          source,
          status: 'active',
        })
        .select()
        .single();
      if (!error && data) {
        setDecisions((prev) => [data as unknown as UserDecision, ...prev]);
      }
      return data;
    },
    [user?.id],
  );

  const supersedeDecision = useCallback(
    async (oldDecisionId: string, newDecisionText: string, rationale: string | null) => {
      if (!user?.id) return;
      const { data: newDecision } = await supabase
        .from('user_decisions')
        .insert({
          user_id: user.id,
          decision_text: newDecisionText,
          rationale,
          source: 'manual',
          status: 'active',
        })
        .select()
        .single();
      if (newDecision) {
        await supabase
          .from('user_decisions')
          .update({ status: 'superseded', superseded_by: newDecision.id })
          .eq('id', oldDecisionId);
        await fetchDecisions();
      }
    },
    [user?.id, fetchDecisions],
  );

  const reverseDecision = useCallback(
    async (decisionId: string) => {
      await supabase.from('user_decisions').update({ status: 'reversed' }).eq('id', decisionId);
      await fetchDecisions();
    },
    [fetchDecisions],
  );

  return { decisions, isLoading, fetchDecisions, addDecision, supersedeDecision, reverseDecision };
}
