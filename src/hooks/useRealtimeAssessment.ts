/**
 * Real-time assessment progress tracking using Supabase Realtime
 * Replaces polling with efficient real-time subscriptions
 */

import { useEffect, useState, useRef } from 'react';
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

/**
 * Subscribe to real-time updates for assessment generation status
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

  useEffect(() => {
    if (!assessmentId) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Initial fetch
    const fetchInitialStatus = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('leader_assessments')
          .select('generation_status')
          .eq('id', assessmentId)
          .single();

        if (fetchError) throw fetchError;

        if (mounted && data?.generation_status) {
          const currentStatus = data.generation_status as AssessmentStatus;
          setStatus(currentStatus);
          setIsComplete(checkComplete(currentStatus));
          setHasErrors(checkHasErrors(currentStatus));
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch status'));
          setIsLoading(false);
        }
      }
    };

    fetchInitialStatus();

    // Set up realtime subscription
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
          if (mounted && payload.new.generation_status) {
            const newStatus = payload.new.generation_status as AssessmentStatus;
            setStatus(newStatus);
            setIsComplete(checkComplete(newStatus));
            setHasErrors(checkHasErrors(newStatus));
            setIsLoading(false);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to assessment updates:', assessmentId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error');
          if (mounted) {
            setError(new Error('Failed to subscribe to real-time updates'));
          }
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [assessmentId]);

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
