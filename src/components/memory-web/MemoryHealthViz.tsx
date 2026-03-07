/**
 * MemoryHealthViz
 * Recharts-based memory health visualization with donut chart,
 * budget bars, and stats summary.
 */

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { MemoryWebStats, MemoryBudget } from '@/types/memory';

const TEMP_COLORS: Record<string, string> = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#64748b',
};

const TEMP_LABELS: Record<string, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

interface MemoryHealthVizProps {
  stats: MemoryWebStats | null;
  budget: MemoryBudget | null;
}

export function MemoryHealthViz({ stats, budget }: MemoryHealthVizProps) {
  const chartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.temperature_distribution).map(([key, value]) => ({
      name: TEMP_LABELS[key] || key,
      value,
      color: TEMP_COLORS[key] || '#64748b',
    }));
  }, [stats]);

  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading memory health...
        </div>
      </div>
    );
  }

  const hotPct = budget
    ? Math.round((budget.hot_token_count / budget.hot_max_tokens) * 100)
    : 0;
  const warmPct = budget
    ? Math.round((budget.warm_token_count / budget.warm_max_tokens) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Memory Health
      </h3>

      <div className="flex items-start gap-6">
        {/* Donut Chart */}
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.total_facts}
              </p>
              <p className="text-xs text-muted-foreground">Total Facts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(stats.verified_rate)}%
              </p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.health_score}
              </p>
              <p className="text-xs text-muted-foreground">Health Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.patterns_count}
              </p>
              <p className="text-xs text-muted-foreground">Patterns</p>
            </div>
          </div>

          {/* Temperature legend */}
          <div className="flex items-center gap-4 pt-1">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Bars */}
      {budget && (
        <div className="mt-5 space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Hot Token Budget
              </span>
              <span className="text-xs text-muted-foreground">
                {budget.hot_token_count.toLocaleString()} /{' '}
                {budget.hot_max_tokens.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  hotPct > 90 ? 'bg-red-500' : 'bg-red-500/70'
                )}
                style={{ width: `${Math.min(hotPct, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Warm Token Budget
              </span>
              <span className="text-xs text-muted-foreground">
                {budget.warm_token_count.toLocaleString()} /{' '}
                {budget.warm_max_tokens.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  warmPct > 90 ? 'bg-amber-500' : 'bg-amber-500/70'
                )}
                style={{ width: `${Math.min(warmPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
