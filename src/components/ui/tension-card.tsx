import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface TensionCardProps {
  tension: {
    dimension_key: string;
    summary_line: string;
    priority_rank: number;
  };
}

const dimensionLabels: Record<string, string> = {
  ai_fluency: 'AI Fluency',
  decision_velocity: 'Decision Speed',
  experimentation_cadence: 'Testing Cadence',
  delegation_augmentation: 'Delegation',
  alignment_communication: 'Team Alignment',
  risk_governance: 'Risk Management',
};

export const TensionCard: React.FC<TensionCardProps> = ({ tension }) => {
  const label = dimensionLabels[tension.dimension_key] || tension.dimension_key;
  
  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                {label}
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {tension.summary_line}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
