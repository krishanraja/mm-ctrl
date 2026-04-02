import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Briefing, BriefingFeedback } from '@/types/briefing';

/**
 * Fetch today's briefing for the current user
 */
export function useTodaysBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error: fetchErr } = await supabase
        .from('briefings')
        .select('*')
        .eq('user_id', user.id)
        .eq('briefing_date', today)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      setBriefing(data as Briefing | null);
    } catch (err) {
      console.error('Failed to fetch briefing:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  return { briefing, loading, error, refetch: fetchBriefing };
}

/**
 * Generate a briefing on demand
 */
export function useGenerateBriefing() {
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'personalising' | 'preparing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (): Promise<string | null> => {
    try {
      setGenerating(true);
      setError(null);
      setPhase('scanning');

      // Phase timing for UX
      const phaseTimer = setTimeout(() => setPhase('personalising'), 3000);
      const phaseTimer2 = setTimeout(() => setPhase('preparing'), 7000);

      const { data, error: genErr } = await supabase.functions.invoke('generate-briefing');

      clearTimeout(phaseTimer);
      clearTimeout(phaseTimer2);

      if (genErr) throw genErr;

      setPhase('idle');
      return data?.briefing_id || null;
    } catch (err) {
      console.error('Generate briefing failed:', err);
      setError((err as Error).message);
      setPhase('idle');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, phase, error };
}

/**
 * Submit feedback on a briefing segment
 */
export function useSubmitFeedback() {
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = useCallback(
    async (briefingId: string, segmentIndex: number, reaction: BriefingFeedback['reaction']) => {
      try {
        setSubmitting(true);
        const { error } = await supabase
          .from('briefing_feedback')
          .insert({
            briefing_id: briefingId,
            segment_index: segmentIndex,
            reaction,
          });
        if (error) throw error;
      } catch (err) {
        console.error('Feedback failed:', err);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitFeedback, submitting };
}

/**
 * Poll for audio readiness (when briefing was just generated)
 */
export function usePollAudio(briefingId: string | null) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!briefingId) return;

    setPolling(true);

    const poll = async () => {
      const { data } = await supabase
        .from('briefings')
        .select('audio_url')
        .eq('id', briefingId)
        .maybeSingle();

      if (data?.audio_url) {
        setAudioUrl(data.audio_url);
        setPolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // Poll every 3 seconds
    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [briefingId]);

  return { audioUrl, polling };
}
