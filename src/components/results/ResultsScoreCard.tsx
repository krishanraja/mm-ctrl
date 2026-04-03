import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

// Dynamic gradient based on tier and score
const getScoreCardGradient = (tier: string, score: number) => {
  const tierLower = tier?.toLowerCase() || '';
  if (score >= 80 || tierLower.includes('orchestrator') || tierLower.includes('leading')) {
    return 'from-emerald-500/20 via-emerald-400/10 to-transparent';
  }
  if (score >= 60 || tierLower.includes('confident') || tierLower.includes('advancing')) {
    return 'from-blue-500/20 via-blue-400/10 to-transparent';
  }
  if (score >= 40 || tierLower.includes('aware') || tierLower.includes('establishing')) {
    return 'from-amber-500/20 via-amber-400/10 to-transparent';
  }
  return 'from-slate-500/20 via-slate-400/10 to-transparent';
};

// Glow color based on tier
const getScoreGlowColor = (tier: string, score: number) => {
  const tierLower = tier?.toLowerCase() || '';
  if (score >= 80 || tierLower.includes('orchestrator') || tierLower.includes('leading')) {
    return 'text-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]';
  }
  if (score >= 60 || tierLower.includes('confident') || tierLower.includes('advancing')) {
    return 'text-blue-600 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]';
  }
  if (score >= 40 || tierLower.includes('aware') || tierLower.includes('establishing')) {
    return 'text-amber-600 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]';
  }
  return 'text-foreground';
};

export const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'leading':
    case 'ai-orchestrator':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'advancing':
    case 'ai-confident':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'establishing':
    case 'ai-aware':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'emerging':
    case 'ai-emerging':
      return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
    default: return 'bg-primary/10 text-primary border-primary/30';
  }
};

export const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'high': return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
  }
};

interface ResultsScoreCardProps {
  loading: boolean;
  data: AggregatedLeaderResults | null;
}

export const ResultsScoreCard: React.FC<ResultsScoreCardProps> = ({ loading, data }) => {
  return (
    <Card className="mb-4 sm:mb-6 shadow-lg border rounded-xl overflow-hidden animate-fade-in">
      <div className={`bg-gradient-to-br ${getScoreCardGradient(data?.benchmarkTier || '', data?.benchmarkScore || 0)} p-4 sm:p-6`}>
        {/* Title - Left Aligned */}
        <div className="flex flex-col items-start mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            AI Leadership Benchmark
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your personalized leadership insights</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
          <div className="text-center sm:text-left">
            {loading || !data?.benchmarkScore || data.benchmarkScore === 0 ? (
              <>
                <Skeleton className="h-12 sm:h-16 w-32 sm:w-40 mb-2" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-64 mt-1" />
              </>
            ) : (
              <>
                <div
                  className={`text-4xl sm:text-5xl font-bold mb-1 sm:mb-2 transition-all duration-500 ${getScoreGlowColor(data?.benchmarkTier || '', data?.benchmarkScore || 0)}`}
                  style={{ animationDelay: '0.2s' }}
                >
                  {data.benchmarkScore}
                  <span className="text-lg sm:text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge className={`${getTierColor(data?.benchmarkTier || '')} px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm mb-2`}>
                  {data.benchmarkTier} Tier
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Your AI leadership capability score based on 6 dimensions: strategic vision, experimentation, delegation, data quality, team capability, and governance.
                </p>
              </>
            )}
          </div>

          <div className="flex-1 space-y-1 sm:space-y-2">
            {loading || !data?.benchmarkScore || data.benchmarkScore === 0 ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">vs 500+ executives</span>
                  <span className="font-medium text-foreground">Top {Math.max(1, 100 - data.benchmarkScore)}%</span>
                </div>
                <Progress value={data.benchmarkScore} className="h-1.5 sm:h-2" />
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
