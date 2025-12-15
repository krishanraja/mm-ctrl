/**
 * Real-time Generation Progress Tracking
 * 
 * Purpose: Polls database for generation_status updates and tracks phase completion
 * Dependencies: Supabase client, sonner toast
 * 
 * Returns: { phases, isComplete, hasErrors, currentPhase, completedCount, totalCount, progressPercentage }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GenerationPhase {
  name: string;
  key: keyof GenerationStatus;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  duration?: number;
  error?: string;
}

export interface GenerationStatus {
  insights_generated: boolean;
  prompts_generated: boolean;
  risks_computed: boolean;
  tensions_computed: boolean;
  scenarios_generated: boolean;
  first_moves_generated: boolean;
  last_updated: string | null;
  error_log: Array<{ phase: string; error: string; timestamp: string }>;
}

const PHASES: Array<{ name: string; key: keyof GenerationStatus }> = [
  { name: 'Analyzing your responses', key: 'insights_generated' },
  { name: 'Generating your prompt library', key: 'prompts_generated' },
  { name: 'Computing risk signals', key: 'risks_computed' },
  { name: 'Identifying tensions', key: 'tensions_computed' },
  { name: 'Deriving org scenarios', key: 'scenarios_generated' },
  { name: 'Creating first moves', key: 'first_moves_generated' },
];

const TIMEOUT_MS = 180000; // 3 minutes per phase (increased to accommodate 116s Gemini responses)

export function useGenerationProgress(assessmentId: string) {
  const [phases, setPhases] = useState<GenerationPhase[]>(
    PHASES.map(p => ({ ...p, status: 'pending' as const }))
  );
  const [isComplete, setIsComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [phaseStartTimes, setPhaseStartTimes] = useState<Record<string, number>>({});
  const errorToastShown = useRef(false);


  const checkProgress = useCallback(async () => {
    if (!assessmentId) return;

    try {
      const { data, error } = await supabase
        .from('leader_assessments')
        .select('generation_status')
        .eq('id', assessmentId)
        .single();

      if (error || !data || !data.generation_status) {
        console.error('❌ Failed to fetch generation status:', error);
        return;
      }

      const status = (data.generation_status || {}) as any;
      const now = Date.now();
      
      // Simplified: Trust generation_status flags from DB
      const updatedPhases = PHASES.map((phase) => {
        const isComplete = status[phase.key] === true;
        const hasError = status.error_log?.some(
          (e: any) => e.phase === phase.key
        );

        // Track when phase started
        if (!isComplete && !hasError) {
          setPhaseStartTimes(prev => {
            if (!prev[phase.key]) {
              return { ...prev, [phase.key]: now };
            }
            return prev;
          });
        }

        // Check for timeout
        const phaseStartTime = phaseStartTimes[phase.key];
        const isTimedOut = phaseStartTime && (now - phaseStartTime) > TIMEOUT_MS;

        let phaseStatus: 'pending' | 'in-progress' | 'complete' | 'failed' = 'pending';
        let phaseError: string | undefined;

        if (hasError) {
          phaseStatus = 'failed';
          phaseError = status.error_log.find((e: any) => e.phase === phase.key)?.error;
        } else if (isTimedOut) {
          phaseStatus = 'failed';
          phaseError = 'Generation timed out after 3 minutes';
        } else if (isComplete) {
          phaseStatus = 'complete';
        } else if (status.last_updated) {
          phaseStatus = 'in-progress';
        }

        return {
          ...phase,
          status: phaseStatus,
          error: phaseError
        };
      });
      
      setPhases(updatedPhases);

      // Check if all complete (flag + data verified)
      const allComplete = updatedPhases.every(p => p.status === 'complete');
      setIsComplete(allComplete);

      // Check for errors and show toast
      const anyErrors = status.error_log && status.error_log.length > 0;
      setHasErrors(anyErrors);

      // Show error toast once if there are errors
      if (anyErrors && !errorToastShown.current) {
        errorToastShown.current = true;
        const latestError = status.error_log[status.error_log.length - 1];
        toast.error('Generation Issue', {
          description: `Phase "${latestError.phase}" encountered an issue. Results may be partial.`,
          duration: 5000
        });
      }

    } catch (error) {
      console.error('❌ Error checking progress:', error);
    }
  }, [assessmentId, phaseStartTimes]);

  // Poll every 2 seconds
  useEffect(() => {
    if (!assessmentId || isComplete) return;

    checkProgress(); // Initial check
    const interval = setInterval(checkProgress, 2000);

    return () => clearInterval(interval);
  }, [assessmentId, isComplete, checkProgress]);

  return {
    phases,
    isComplete,
    hasErrors,
    currentPhase: phases.find(p => p.status === 'in-progress')?.name,
    completedCount: phases.filter(p => p.status === 'complete').length,
    totalCount: phases.length,
    progressPercentage: Math.round(
      (phases.filter(p => p.status === 'complete').length / phases.length) * 100
    )
  };
}
