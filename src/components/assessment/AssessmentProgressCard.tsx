import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain } from 'lucide-react';

interface ProgressData {
  currentQuestion: number;
  completedAnswers: number;
  progressPercentage: number;
  phase: string;
  isComplete: boolean;
  estimatedTimeRemaining: number;
}

interface AssessmentProgressCardProps {
  progressData: ProgressData;
  totalQuestions: number;
}

export const AssessmentProgressCard: React.FC<AssessmentProgressCardProps> = ({
  progressData,
  totalQuestions,
}) => {
  return (
    <Card className="mb-2 sm:mb-3 shadow-sm border rounded-xl shrink-0">
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground">Benchmark Progress</h2>
            {progressData.currentQuestion > 1 && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 px-1.5 py-0 text-[10px]">
                <Brain className="h-2.5 w-2.5 animate-pulse" />
                Learning
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 px-2 py-0.5 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{progressData.currentQuestion}/{totalQuestions}</span>
          </Badge>
        </div>

        <Progress value={progressData.progressPercentage} className="h-1.5 mb-1.5" />

        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
          <span>Phase: {progressData.phase}</span>
          <span>
            {progressData.isComplete || progressData.estimatedTimeRemaining === 0
              ? 'Almost done'
              : `${Math.round(progressData.estimatedTimeRemaining * 10) / 10} min remaining`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
