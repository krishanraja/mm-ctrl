import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ArrowRight } from 'lucide-react';
import { shortDimensionLabels, leverInsights } from './types';
import type { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface BiggestLeverCardProps {
  results: AggregatedLeaderResults;
}

export const BiggestLeverCard: React.FC<BiggestLeverCardProps> = ({ results }) => {
  const sortedDims = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
  const lowestDim = sortedDims[0];
  const label = shortDimensionLabels[lowestDim.dimension_key] || lowestDim.dimension_key;
  const current = Math.round(lowestDim.score_numeric);
  const target = Math.min(100, current + 20);
  const impact = Math.round((target - current) * 0.6);

  const insight = leverInsights[lowestDim.dimension_key as keyof typeof leverInsights];

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Your Single Biggest Lever: {label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-foreground">{current}</span>
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
          <span className="text-4xl font-bold text-primary">{target}</span>
          <span className="text-sm text-muted-foreground">= +{impact} overall points</span>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Why this matters:</span> {insight.why}</p>
          <p><span className="font-semibold">Your specific action:</span> {insight.action}</p>
          <p><span className="font-semibold">Expected outcome:</span> {insight.outcome}</p>
        </div>
      </CardContent>
    </Card>
  );
};
