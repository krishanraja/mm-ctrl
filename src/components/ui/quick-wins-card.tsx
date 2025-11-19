import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, TrendingUp } from 'lucide-react';

interface QuickWin {
  title: string;
  impact: string;
  timeToValue: string;
}

interface QuickWinsCardProps {
  wins: QuickWin[];
}

export const QuickWinsCard = React.memo<QuickWinsCardProps>(({ wins }) => {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg">Your Immediate Quick Wins</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Start here to build momentum</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {wins.map((win, index) => (
          <div 
            key={index}
            className="p-4 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-semibold text-sm flex-1">{win.title}</h4>
              <Badge variant="outline" className="gap-1 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {win.timeToValue}
              </Badge>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{win.impact}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

QuickWinsCard.displayName = 'QuickWinsCard';
