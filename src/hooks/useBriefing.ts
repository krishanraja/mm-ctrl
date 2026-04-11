import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Briefing, BriefingFeedback, BriefingType } from '@/types/briefing';

const GENERATE_TIMEOUT = 30_000; // 30s for news fetch + GPT-4o
const POLL_INTERVAL = 3_000;
const MAX_POLLS = 40; // 40 * 3s = 120s max

/**
 * Fetch today's briefings for the current user.
 * Returns all briefings for today (default + custom types).
 */
export function useTodaysBriefing() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoGenerateTriggered = useRef(false);

  const fetchBriefings = useCallback(async () => {
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
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setBriefings((data as Briefing[]) || []);
    } catch (err) {
      console.error('Failed to fetch briefings:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefings();
  }, [fetchBriefings]);

  // Convenience: the default briefing
  const defaultBriefing = briefings.find(b => (b.briefing_type || 'default') === 'default') || null;
  const customBriefings = briefings.filter(b => (b.briefing_type || 'default') !== 'default');

  // Back-compat: single briefing alias
  const briefing = defaultBriefing;

  return {
    briefing,
    briefings,
    defaultBriefing,
    customBriefings,
    loading,
    error,
    refetch: fetchBriefings,
    autoGenerateTriggered,
  };
}

/**
 * Auto-generate the default briefing on page load if none exists today.
 * Polls the DB every 3s while generation is in-flight so preliminary
 * headlines (inserted early by generate-briefing) appear immediately.
 */
export function useAutoGenerateBriefing(
  defaultBriefing: Briefing | null,
  briefingLoading: boolean,
  hasData: boolean,
  refetch: () => Promise<void>,
) {
  const { generate, generating, phase } = useGenerateBriefing();
  const triggered = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (briefingLoading || triggered.current) return;
    if (defaultBriefing) return; // already exists
    if (!hasData) return; // user has no profile data yet

    triggered.current = true;

    // Poll DB every 3s so we pick up the preliminary briefing row
    // as soon as it is inserted (before generate-briefing returns)
    pollRef.current = setInterval(() => {
      refetch();
    }, POLL_INTERVAL);

    (async () => {
      const id = await generate();
      // Stop polling once generation completes
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (id) {
        await refetch();
      }
    })();
  }, [briefingLoading, defaultBriefing, hasData, generate, refetch]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  return { generating, phase };
}

/**
 * Generate a briefing on demand (supports custom types)
 */
export function useGenerateBriefing() {
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'personalising' | 'preparing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    briefingType?: BriefingType,
    customContext?: string,
    options?: { force?: boolean },
  ): Promise<string | null> => {
    try {
      setGenerating(true);
      setError(null);
      setPhase('scanning');

      const phaseTimer = setTimeout(() => setPhase('personalising'), 3000);
      const phaseTimer2 = setTimeout(() => setPhase('preparing'), 7000);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Briefing generation timed out. Please try again.')), GENERATE_TIMEOUT)
      );

      const body: Record<string, unknown> = {};
      if (briefingType) body.briefing_type = briefingType;
      if (customContext) body.custom_context = customContext;
      if (options?.force) body.force = true;

      const { data, error: genErr } = await Promise.race([
        supabase.functions.invoke('generate-briefing', {
          body: Object.keys(body).length > 0 ? body : undefined,
        }),
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

  const regenerate = useCallback(async (): Promise<string | null> => {
    return generate(undefined, undefined, { force: true });
  }, [generate]);

  return { generate, regenerate, generating, phase, error };
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
