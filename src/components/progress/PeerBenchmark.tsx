import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BarChart3 } from 'lucide-react';
import { useProgressSnapshots } from '@/hooks/useProgress';
import { motion } from 'framer-motion';

// Anonymous peer improvement snippets
const PEER_SNIPPETS = [
  {
    text: 'A leader in tech improved their delegation score by 18 points in 6 weeks.',
    dimension: 'delegation',
  },
  {
    text: 'A healthcare exec moved from AI-Aware to AI-Confident in 4 weeks.',
    dimension: 'overall',
  },
  {
    text: 'Average strategic vision improvement after 3 check-ins: +12 points.',
    dimension: 'strategic_vision',
  },
  {
    text: 'Leaders who complete missions within 2 weeks see 2.3x faster growth.',
    dimension: 'general',
  },
];

const DIMENSION_LABELS: Record<string, string> = {
  strategic_vision: 'Strategic Vision',
  experimentation: 'Experimentation',
  delegation: 'Delegation',
  data_quality: 'Data Quality',
  team_capability: 'Team Capability',
  governance: 'Governance',
};

export function PeerBenchmark() {
  const { snapshots } = useProgressSnapshots();

  // Calculate percentile rankings (simplified - in production this would come from the API)
  const latestScores =
    snapshots.length > 0
      ? snapshots[snapshots.length - 1].dimension_scores || {}
      : {};

  const dimensions = Object.entries(latestScores);

  if (dimensions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Peer Comparison Header */}
      <Card className="border rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Peer Benchmarking
            </h3>
          </div>

          {/* Dimension percentiles */}
          <div className="space-y-3">
            {dimensions.map(([dim, score]) => {
              // Simplified percentile calculation (real data would come from API)
              const percentile = Math.min(99, Math.max(1, Math.round(score * 0.9 + 5)));
              const isTop = percentile >= 75;
              return (
                <div key={dim} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {DIMENSION_LABELS[dim] || dim.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {Math.round(score)}/100
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        isTop
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-secondary text-muted-foreground'
                      }
                    >
                      Top {100 - percentile}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Peer Snippets */}
      <Card className="border rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              How others are progressing
            </h4>
          </div>
          <div className="space-y-2">
            {PEER_SNIPPETS.slice(0, 3).map((snippet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30"
              >
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{snippet.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
