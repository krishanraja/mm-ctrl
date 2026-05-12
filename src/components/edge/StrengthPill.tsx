import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SHARPEN_CAPABILITY_META } from '@/types/edge';
import type { EdgeStrength, FeedbackType } from '@/types/edge';
import { FeedbackButtons } from './FeedbackButtons';

interface Props {
  strength: EdgeStrength;
  onFeedback: (type: FeedbackType, key: string) => void;
  isPaid: boolean;
  onAction: (capability: string, targetKey: string) => void;
}

export function StrengthPill({ strength, onFeedback, isPaid, onAction }: Props) {
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
          'border border-teal-500/30 bg-teal-500/15 hover:bg-teal-500/25',
          'dark:border-teal-400/30 dark:bg-teal-400/15 dark:hover:bg-teal-400/25',
          expanded && 'rounded-b-none border-b-transparent dark:border-b-transparent',
        )}
      >
        <span className="text-sm font-medium text-foreground truncate">{strength.label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <FeedbackButtons targetKey={strength.key} type="strength" onFeedback={onFeedback} />
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
            className="overflow-hidden border-x border-b border-teal-500/30 dark:border-teal-400/30 bg-teal-500/8 dark:bg-teal-400/8 rounded-b-xl"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Summary */}
              <p className="text-xs text-muted-foreground leading-relaxed">{strength.summary}</p>

              {/* Evidence tags */}
              <div className="flex flex-wrap gap-1.5">
                {strength.evidence.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-teal-500/5 border-teal-500/20 text-teal-600 dark:text-teal-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Capability actions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {strength.capabilities.map((cap) => {
                  const meta = SHARPEN_CAPABILITY_META[cap];
                  if (!meta) return null;
                  const isFree = cap === 'lean_into';
                  const isLocked = !isFree && !isPaid;
                  return (
                    <Button
                      key={cap}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-7 text-xs border-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 gap-1.5',
                        isFree && !isPaid && 'border-accent/30 text-accent',
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(cap, strength.key);
                      }}
                      disabled={isLocked}
                    >
                      {isLocked && <Lock className="h-3 w-3" />}
                      {meta.label}
                      {isFree && !isPaid && (
                        <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                          FREE
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback('strength_reject', strength.key);
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
