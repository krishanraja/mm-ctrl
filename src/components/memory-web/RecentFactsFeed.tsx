import { motion } from 'framer-motion';
import { Check, AlertTriangle, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MemoryWebFact, Temperature } from '@/types/memory';

const TEMP_DOT: Record<Temperature, string> = {
  hot: 'bg-red-400',
  warm: 'bg-amber-400',
  cold: 'bg-slate-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface Props {
  facts: MemoryWebFact[];
  maxItems?: number;
}

export function RecentFactsFeed({ facts, maxItems = 5 }: Props) {
  if (facts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center"
      >
        <Mic className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Start speaking to build your memory
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {facts.slice(0, maxItems).map((fact, i) => (
        <motion.div
          key={fact.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-foreground/5"
        >
          {/* Temperature dot */}
          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', TEMP_DOT[fact.temperature])} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-2">{fact.fact_value}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded bg-foreground/5">
                {fact.fact_category}
              </span>
            </div>
          </div>

          {/* Right: verification + time */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {fact.verification_status === 'verified' || fact.verification_status === 'corrected' ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="text-[10px] text-muted-foreground/50">{timeAgo(fact.created_at)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
