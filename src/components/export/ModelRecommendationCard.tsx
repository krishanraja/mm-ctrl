/**
 * ModelRecommendationCard
 *
 * Shows AI model recommendations based on live Artificial Analysis benchmarks.
 * Displayed in Step 3 of the Context Export wizard.
 */

import { motion } from "framer-motion";
import { BarChart3, ExternalLink } from "lucide-react";
import { useModelRecommendation } from "@/hooks/useModelRecommendation";
import { AA_ATTRIBUTION } from "@/types/artificial-analysis";

interface ModelRecommendationCardProps {
  useCase: string | null;
  platform: string | null;
}

export function ModelRecommendationCard({
  useCase,
  platform,
}: ModelRecommendationCardProps) {
  const { recommendation, isLoading } = useModelRecommendation(
    useCase,
    platform
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (
    !recommendation ||
    !recommendation.recommendations ||
    recommendation.recommendations.length === 0
  ) {
    return null;
  }

  const top = recommendation.recommendations[0];
  const runners = recommendation.recommendations.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-medium text-foreground">
            Best model for this task
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Top recommendation */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-accent">#1</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {top.model_name}
              </span>
              <span className="text-xs text-muted-foreground">
                by {top.creator}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {top.reasoning}
            </p>
          </div>
        </div>

        {/* Runner-ups */}
        {runners.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            {runners.map((r, i) => (
              <div key={r.model_name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{i + 2}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-foreground">
                      {r.model_name}
                    </span>
                    {r.price_per_1m_tokens != null && (
                      <span className="text-xs text-muted-foreground">
                        ${r.price_per_1m_tokens.toFixed(2)}/1M
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attribution */}
        <p className="text-[10px] text-muted-foreground/60 pt-1">
          {AA_ATTRIBUTION}
        </p>
      </div>
    </motion.div>
  );
}
