import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Target,
} from 'lucide-react';
import { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface ResultsKeyInsightsProps {
  data: AggregatedLeaderResults | null;
  isUnlocked: boolean;
  onShowMissionSelector: () => void;
}

export const ResultsKeyInsights: React.FC<ResultsKeyInsightsProps> = ({
  data,
  isUnlocked,
  onShowMissionSelector,
}) => {
  const primaryTension = data?.tensions?.[0];
  const primaryMove = data?.firstMoves?.[0];

  return (
    <>
      {primaryTension && (
        <Card className="mb-6 shadow-sm border rounded-xl border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">Your #1 Tension</h3>
                  <Badge variant="outline" className="text-xs">Priority Focus</Badge>
                </div>
            <p className="text-muted-foreground leading-relaxed">
              {primaryTension.summary_line}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Next Move - Actionable */}
      {primaryMove && (
        <Card className="mb-6 shadow-sm border rounded-xl border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-emerald-500/10 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">Your Next Move</h3>
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">This Week</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {primaryMove.content}
                </p>
                {isUnlocked && data?.firstMoves && data.firstMoves.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onShowMissionSelector}
                    className="mt-3 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    Commit to a Move
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
