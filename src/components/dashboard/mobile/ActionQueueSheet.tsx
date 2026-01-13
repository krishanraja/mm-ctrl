/**
 * ActionQueueSheet Component
 * 
 * Action queue content for bottom sheet.
 */

import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import type { WeeklyAction } from '@/core/types';

interface ActionQueueSheetProps {
  weeklyAction: WeeklyAction | null;
  onNavigate: (path: string) => void;
}

export function ActionQueueSheet({ weeklyAction, onNavigate }: ActionQueueSheetProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Focus</h3>
        {weeklyAction ? (
          <div className="space-y-4">
            <div className="p-6 bg-accent/10 rounded-xl border border-accent/30">
              <div className="flex items-start gap-3">
                <Circle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
              <p className="text-base font-medium text-foreground mb-3 leading-relaxed">{weeklyAction.action_text}</p>
              {weeklyAction.why_text && (
                <p className="text-sm text-muted-foreground leading-relaxed">{weeklyAction.why_text}</p>
              )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('/voice')}
              className="w-full"
            >
              Record Progress
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No actions this week</p>
          </div>
        )}
      </div>
    </div>
  );
}
