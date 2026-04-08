/**
 * BenchmarkInsightCard
 *
 * Displays a price-performance frontier chart and recommendations
 * based on live Artificial Analysis benchmark data.
 * Shown below the AI Readiness Score in the assessment results.
 */

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AABenchmarkEnrichment } from "@/types/artificial-analysis";
import { AA_ATTRIBUTION } from "@/types/artificial-analysis";

interface BenchmarkInsightCardProps {
  enrichment: AABenchmarkEnrichment;
}

interface ChartPoint {
  name: string;
  x: number;
  y: number;
  isUserTool: boolean;
}

export function BenchmarkInsightCard({ enrichment }: BenchmarkInsightCardProps) {
  if (!enrichment || enrichment.frontier_models.length === 0) {
    return null;
  }

  // Build chart data: x = intelligence score, y = cost per 1M tokens
  const userToolNames = new Set(
    enrichment.detected_tools
      .filter((t) => t.intelligence_score != null)
      .map((t) => t.name.toLowerCase().trim())
  );

  const chartData: ChartPoint[] = enrichment.frontier_models
    .filter((m) => m.price_per_1m_tokens != null && m.price_per_1m_tokens > 0)
    .map((m) => ({
      name: m.name,
      x: m.intelligence_score,
      y: m.price_per_1m_tokens!,
      isUserTool: userToolNames.size > 0 &&
        [...userToolNames].some((n) => m.name.toLowerCase().includes(n)),
    }));

  const userPoints = chartData.filter((p) => p.isUserTool);
  const otherPoints = chartData.filter((p) => !p.isUserTool);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <CardTitle className="text-base">AI Model Landscape</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Live price vs. intelligence benchmarks
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scatter chart */}
          {chartData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name="Intelligence"
                    tick={{ fontSize: 10 }}
                    label={{
                      value: "Intelligence Score",
                      position: "bottom",
                      offset: 0,
                      style: { fontSize: 10, fill: "#888" },
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    name="Cost"
                    scale="log"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload as ChartPoint;
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md">
                          <p className="text-xs font-medium">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Intelligence: {d.x} | ${d.y.toFixed(2)}/1M tokens
                          </p>
                        </div>
                      );
                    }}
                  />
                  {/* Other models */}
                  <Scatter
                    data={otherPoints}
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.4}
                    r={4}
                  />
                  {/* User's tools highlighted */}
                  {userPoints.length > 0 && (
                    <Scatter
                      data={userPoints}
                      fill="hsl(var(--accent))"
                      fillOpacity={0.9}
                      r={6}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recommendations */}
          {enrichment.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Insights</p>
              {enrichment.recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                  {rec}
                </p>
              ))}
            </div>
          )}

          {/* Gap analysis */}
          {enrichment.gap_analysis && (
            <p className="text-xs text-muted-foreground/80 italic">
              {enrichment.gap_analysis}
            </p>
          )}

          {/* Attribution */}
          <p className="text-[10px] text-muted-foreground/60">{AA_ATTRIBUTION}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
