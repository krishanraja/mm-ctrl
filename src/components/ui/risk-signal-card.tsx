import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface RiskSignalCardProps {
  signal: {
    risk_key: string;
    level: 'low' | 'medium' | 'high';
    description: string;
    priority_rank: number;
  };
}

const riskLabels: Record<string, string> = {
  shadow_ai: 'Shadow AI',
  skills_gap: 'Skills Gap',
  roi_leakage: 'ROI Leakage',
  decision_friction: 'Decision Friction',
};

const levelColors = {
  low: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  high: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

export const RiskSignalCard: React.FC<RiskSignalCardProps> = ({ signal }) => {
  const label = riskLabels[signal.risk_key] || signal.risk_key;
  
  return (
    <Card className="border-l-4 border-l-orange-500/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {label}
              </Badge>
              <Badge className={`text-xs ${levelColors[signal.level]}`}>
                {signal.level.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {signal.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
