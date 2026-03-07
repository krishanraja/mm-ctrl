/**
 * CategoryChart
 * Recharts horizontal BarChart showing fact count by category.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MemoryWebFact, FactCategory } from '@/types/memory';

const CATEGORY_COLORS: Record<string, string> = {
  identity: '#8b5cf6',
  business: '#3b82f6',
  objective: '#10b981',
  blocker: '#ef4444',
  preference: '#f59e0b',
};

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identity',
  business: 'Business',
  objective: 'Objectives',
  blocker: 'Blockers',
  preference: 'Preferences',
};

interface CategoryChartProps {
  facts: MemoryWebFact[];
}

export function CategoryChart({ facts }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    facts.forEach((fact) => {
      counts[fact.fact_category] = (counts[fact.fact_category] || 0) + 1;
    });

    return Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      category: key,
      label,
      count: counts[key] || 0,
      fill: CATEGORY_COLORS[key] || '#64748b',
    }));
  }, [facts]);

  if (facts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Category Distribution
        </h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          No facts yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Category Distribution
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
            barCategoryGap="20%"
          >
            <XAxis
              type="number"
              hide
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: 'hsl(var(--muted-foreground))',
              }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value} facts`, 'Count']}
              cursor={{ fill: 'hsl(var(--secondary))' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
