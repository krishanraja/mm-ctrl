/**
 * PHASE 2: Real-time Generation Progress Tracking
 * Tracks actual edge function execution status
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function useGenerationProgress(assessmentId: string) {
  const [phases, setPhases] = useState<GenerationPhase[]>(
    PHASES.map(p => ({ ...p, status: 'pending' as const }))
  );
  const [isComplete, setIsComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

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
      
      // Update phases based on DB status
      setPhases(prevPhases => 
        prevPhases.map(phase => {
          const isComplete = status[phase.key] === true;
          const hasError = status.error_log?.some(
            (e: any) => e.phase === phase.key
          );

          return {
            ...phase,
            status: hasError ? 'failed' : isComplete ? 'complete' : 'in-progress',
            error: hasError 
              ? status.error_log.find((e: any) => e.phase === phase.key)?.error 
              : undefined
          };
        })
      );

      // Check if all complete
      const allComplete = PHASES.every(p => status[p.key] === true);
      setIsComplete(allComplete);

      // Check for errors
      const anyErrors = status.error_log && status.error_log.length > 0;
      setHasErrors(anyErrors);

    } catch (error) {
      console.error('❌ Error checking progress:', error);
    }
  }, [assessmentId]);

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
