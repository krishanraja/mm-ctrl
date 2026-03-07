import { motion } from 'framer-motion';
import { Flame, Circle, Brain, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MemoryWebStats } from '@/types/memory';

interface Props {
  stats: MemoryWebStats | null;
}

export function MemoryPulseBar({ stats }: Props) {
  if (!stats) {
    return (
      <div className="flex items-center justify-around py-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-16 h-12 rounded-xl bg-foreground/5 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  const items = [
    { icon: Flame, value: stats.temperature_distribution.hot || 0, label: 'hot', color: 'text-red-400' },
    { icon: Circle, value: stats.temperature_distribution.warm || 0, label: 'warm', color: 'text-amber-400' },
    { icon: Brain, value: stats.patterns_count, label: 'patterns', color: 'text-purple-400' },
    { icon: ListChecks, value: stats.decisions_count, label: 'decisions', color: 'text-blue-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-around py-2"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/5">
              <Icon className={cn('h-3.5 w-3.5', item.color)} />
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
