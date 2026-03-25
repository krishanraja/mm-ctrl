import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedbackType } from '@/types/edge';

interface Props {
  targetKey: string;
  type: 'strength' | 'weakness';
  onFeedback: (type: FeedbackType, key: string) => void;
}

export function FeedbackButtons({ targetKey, type, onFeedback }: Props) {
  const confirmType: FeedbackType = type === 'strength' ? 'strength_confirm' : 'weakness_confirm';
  const rejectType: FeedbackType = type === 'strength' ? 'strength_reject' : 'weakness_reject';

  return (
    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
        onClick={(e) => {
          e.stopPropagation();
          onFeedback(confirmType, targetKey);
        }}
        aria-label="Confirm this is accurate"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        onClick={(e) => {
          e.stopPropagation();
          onFeedback(rejectType, targetKey);
        }}
        aria-label="Mark as not accurate"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
