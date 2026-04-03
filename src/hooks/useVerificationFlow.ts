/**
 * useVerificationFlow Hook
 * Manages the verification flow state, actions, and haptic feedback.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserMemory } from './useUserMemory';
import { useMemoryWeb } from './useMemoryWeb';
import { memoryKeys } from './useMemoryQueries';
import { haptics } from '@/lib/haptics';
import type { PendingVerification } from '@/types/memory';

interface UseVerificationFlowReturn {
  // State
  isFlowOpen: boolean;
  pendingFacts: PendingVerification[];
  isLoading: boolean;

  // Derived
  unverifiedCount: number;
  verifiedRate: number;

  // Actions
  openFlow: () => Promise<void>;
  closeFlow: () => void;
  verifyFact: (factId: string, newValue?: string) => Promise<boolean>;
  rejectFact: (factId: string) => Promise<boolean>;
  quickVerify: (factId: string) => Promise<boolean>;
  refreshPending: () => Promise<void>;
}

export function useVerificationFlow(): UseVerificationFlowReturn {
  const queryClient = useQueryClient();
  const {
    pendingVerifications,
    verifyFact: rpcVerify,
    rejectFact: rpcReject,
    refreshMemory,
  } = useUserMemory();
  const {
    stats,
    verifyFact: directVerify,
    refresh: refreshWeb,
  } = useMemoryWeb();

  const [isFlowOpen, setIsFlowOpen] = useState(false);

  const unverifiedCount = useMemo(() => {
    if (!stats) return 0;
    const verified = Math.round((stats.verified_rate / 100) * stats.total_facts);
    return stats.total_facts - verified;
  }, [stats]);

  const verifiedRate = stats?.verified_rate ?? 0;

  const openFlow = useCallback(async () => {
    haptics.light();
    await refreshMemory();
    setIsFlowOpen(true);
  }, [refreshMemory]);

  const closeFlow = useCallback(() => {
    setIsFlowOpen(false);
    refreshWeb();
    queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
  }, [refreshWeb, queryClient]);

  const verifyFact = useCallback(
    async (factId: string, newValue?: string): Promise<boolean> => {
      const result = await rpcVerify(factId, newValue);
      if (result) {
        haptics.success();
      }
      return result;
    },
    [rpcVerify],
  );

  const rejectFact = useCallback(
    async (factId: string): Promise<boolean> => {
      const result = await rpcReject(factId);
      if (result) {
        haptics.medium();
      }
      return result;
    },
    [rpcReject],
  );

  const quickVerify = useCallback(
    async (factId: string): Promise<boolean> => {
      try {
        await directVerify(factId);
        haptics.success();
        queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
        return true;
      } catch {
        return false;
      }
    },
    [directVerify, queryClient],
  );

  const refreshPending = useCallback(async () => {
    await refreshMemory();
  }, [refreshMemory]);

  return {
    isFlowOpen,
    pendingFacts: pendingVerifications,
    isLoading: false,
    unverifiedCount,
    verifiedRate,
    openFlow,
    closeFlow,
    verifyFact,
    rejectFact,
    quickVerify,
    refreshPending,
  };
}
