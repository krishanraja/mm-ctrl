/**
 * useUserMemory Hook
 * Manages user memory state, extraction, and verification
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type {
  UserMemoryFact,
  PendingVerification,
  ExtractionResult,
  MemoryContext,
  MemorySourceType
} from '@/types/memory';

interface UseUserMemoryReturn {
  // State
  memory: UserMemoryFact[];
  pendingVerifications: PendingVerification[];
  isLoading: boolean;
  isExtracting: boolean;
  error: string | null;
  
  // Actions
  extractFromTranscript: (transcript: string, sessionId?: string, sourceType?: MemorySourceType) => Promise<ExtractionResult>;
  verifyFact: (factId: string, newValue?: string) => Promise<boolean>;
  rejectFact: (factId: string) => Promise<boolean>;
  refreshMemory: () => Promise<void>;
  getMemoryContext: () => MemoryContext;
  clearPendingVerifications: () => void;
}

export function useUserMemory(): UseUserMemoryReturn {
  const { user } = useAuth();
  const [memory, setMemory] = useState<UserMemoryFact[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's memory on mount and when user changes
  const refreshMemory = useCallback(async () => {
    if (!user?.id) {
      setMemory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .order('fact_category')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMemory((data as UserMemoryFact[]) || []);

      // Also fetch pending verifications
      const { data: pending } = await supabase
        .rpc('get_pending_verifications', { p_user_id: user.id });
      
      setPendingVerifications((pending as PendingVerification[]) || []);
    } catch (err) {
      console.error('Error fetching memory:', err);
      setError('Failed to load your profile data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshMemory();
  }, [refreshMemory]);

  // Extract facts from a transcript
  const extractFromTranscript = useCallback(async (
    transcript: string,
    sessionId?: string,
    sourceType?: MemorySourceType
  ): Promise<ExtractionResult> => {
    setIsExtracting(true);
    setError(null);

    try {
      const { data, error: extractError } = await supabase.functions.invoke(
        'extract-user-context',
        {
          body: { transcript, session_id: sessionId, source_type: sourceType },
        }
      );

      if (extractError) throw extractError;

      const result = data as ExtractionResult;

      // Update pending verifications if we got new ones
      if (result.pending_verifications?.length > 0) {
        setPendingVerifications(result.pending_verifications);
      }

      // Refresh memory to get newly stored facts
      if (user?.id) {
        await refreshMemory();
      }

      return result;
    } catch (err) {
      console.error('Error extracting context:', err);
      setError('Failed to extract context from your input');
      return {
        success: false,
        pending_verifications: [],
        error: 'Extraction failed',
      };
    } finally {
      setIsExtracting(false);
    }
  }, [user?.id, refreshMemory]);

  // Verify a fact (confirm as correct)
  const verifyFact = useCallback(async (
    factId: string, 
    newValue?: string
  ): Promise<boolean> => {
    try {
      const { data, error: verifyError } = await supabase
        .rpc('verify_memory_fact', {
          p_fact_id: factId,
          p_new_value: newValue || null,
          p_is_correct: true,
        });

      if (verifyError) throw verifyError;

      // Remove from pending verifications
      setPendingVerifications(prev => prev.filter(p => p.id !== factId));
      
      // Refresh memory
      await refreshMemory();

      return true;
    } catch (err) {
      console.error('Error verifying fact:', err);
      setError('Failed to save verification');
      return false;
    }
  }, [refreshMemory]);

  // Reject a fact (mark as incorrect)
  const rejectFact = useCallback(async (factId: string): Promise<boolean> => {
    try {
      const { error: rejectError } = await supabase
        .rpc('verify_memory_fact', {
          p_fact_id: factId,
          p_new_value: null,
          p_is_correct: false,
        });

      if (rejectError) throw rejectError;

      // Remove from pending verifications
      setPendingVerifications(prev => prev.filter(p => p.id !== factId));
      
      // Refresh memory
      await refreshMemory();

      return true;
    } catch (err) {
      console.error('Error rejecting fact:', err);
      setError('Failed to reject fact');
      return false;
    }
  }, [refreshMemory]);

  // Get formatted memory context for LLM
  const getMemoryContext = useCallback((): MemoryContext => {
    const verified = memory.filter(
      m => m.verification_status === 'verified' || m.verification_status === 'corrected'
    );
    const inferred = memory.filter(
      m => m.verification_status === 'inferred' && m.confidence_score >= 0.7
    );

    let formatted = '';

    if (verified.length > 0) {
      formatted += '=== USER MEMORY (Verified) ===\n';
      verified.forEach(fact => {
        formatted += `${fact.fact_label}: ${fact.fact_value}\n`;
      });
      formatted += '\n';
    }

    if (inferred.length > 0) {
      formatted += '=== USER MEMORY (Inferred, High Confidence) ===\n';
      inferred.forEach(fact => {
        formatted += `${fact.fact_label}: ${fact.fact_value}\n`;
      });
    }

    return { verified, inferred, formatted };
  }, [memory]);

  // Clear pending verifications (dismiss without action)
  const clearPendingVerifications = useCallback(() => {
    setPendingVerifications([]);
  }, []);

  return {
    memory,
    pendingVerifications,
    isLoading,
    isExtracting,
    error,
    extractFromTranscript,
    verifyFact,
    rejectFact,
    refreshMemory,
    getMemoryContext,
    clearPendingVerifications,
  };
}
