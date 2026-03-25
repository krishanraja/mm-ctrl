import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COVER_CAPABILITY_META } from '@/types/edge';
import type { EdgeWeakness, FeedbackType } from '@/types/edge';
import { FeedbackButtons } from './FeedbackButtons';

interface Props {
  weakness: EdgeWeakness;
  onFeedback: (type: FeedbackType, key: string) => void;
  isPaid: boolean;
  onAction: (capability: string, targetKey: string) => void;
}

export function GapPill({ weakness, onFeedback, isPaid, onAction }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="group rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Collapsed pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors',
          'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
          'hover:from-amber-500/15 hover:to-orange-500/15',
          expanded && 'rounded-b-none',
        )}
      >
        <span className="text-sm font-medium text-foreground truncate">{weakness.label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <FeedbackButtons targetKey={weakness.key} type="weakness" onFeedback={onFeedback} />
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden bg-gradient-to-b from-amber-500/5 to-transparent"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Summary */}
              <p className="text-xs text-muted-foreground leading-relaxed">{weakness.summary}</p>

              {/* Evidence tags */}
              <div className="flex flex-wrap gap-1.5">
                {weakness.evidence.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Capability action buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {weakness.capabilities.map((cap) => {
                  const meta = COVER_CAPABILITY_META[cap];
                  if (!meta) return null;
                  return (
                    <Button
                      key={cap}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(cap, weakness.key);
                      }}
                    >
                      {!isPaid && <Lock className="h-3 w-3" />}
                      {meta.label}
                    </Button>
                  );
                })}
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback('weakness_reject', weakness.key);
                }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 transition-colors pt-1"
              >
                <X className="h-3 w-3" />
                Not accurate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
