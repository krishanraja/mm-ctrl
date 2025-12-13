import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Target, Sparkles, Lightbulb, Users, Zap, LucideIcon } from 'lucide-react';
import mindmakerIcon from '@/assets/mindmaker-icon.png';

interface ProgressPhase {
  label: string;
  description: string;
  icon: LucideIcon;
}

interface ProgressScreenProps {
  progress: number;
  phase: 'analyzing' | 'generating' | 'finalizing';
  title?: string;
  subtitle?: string;
  phases?: ProgressPhase[];
}

// Educational micro-content that rotates during loading
const educationalTips = [
  {
    icon: Lightbulb,
    title: "Did you know?",
    content: "Leaders who use AI prompts tailored to their role save an average of 5-10 hours per week."
  },
  {
    icon: Users,
    title: "Peer Insight",
    content: "Only 12% of executives effectively connect AI initiatives to growth KPIs. Your benchmark will show where you stand."
  },
  {
    icon: Zap,
    title: "Quick Win",
    content: "The most impactful AI adoption starts with one high-value workflow, not company-wide rollouts."
  },
  {
    icon: TrendingUp,
    title: "Growth Signal",
    content: "Teams with aligned AI narratives ship 2.3x faster than those without shared language."
  },
  {
    icon: Brain,
    title: "Leadership Insight",
    content: "AI-fluent leaders spend 40% more time on strategic work and 40% less on operational tasks."
  },
  {
    icon: Target,
    title: "Focus Area",
    content: "Your biggest tension often reveals your biggest opportunity for AI-driven growth."
  }
];

const defaultPhases: Record<string, ProgressPhase> = {
  analyzing: {
    label: 'Analyzing',
    description: 'Mapping your strategic position and AI readiness signals...',
    icon: Brain
  },
  generating: {
    label: 'Generating',
    description: 'Creating personalized insights based on 500+ executive benchmarks...',
    icon: TrendingUp
  },
  finalizing: {
    label: 'Preparing',
    description: 'Building your custom AI toolkit and action plan...',
    icon: Target
  }
};

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ 
  progress, 
  phase,
  title = "Creating Your AI Leadership Insights",
  subtitle,
  phases = Object.values(defaultPhases)
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const currentPhase = defaultPhases[phase];
  const currentTip = educationalTips[tipIndex];
  const TipIcon = currentTip.icon;

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % educationalTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg mx-auto text-center bg-card border shadow-sm rounded-xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <img 
              src={mindmakerIcon} 
              alt="Mindmaker" 
              className="w-12 h-12"
            />
          </div>
          
          {/* Title & Current Phase */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentPhase.description}
            </p>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentPhase.label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          
          {/* Phase Indicators */}
          <div className="flex justify-center gap-6">
            {phases.map((phaseItem, idx) => {
              const Icon = phaseItem.icon;
              const isActive = phaseItem.label === currentPhase.label;
              const isPast = phases.indexOf(currentPhase) > idx;
              return (
                <div key={phaseItem.label} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary/20 text-primary' : 
                    isPast ? 'bg-emerald-500/20 text-emerald-600' : 
                    'bg-secondary text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {phaseItem.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Educational Tip - Rotating */}
          <div className="pt-4 border-t border-border">
            <div className="bg-secondary/30 rounded-lg p-4 transition-all duration-500">
              <div className="flex items-start gap-3 text-left">
                <div className="shrink-0 p-1.5 bg-primary/10 rounded">
                  <TipIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">{currentTip.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentTip.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
