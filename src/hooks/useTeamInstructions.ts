import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TeamInstructionRequest, TeamInstructionResult } from '@/types/team-instructions';

export function useTeamInstructions() {
  const [instructions, setInstructions] = useState<TeamInstructionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInstructions = useCallback(async (params: TeamInstructionRequest) => {
    setIsGenerating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-team-instructions', {
        body: params,
      });
      if (fnError) throw fnError;

      const result: TeamInstructionResult = {
        instructions: data?.instructions || '',
        sections: data?.sections || [],
        generatedAt: data?.generatedAt || new Date().toISOString(),
      };
      setInstructions(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate instructions';
      setError(message);
      console.error('Team instructions generation failed:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!instructions?.instructions) return false;
    try {
      await navigator.clipboard.writeText(instructions.instructions);
      return true;
    } catch {
      return false;
    }
  }, [instructions]);

  const reset = useCallback(() => {
    setInstructions(null);
    setError(null);
  }, []);

  return { instructions, isGenerating, error, generateInstructions, copyToClipboard, reset };
}
