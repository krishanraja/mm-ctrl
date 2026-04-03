import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shortDimensionLabels } from './types';
import type { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface ExecutiveSummaryProps {
  results: AggregatedLeaderResults;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ results }) => {
  const sortedDims = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
  const lowestDim = sortedDims[0];
  const highestDim = sortedDims[sortedDims.length - 1];
  const lowestLabel = shortDimensionLabels[lowestDim.dimension_key] || lowestDim.dimension_key;
  const highestLabel = shortDimensionLabels[highestDim.dimension_key] || highestDim.dimension_key;
  const gap = Math.round(highestDim.score_numeric - lowestDim.score_numeric);

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle>What Your {results.benchmarkScore}/100 Score Means</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">You're {results.benchmarkTier === 'AI-Leading' ? 'in the top 15%' : results.benchmarkTier === 'AI-Advancing' ? 'in the upper-middle 25%' : results.benchmarkTier === 'AI-Aware' ? 'in the middle 40%' : 'building your foundation'} of leaders.</span>{' '}
          {results.benchmarkScore >= 70 ? 'You have strong AI adoption muscle and are positioned to scale.' : results.benchmarkScore >= 50 ? 'Solid foundation, but missing the AI leverage that top 20% executives have mastered.' : 'You understand AI\'s potential but haven\'t built systematic adoption muscle yet.'}
        </p>
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">The Gap:</span> Your scores show strong {highestLabel} ({Math.round(highestDim.score_numeric)}/100) but weaker {lowestLabel} ({Math.round(lowestDim.score_numeric)}/100).
          This {gap}-point gap is typical of leaders who understand AI but haven't systematized execution.
        </p>
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">Path Forward:</span> Focus on {lowestLabel} first. Improving from {Math.round(lowestDim.score_numeric)} to {Math.min(100, Math.round(lowestDim.score_numeric) + 15)} will lift your overall score by 8-12 points and unlock compound benefits in other areas.
        </p>
      </CardContent>
    </Card>
  );
};
