/**
 * useAssessmentBenchmarks hook
 *
 * Fetches AI benchmark enrichment data for the assessment results page.
 * Shows detected tools vs. frontier models.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AABenchmarkEnrichment } from "@/types/artificial-analysis";
import type { DiagnosticData, DiagnosticScores } from "@/types/diagnostic";

export function useAssessmentBenchmarks(
  diagnosticData: DiagnosticData | null,
  scores: DiagnosticScores | null
) {
  const query = useQuery<AABenchmarkEnrichment | null>({
    queryKey: ["aa-assessment-enrich", diagnosticData?.usesChatGPT, diagnosticData?.usesNotionAI],
    queryFn: async () => {
      if (!diagnosticData) return null;

      const detectedTools: Record<string, boolean> = {};
      if (diagnosticData.usesChatGPT) detectedTools.usesChatGPT = true;
      if (diagnosticData.usesNotionAI) detectedTools.usesNotionAI = true;
      if (diagnosticData.usesGrammarlyAI) detectedTools.usesGrammarlyAI = true;

      const { data, error } = await supabase.functions.invoke(
        "aa-assessment-enrich",
        { body: { detectedTools, scores } }
      );

      if (error) {
        console.warn("Assessment benchmark enrichment failed:", error);
        return null;
      }

      return data as AABenchmarkEnrichment;
    },
    enabled: !!diagnosticData,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return {
    enrichment: query.data,
    isLoading: query.isLoading,
  };
}
