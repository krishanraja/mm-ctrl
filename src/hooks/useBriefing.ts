import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Briefing, BriefingFeedback, BriefingType } from '@/types/briefing';

const GENERATION_POLL_INTERVAL = 3_000; // 3s between polls
const GENERATION_MAX_POLLS = 40;        // 40 * 3s = 120s max
const AUDIO_POLL_INTERVAL = 3_000;
const AUDIO_MAX_POLLS = 40;

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
 * With polling-based generation, `generating` stays true until the briefing
 * row appears in the DB, eliminating the flash-of-CTA race condition.
 */
export function useAutoGenerateBriefing(
  defaultBriefing: Briefing | null,
  briefingLoading: boolean,
  hasData: boolean,
  refetch: () => Promise<void>,
) {
  const { generate, generating, phase } = useGenerateBriefing();
  const triggered = useRef(false);

  useEffect(() => {
    if (briefingLoading || triggered.current) return;
    if (defaultBriefing) return;
    if (!hasData) return;

    triggered.current = true;
    (async () => {
      await generate(undefined, undefined, undefined, refetch);
    })();
  }, [briefingLoading, defaultBriefing, hasData, generate, refetch]);

  return { generating, phase };
}

/**
 * Generate a briefing on demand. Fires the edge function, then polls the DB
 * until the briefing row appears. `generating` stays true throughout the
 * entire cycle, preventing UI flicker.
 */
export function useGenerateBriefing() {
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'personalising' | 'preparing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  // Cleanup any active poll on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const generate = useCallback(async (
    briefingType?: BriefingType,
    customContext?: string,
    forceRegenerate?: boolean,
    onFound?: () => Promise<void>,
  ): Promise<string | null> => {
    cancelledRef.current = false;
    setGenerating(true);
    setError(null);
    setPhase('scanning');

    const phaseTimer = setTimeout(() => {
      if (!cancelledRef.current) setPhase('personalising');
    }, 3000);
    const phaseTimer2 = setTimeout(() => {
      if (!cancelledRef.current) setPhase('preparing');
    }, 7000);

    const body: Record<string, unknown> = {};
    if (briefingType) body.briefing_type = briefingType;
    if (customContext) body.custom_context = customContext;
    if (forceRegenerate) body.force_regenerate = true;

    // Fire the edge function (don't race with a timeout)
    supabase.functions.invoke('generate-briefing', {
      body: Object.keys(body).length > 0 ? body : undefined,
    }).then(({ data, error: genErr }) => {
      if (genErr) console.warn('generate-briefing returned error:', genErr);
      // If the edge function returned a briefing_id with already_exists,
      // the poll below will find it quickly
      if (data?.already_exists && data?.briefing_id) {
        console.log('Briefing already exists:', data.briefing_id);
      }
    }).catch((err) => {
      console.warn('generate-briefing invocation failed:', err);
    });

    // Poll the DB for the briefing to appear
    const targetType = briefingType || 'default';
    const today = new Date().toISOString().split('T')[0];

    return new Promise<string | null>((resolve) => {
      let pollCount = 0;

      const poll = async () => {
        if (cancelledRef.current) {
          cleanup();
          resolve(null);
          return;
        }

        pollCount += 1;
        if (pollCount > GENERATION_MAX_POLLS) {
          cleanup();
          setError('Briefing generation timed out. Please try again.');
          setPhase('idle');
          setGenerating(false);
          resolve(null);
          return;
        }

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // For custom_voice, we look for any briefing created in the last 3 minutes
          const query = supabase
            .from('briefings')
            .select('id, segments, script_text')
            .eq('user_id', user.id)
            .eq('briefing_date', today)
            .eq('briefing_type', targetType)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data } = await query;

          if (data?.id && data.segments?.length > 0) {
            cleanup();
            // Refetch FIRST so todaysBriefing is populated before
            // generating turns off. The three-state UI condition
            // (todaysBriefing ? card : generating ? banner : CTA)
            // needs todaysBriefing to be set before generating=false,
            // otherwise the CTA flashes briefly.
            if (onFound) await onFound();
            setPhase('idle');
            setGenerating(false);
            resolve(data.id);
            return;
          }
        } catch (e) {
          console.warn('Generation poll error:', e);
        }
      };

      const cleanup = () => {
        clearTimeout(phaseTimer);
        clearTimeout(phaseTimer2);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };

      // First poll after a short delay (give the edge function a head start)
      setTimeout(poll, 2000);
      pollIntervalRef.current = setInterval(poll, GENERATION_POLL_INTERVAL);
    });
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
 *
 * Only triggers synthesis once script_text is available (not for
 * headline-only partial briefings).
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

    // Poll DB; trigger synthesis once script is ready
    const poll = async () => {
      if (resolvedRef.current) return;
      pollCountRef.current += 1;

      if (pollCountRef.current > AUDIO_MAX_POLLS) {
        setPolling(false);
        setExhausted(true);
        cleanup();
        return;
      }

      try {
        const { data } = await supabase
          .from('briefings')
          .select('audio_url, script_text')
          .eq('id', id)
          .maybeSingle();

        if (data?.audio_url) {
          resolve(data.audio_url);
          return;
        }

        // Trigger synthesis once script is available (only once per briefing)
        if (data?.script_text && synthTriggeredRef.current !== id) {
          synthTriggeredRef.current = id;
          supabase.functions
            .invoke('synthesize-briefing', { body: { briefing_id: id } })
            .then(({ data: synthData, error }) => {
              if (resolvedRef.current) return;
              if (!error && synthData?.audio_url) {
                resolve(synthData.audio_url);
              }
            })
            .catch((e) => console.warn('Synthesis trigger failed:', e));
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, AUDIO_POLL_INTERVAL);
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
