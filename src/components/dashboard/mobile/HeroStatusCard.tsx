/**
 * HeroStatusCard Component
 * 
 * Hero status card showing tier, percentile, and risk level.
 */

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface HeroStatusCardProps {
  tier: string;
  trend: 'up' | 'down' | 'stable';
  percentile: number;
  riskLevel: 'low' | 'medium' | 'high';
  alertCount: number;
  actionCount: number;
  onClick?: () => void;
}

export function HeroStatusCard({
  tier,
  trend,
  percentile,
  riskLevel,
  alertCount,
  actionCount,
  onClick,
}: HeroStatusCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const riskColors = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  };

  return (
    <Card
      onClick={onClick}
      className="p-8 cursor-pointer hover:bg-muted/30 transition-all duration-200 rounded-2xl border-accent/20 bg-accent/5"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Leadership Tier</h3>
          <p className="text-3xl font-bold text-foreground">{tier}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground mb-2">Percentile</p>
          <p className="text-3xl font-bold text-foreground">{percentile}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <div className="flex items-center gap-3">
          <TrendIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-base text-muted-foreground capitalize">{trend}</span>
        </div>
        <div className="flex items-center gap-6">
          {alertCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${riskColors[riskLevel]}`} />
              <span className="text-base text-muted-foreground">{alertCount}</span>
            </div>
          )}
          {actionCount > 0 && (
            <div className="text-base text-muted-foreground">{actionCount} action</div>
          )}
        </div>
      </div>
    </Card>
  );
}
