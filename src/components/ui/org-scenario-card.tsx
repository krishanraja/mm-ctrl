import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

interface OrgScenarioCardProps {
  scenario: {
    scenario_key: string;
    summary: string;
    priority_rank: number;
  };
}

const scenarioLabels: Record<string, string> = {
  stagnation_loop: 'Stagnation Loop',
  shadow_ai_instability: 'Shadow AI Risk',
  high_velocity_path: 'High Velocity Path',
  culture_capability_mismatch: 'Culture-Capability Gap',
};

export const OrgScenarioCard: React.FC<OrgScenarioCardProps> = ({ scenario }) => {
  const label = scenarioLabels[scenario.scenario_key] || scenario.scenario_key;
  
  return (
    <Card className="border-l-4 border-l-blue-500/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Target className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <Badge variant="secondary" className="text-xs">
                {label}
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {scenario.summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
