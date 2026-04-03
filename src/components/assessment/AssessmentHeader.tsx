import React from 'react';
import { Button } from '@/components/ui/button';

interface AssessmentHeaderProps {
  onBack?: () => void;
  showBackButton: boolean;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  onBack,
  showBackButton,
}) => {
  return (
    <div className="flex items-center justify-between py-2 sm:py-3 shrink-0">
      <div className="flex items-center gap-3">
        {onBack && showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
        )}
        <img
          src="/mindmaker-favicon.png"
          alt="Mindmaker"
          className="h-6 sm:h-7 w-auto"
        />
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground text-right flex-1 ml-3">
        AI Leadership Benchmark
      </p>
    </div>
  );
};
