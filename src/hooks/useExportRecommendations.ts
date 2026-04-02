import { useMemo } from 'react';
import { useEdge } from '@/hooks/useEdge';
import { buildExportRecommendations } from '@/lib/export-recommendations';
import type { ExportRecommendation } from '@/types/edge';

export function useExportRecommendations(): {
  recommendations: ExportRecommendation[];
  hasRecommendations: boolean;
  isLoading: boolean;
} {
  const { strengths, weaknesses, hasProfile, isLoading } = useEdge();

  const recommendations = useMemo(() => {
    if (!hasProfile) return [];
    return buildExportRecommendations(strengths, weaknesses);
  }, [hasProfile, strengths, weaknesses]);

  return {
    recommendations,
    hasRecommendations: recommendations.length > 0,
    isLoading,
  };
}
