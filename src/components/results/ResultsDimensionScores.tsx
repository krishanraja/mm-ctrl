import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface DimensionScore {
  dimension_key?: string;
  score_numeric: number;
}

interface ResultsDimensionScoresProps {
  dimensionScores: DimensionScore[];
}

export const ResultsDimensionScores: React.FC<ResultsDimensionScoresProps> = ({ dimensionScores }) => {
  if (!dimensionScores || dimensionScores.length === 0) return null;

  return (
    <Card className="mb-6 shadow-sm border rounded-xl">
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Your Dimension Scores
        </h3>
        <div className="space-y-3">
          {dimensionScores.slice(0, 6).map((dim, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">
                  {dim.dimension_key?.replace(/_/g, ' ') || 'Dimension'}
                </span>
                <span className="font-medium text-foreground">{dim.score_numeric}/100</span>
              </div>
              <Progress value={dim.score_numeric} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
