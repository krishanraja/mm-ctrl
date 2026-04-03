/**
 * Real-time assessment progress tracking using Supabase Realtime
 * Replaces polling with efficient real-time subscriptions.
 * Falls back to polling after max retries on CHANNEL_ERROR.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AssessmentStatus {
  insights_generated?: boolean;
  prompts_generated?: boolean;
  risks_computed?: boolean;
  tensions_computed?: boolean;
  scenarios_generated?: boolean;
  first_moves_generated?: boolean;
  error_log?: Array<{ phase: string; error: string; timestamp: string }>;
}

export interface UseRealtimeAssessmentResult {
  status: AssessmentStatus | null;
  isComplete: boolean;
  hasErrors: boolean;
  isLoading: boolean;
  error: Error | null;
}

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const POLL_INTERVAL_MS = 5000;

/**
 * Subscribe to real-time updates for assessment generation status.
 * On CHANNEL_ERROR, retries with exponential backoff up to MAX_RETRIES times,
 * then falls back to polling every 5 seconds.
 *
 * @param assessmentId The assessment ID to track
 * @returns Assessment status, completion state, and error state
 */
export function useRealtimeAssessment(assessmentId: string | null): UseRealtimeAssessmentResult {
  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCount = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (mounted: { current: boolean }) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId!)
        .single();

      if (fetchError) throw fetchError;

      if (mounted.current && data?.generation_status) {
        const currentStatus = data.generation_status as AssessmentStatus;
        setStatus(currentStatus);
        setIsComplete(checkComplete(currentStatus));
        setHasErrors(checkHasErrors(currentStatus));
        setIsLoading(false);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch status'));
        setIsLoading(false);
      }
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!assessmentId) {
      setIsLoading(false);
      return;
    }

    const mounted = { current: true };

    // Reset state for a new assessmentId
    retryCount.current = 0;

    // Initial fetch
    fetchStatus(mounted);

    const startPollingFallback = () => {
      if (pollIntervalRef.current) return; // already polling
      console.warn(
        `Realtime subscription failed after ${MAX_RETRIES} retries; falling back to polling every ${POLL_INTERVAL_MS / 1000}s`
      );
      pollIntervalRef.current = setInterval(() => {
        if (mounted.current) {
          fetchStatus(mounted);
        }
      }, POLL_INTERVAL_MS);
    };

    const cleanupChannel = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const subscribe = () => {
      // Clean up any previous channel before creating a new one
      cleanupChannel();

      const channel = supabase
        .channel(`assessment:${assessmentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leader_assessments',
            filter: `id=eq.${assessmentId}`,
          },
          (payload) => {
            if (mounted.current && payload.new.generation_status) {
              const newStatus = payload.new.generation_status as AssessmentStatus;
              setStatus(newStatus);
              setIsComplete(checkComplete(newStatus));
              setHasErrors(checkHasErrors(newStatus));
              setIsLoading(false);
            }
          }
        )
        .subscribe((subscriptionStatus) => {
          if (subscriptionStatus === 'SUBSCRIBED') {
            console.log('Subscribed to assessment updates:', assessmentId);
            // Reset retry count on successful subscription
            retryCount.current = 0;
          } else if (subscriptionStatus === 'CHANNEL_ERROR') {
            console.error('Realtime subscription error');
            cleanupChannel();

            if (!mounted.current) return;

            retryCount.current += 1;

            if (retryCount.current <= MAX_RETRIES) {
              const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount.current - 1);
              console.warn(
                `Retrying realtime subscription (attempt ${retryCount.current}/${MAX_RETRIES}) in ${backoffMs}ms`
              );
              retryTimeoutRef.current = setTimeout(() => {
                if (mounted.current) {
                  subscribe();
                }
              }, backoffMs);
            } else {
              setError(new Error('Realtime subscription failed; using polling fallback'));
              startPollingFallback();
            }
          }
        });

      channelRef.current = channel;
    };

    subscribe();

    // Cleanup
    return () => {
      mounted.current = false;
      cleanupChannel();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [assessmentId, fetchStatus]);

  return {
    status,
    isComplete,
    hasErrors,
    isLoading,
    error,
  };
}

/**
 * Check if assessment generation is complete
 */
function checkComplete(status: AssessmentStatus): boolean {
  return !!(
    status.insights_generated &&
    status.prompts_generated &&
    status.risks_computed &&
    status.tensions_computed &&
    status.scenarios_generated &&
    status.first_moves_generated
  );
}

/**
 * Check if assessment has errors
 */
function checkHasErrors(status: AssessmentStatus): boolean {
  return !!(status.error_log && status.error_log.length > 0);
}
