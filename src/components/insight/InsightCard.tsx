/**
 * InsightCard Component
 * 
 * Insight display card - personalized, specific insights.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target } from 'lucide-react';

interface InsightCardProps {
  insight: string;
  action: string;
  why?: string;
}

export function InsightCard({ insight, action, why }: InsightCardProps) {
  return (
    <div className="space-y-6">
      {/* Insight */}
      <Card className="border-accent/30 bg-accent/5 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Lightbulb className="h-6 w-6 text-accent" />
            Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base text-foreground leading-relaxed">{insight}</p>
        </CardContent>
      </Card>

      {/* Action */}
      <Card className="border-accent/30 bg-accent/5 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Target className="h-6 w-6 text-accent" />
            This Week's Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base font-medium text-foreground leading-relaxed">{action}</p>
          {why && <p className="text-sm text-muted-foreground leading-relaxed">{why}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
