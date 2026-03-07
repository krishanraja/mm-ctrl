import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserPattern, PatternType } from '@/types/memory';

const TYPE_STYLES: Record<PatternType, { label: string; color: string }> = {
  preference: { label: 'Preference', color: 'bg-blue-500/10 text-blue-400' },
  anti_preference: { label: 'Anti-pattern', color: 'bg-red-500/10 text-red-400' },
  behavior: { label: 'Behavior', color: 'bg-emerald-500/10 text-emerald-400' },
  blindspot: { label: 'Blind spot', color: 'bg-amber-500/10 text-amber-400' },
  strength: { label: 'Strength', color: 'bg-purple-500/10 text-purple-400' },
};

interface Props {
  pattern: UserPattern;
  onConfirm?: (id: string) => void;
}

export function PatternInsightCard({ pattern, onConfirm }: Props) {
  const typeStyle = TYPE_STYLES[pattern.pattern_type] || TYPE_STYLES.behavior;
  const confidencePct = Math.round(pattern.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-3 py-3 rounded-xl bg-foreground/5 space-y-2"
    >
      {/* Type badge */}
      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', typeStyle.color)}>
        {typeStyle.label}
      </span>

      {/* Pattern text */}
      <p className="text-sm text-foreground leading-relaxed">{pattern.pattern_text}</p>

      {/* Evidence + confidence */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">
          {pattern.evidence_count} observation{pattern.evidence_count !== 1 ? 's' : ''}
        </span>
        <div className="flex-1 h-1 rounded-full bg-foreground/10 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full',
              confidencePct > 70 ? 'bg-emerald-500' : confidencePct > 40 ? 'bg-amber-500' : 'bg-red-400',
            )}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{confidencePct}%</span>
      </div>

      {/* Confirm button for emerging patterns */}
      {pattern.status === 'emerging' && onConfirm && (
        <button
          onClick={() => onConfirm(pattern.id)}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors pt-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Does this sound right?
        </button>
      )}
    </motion.div>
  );
}
