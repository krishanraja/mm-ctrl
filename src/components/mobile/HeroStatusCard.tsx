import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { fadeInProps } from '@/lib/motion';

interface HeroStatusCardProps {
  tier: string;
  trend: 'up' | 'down' | 'stable';
  percentile: number;
  riskLevel: 'low' | 'medium' | 'high';
  alertCount: number;
  actionCount: number;
  onClick?: () => void;
}

const getStatusColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'border-emerald-500/30 bg-emerald-500/5';
    case 'medium':
      return 'border-amber-500/30 bg-amber-500/5';
    case 'high':
      return 'border-red-500/30 bg-red-500/5';
    default:
      return 'border-muted';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({
  tier,
  trend,
  percentile,
  riskLevel,
  alertCount,
  actionCount,
  onClick,
}) => {
  return (
    <motion.div
      {...fadeInProps}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
      >
        <Card
          className={`border rounded-2xl cursor-pointer transition-all ${getStatusColor(riskLevel)} ${
            onClick ? 'hover:scale-[1.01]' : ''
          }`}
          onClick={() => {
            if (onClick) {
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(10);
              }
              onClick();
            }
          }}
        >
        <CardContent className="p-5">
          {/* Top Row: Tier + Trend */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                AI Literacy: {tier}
              </span>
              {getTrendIcon(trend)}
            </div>
            {riskLevel === 'high' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>

          {/* Middle Row: Competitive Position */}
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Top {percentile}% of peers
            </p>
          </div>

          {/* Bottom Row: Summary Counts */}
          <div className="flex items-center gap-4 text-sm">
            {alertCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">
                  {alertCount} alert{alertCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {actionCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {actionCount} action{actionCount !== 1 ? 's' : ''} ready
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
};
