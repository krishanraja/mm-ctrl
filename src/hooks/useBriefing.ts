import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Briefing, BriefingFeedback } from '@/types/briefing';

const GENERATE_TIMEOUT = 30_000; // 30s for news fetch + GPT-4o
const POLL_INTERVAL = 3_000;
const MAX_POLLS = 40; // 40 * 3s = 120s max

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

      const phaseTimer = setTimeout(() => setPhase('personalising'), 3000);
      const phaseTimer2 = setTimeout(() => setPhase('preparing'), 7000);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Briefing generation timed out. Please try again.')), GENERATE_TIMEOUT)
      );

      const { data, error: genErr } = await Promise.race([
        supabase.functions.invoke('generate-briefing'),
        timeout,
      ]);

      clearTimeout(phaseTimer);
      clearTimeout(phaseTimer2);

      if (genErr) throw genErr;

      const briefingId = data?.briefing_id || null;

      setPhase('idle');
      return briefingId;
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
 * Poll for audio readiness while also triggering synthesis.
 * Uses both the synthesis response and DB polling in parallel;
 * whichever finds the audio_url first wins.
 */
export function usePollAudio(briefingId: string | null) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const resolvedRef = useRef(false);
  const synthTriggeredRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resolve = useCallback((url: string) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setAudioUrl(url);
    setPolling(false);
    cleanup();
  }, [cleanup]);

  const startPollingAndSynthesis = useCallback((id: string) => {
    resolvedRef.current = false;
    setPolling(true);
    setExhausted(false);
    setAudioUrl(null);
    pollCountRef.current = 0;

    // Path 1: Trigger synthesis and use its response directly
    if (synthTriggeredRef.current !== id) {
      synthTriggeredRef.current = id;
      supabase.functions
        .invoke('synthesize-briefing', { body: { briefing_id: id } })
        .then(({ data, error }) => {
          if (resolvedRef.current) return;
          if (!error && data?.audio_url) {
            resolve(data.audio_url);
          }
        })
        .catch((e) => console.warn('Synthesis trigger failed:', e));
    }

    // Path 2: Poll DB as backup
    const poll = async () => {
      if (resolvedRef.current) return;
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLLS) {
        setPolling(false);
        setExhausted(true);
        cleanup();
        return;
      }

      try {
        const { data } = await supabase
          .from('briefings')
          .select('audio_url')
          .eq('id', id)
          .maybeSingle();

        if (data?.audio_url) {
          resolve(data.audio_url);
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [cleanup, resolve]);

  useEffect(() => {
    if (!briefingId) {
      setPolling(false);
      cleanup();
      return;
    }

    startPollingAndSynthesis(briefingId);
    return cleanup;
  }, [briefingId, startPollingAndSynthesis, cleanup]);

  const retry = useCallback(() => {
    if (!briefingId) return;
    synthTriggeredRef.current = null;
    startPollingAndSynthesis(briefingId);
  }, [briefingId, startPollingAndSynthesis]);

  return { audioUrl, polling, exhausted, retry };
}
