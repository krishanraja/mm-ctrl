/**
 * PHASE 2: Enhanced Progress Component with Phase Tracking
 * Shows real-time generation progress with phase names
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { GenerationPhase } from '@/hooks/useGenerationProgress';
import { cn } from '@/lib/utils';

interface EnhancedProgressProps {
  phases: GenerationPhase[];
  progressPercentage: number;
  currentPhase?: string;
  hasErrors: boolean;
  isComplete: boolean;
}

export const EnhancedProgress: React.FC<EnhancedProgressProps> = ({
  phases,
  progressPercentage,
  currentPhase,
  hasErrors,
  isComplete
}) => {
  const getStatusIcon = (status: GenerationPhase['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {isComplete ? 'Complete!' : currentPhase || 'Initializing...'}
              </span>
              <span className="text-muted-foreground">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Phase List */}
          <div className="space-y-2">
            {phases.map((phase, index) => (
              <div
                key={phase.key}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  phase.status === 'in-progress' && 'bg-primary/5',
                  phase.status === 'failed' && 'bg-destructive/5'
                )}
              >
                {getStatusIcon(phase.status)}
                <div className="flex-1">
                  <p className={cn(
                    'text-sm',
                    phase.status === 'complete' && 'text-muted-foreground',
                    phase.status === 'in-progress' && 'font-medium',
                    phase.status === 'failed' && 'text-destructive'
                  )}>
                    {phase.name}
                  </p>
                  {phase.error && (
                    <p className="text-xs text-destructive mt-1">
                      {phase.error}
                    </p>
                  )}
                </div>
                {phase.duration && (
                  <span className="text-xs text-muted-foreground">
                    {phase.duration}s
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Error Summary */}
          {hasErrors && !isComplete && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Some phases encountered issues
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Don't worry - we'll retry automatically. Your results are being generated.
                </p>
              </div>
            </div>
          )}

          {/* Timeout Warning */}
          {!isComplete && progressPercentage < 50 && (
            <p className="text-xs text-muted-foreground text-center">
              This usually takes 30-60 seconds. Hang tight!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
