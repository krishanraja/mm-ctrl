/**
 * useModelRecommendation hook
 *
 * Fetches AI model recommendations from the aa-model-recommend edge function
 * based on the selected export use case and platform.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AAModelRecommendationResponse } from "@/types/artificial-analysis";

export function useModelRecommendation(
  useCase: string | null,
  platform: string | null
) {
  const query = useQuery<AAModelRecommendationResponse | null>({
    queryKey: ["aa-model-recommend", useCase, platform],
    queryFn: async () => {
      if (!useCase) return null;

      const { data, error } = await supabase.functions.invoke(
        "aa-model-recommend",
        { body: { useCase, platform } }
      );

      if (error) {
        console.warn("Model recommendation fetch failed:", error);
        return null;
      }

      return data as AAModelRecommendationResponse;
    },
    enabled: !!useCase,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });

  return {
    recommendation: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
