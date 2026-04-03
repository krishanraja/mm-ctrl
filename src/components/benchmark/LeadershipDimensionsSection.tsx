import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TensionBadge } from '@/components/ui/tension-badge';
import { dimensionLabels, shortDimensionLabels } from './types';
import { isContentLocked, type AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface LeadershipDimensionsSectionProps {
  results: AggregatedLeaderResults;
}

export const LeadershipDimensionsSection: React.FC<LeadershipDimensionsSectionProps> = ({ results }) => {
  const sorted = [...results.dimensionScores].sort((a, b) => b.score_numeric - a.score_numeric);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const strongLabel = shortDimensionLabels[strongest.dimension_key] || strongest.dimension_key;
  const weakLabel = shortDimensionLabels[weakest.dimension_key] || weakest.dimension_key;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Leadership Dimensions</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Your pattern: Strong {strongLabel} ({Math.round(strongest.score_numeric)}/100) but weaker {weakLabel} ({Math.round(weakest.score_numeric)}/100).
          This gap creates tension, and {strongest.score_numeric > 70 ? 'you envision possibilities but struggle to execute systematically' : 'you have foundation but lack strategic integration'}.
          Strengthening {weakLabel} will amplify your existing strength in {strongLabel}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {results.dimensionScores.map((dim, index) => {
          const tension = results.tensions.find(t => t.dimension_key === dim.dimension_key);
          const isLocked = tension && isContentLocked(results.hasFullDiagnostic, 'tension', results.tensions.indexOf(tension));

          return (
            <Card key={dim.dimension_key}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{dimensionLabels[dim.dimension_key]}</h4>
                  {tension && (
                    <TensionBadge
                      summaryLine={tension.summary_line}
                      isLocked={isLocked}
                    />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{Math.round(dim.score_numeric)}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={Math.round(dim.score_numeric)} className="h-2" />
                <Badge variant="outline" className="text-xs">
                  {dim.dimension_tier}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
