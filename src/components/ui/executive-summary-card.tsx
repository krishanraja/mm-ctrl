import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, AlertTriangle, Zap } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  edge: string;
  risk: string;
  nextMove: string;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  edge,
  risk,
  nextMove,
}) => {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Your AI Leadership Edge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Badge variant="default" className="gap-1">
            <Target className="h-3 w-3" />
            Your Competitive Edge
          </Badge>
          <p className="text-sm leading-relaxed">{edge}</p>
        </div>

        <div className="space-y-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Your Biggest Risk
          </Badge>
          <p className="text-sm leading-relaxed">{risk}</p>
        </div>

        <div className="space-y-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Your Next Move (Next 7 Days)
          </Badge>
          <p className="text-sm font-medium leading-relaxed">{nextMove}</p>
        </div>
      </CardContent>
    </Card>
  );
};
