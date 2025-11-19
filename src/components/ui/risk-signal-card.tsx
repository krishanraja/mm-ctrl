import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, GraduationCap, DollarSign, Clock, Lock } from 'lucide-react';

interface RiskSignalCardProps {
  riskKey: 'shadow_ai' | 'skills_gap' | 'roi_leakage' | 'decision_friction';
  level: 'low' | 'medium' | 'high';
  description: string;
  isLocked?: boolean;
}

const riskConfig = {
  shadow_ai: {
    icon: Shield,
    label: 'Shadow AI',
    color: 'text-primary',
  },
  skills_gap: {
    icon: GraduationCap,
    label: 'Skills Gap',
    color: 'text-primary',
  },
  roi_leakage: {
    icon: DollarSign,
    label: 'ROI Leakage',
    color: 'text-primary',
  },
  decision_friction: {
    icon: Clock,
    label: 'Decision Friction',
    color: 'text-primary',
  },
};

const levelConfig = {
  low: {
    badge: 'secondary',
    label: 'Low Risk',
  },
  medium: {
    badge: 'default',
    label: 'Medium Risk',
  },
  high: {
    badge: 'destructive',
    label: 'High Risk',
  },
};

export const RiskSignalCard = React.memo<RiskSignalCardProps>(({ 
  riskKey, 
  level, 
  description,
  isLocked = false,
}) => {
  const config = riskConfig[riskKey];
  const Icon = config.icon;
  const levelInfo = levelConfig[level];

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
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-lg">{config.label}</h3>
              <Badge variant={levelInfo.badge as any}>
                {levelInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

RiskSignalCard.displayName = 'RiskSignalCard';
