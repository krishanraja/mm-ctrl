import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Zap, TrendingUp, Users, Lock } from 'lucide-react';

interface OrgScenarioCardProps {
  scenarioKey: 'stagnation_loop' | 'shadow_ai_instability' | 'high_velocity_path' | 'culture_capability_mismatch';
  summary: string;
  isLocked?: boolean;
}

const scenarioConfig = {
  stagnation_loop: {
    icon: AlertTriangle,
    label: 'Stagnation Loop',
    color: 'text-destructive',
  },
  shadow_ai_instability: {
    icon: Zap,
    label: 'Shadow AI Instability',
    color: 'text-warning',
  },
  high_velocity_path: {
    icon: TrendingUp,
    label: 'High Velocity Path',
    color: 'text-primary',
  },
  culture_capability_mismatch: {
    icon: Users,
    label: 'Culture-Capability Gap',
    color: 'text-secondary',
  },
};

export const OrgScenarioCard = React.memo<OrgScenarioCardProps>(({ 
  scenarioKey, 
  summary,
  isLocked = false,
}) => {
  const config = scenarioConfig[scenarioKey];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Unlock Full Diagnostic
            </p>
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-primary/10 ${config.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg">{config.label}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OrgScenarioCard.displayName = 'OrgScenarioCard';
