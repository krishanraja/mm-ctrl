import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { useProgressSnapshots } from '@/hooks/useProgress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const DIMENSION_COLORS: Record<string, string> = {
  strategic_vision: '#10b981',
  experimentation: '#3b82f6',
  delegation: '#8b5cf6',
  data_quality: '#f59e0b',
  team_capability: '#ef4444',
  governance: '#06b6d4',
};

const DIMENSION_LABELS: Record<string, string> = {
  strategic_vision: 'Strategic Vision',
  experimentation: 'Experimentation',
  delegation: 'Delegation',
  data_quality: 'Data Quality',
  team_capability: 'Team Capability',
  governance: 'Governance',
};

export function ProgressChart() {
  const { snapshots, biggestImprovement, loading } = useProgressSnapshots();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-secondary rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // Transform snapshots into chart data
  const chartData = snapshots.map((snap) => {
    const scores = snap.dimension_scores || {};
    return {
      date: snap.created_at
        ? new Date(snap.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '',
      ...scores,
    };
  });

  // Get latest scores
  const latestScores = snapshots.length > 0
    ? snapshots[snapshots.length - 1].dimension_scores || {}
    : {};

  const dimensions = Object.keys(DIMENSION_LABELS);

  // Empty state
  if (snapshots.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="border rounded-2xl">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              No progress data yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Complete your first assessment to start tracking your leadership
              dimensions over time.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Chart */}
      <Card className="border rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Dimension Progress
            </h3>
          </div>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value: string) =>
                    DIMENSION_LABELS[value] || value.replace(/_/g, ' ')
                  }
                />
                {dimensions.map((dim) => (
                  <Line
                    key={dim}
                    type="monotone"
                    dataKey={dim}
                    stroke={DIMENSION_COLORS[dim] || '#888'}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Complete another assessment to see your progress trend
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {dimensions.map((dim) => {
          const score = latestScores[dim];
          if (score == null) return null;
          return (
            <Card key={dim} className="border rounded-xl">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {DIMENSION_LABELS[dim] || dim.replace(/_/g, ' ')}
                </p>
                <div className="flex items-end gap-1">
                  <span
                    className="text-xl font-bold"
                    style={{ color: DIMENSION_COLORS[dim] }}
                  >
                    {Math.round(score)}
                  </span>
                  <span className="text-xs text-muted-foreground mb-0.5">
                    /100
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Biggest Improvement */}
      {biggestImprovement && (
        <Card className="border rounded-2xl border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-2 bg-amber-500/10 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Biggest Improvement
                  </h4>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 border-amber-500/30"
                  >
                    +{biggestImprovement.delta} pts
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {DIMENSION_LABELS[biggestImprovement.dimension] ||
                    biggestImprovement.dimension.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
