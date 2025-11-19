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
            <Lock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground font-medium px-4">
              Unlock Full Diagnostic
            </p>
          </div>
        </div>
      )}
      
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className={`p-2 sm:p-3 rounded-lg bg-primary/10 ${config.color} flex-shrink-0`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1 space-y-2 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-base sm:text-lg break-words">{config.label}</h3>
              <Badge variant={levelInfo.badge as any} className="self-start sm:self-auto whitespace-nowrap">
                {levelInfo.label}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

RiskSignalCard.displayName = 'RiskSignalCard';
