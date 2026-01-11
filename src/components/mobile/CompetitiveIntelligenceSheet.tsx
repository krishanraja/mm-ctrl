import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompetitiveIntelligenceSheetProps {
  baselineData: any;
}

export const CompetitiveIntelligenceSheet: React.FC<CompetitiveIntelligenceSheetProps> = ({
  baselineData,
}) => {
  const [currentTrendIndex, setCurrentTrendIndex] = useState(0);

  // Mock competitive intelligence data - TODO: Replace with real data
  const marketPosition = {
    overall: 75,
    percentile: 25,
    dimensions: [
      { name: 'Strategic Vision', score: 80, peerAvg: 65, trend: 'up' },
      { name: 'Experimentation', score: 60, peerAvg: 70, trend: 'down' },
      { name: 'Delegation', score: 70, peerAvg: 68, trend: 'stable' },
      { name: 'Data Quality', score: 75, peerAvg: 72, trend: 'up' },
    ],
  };

  const trends = [
    {
      id: 'agent-workflows',
      title: 'Agent Workflows Becoming Standard',
      description: '60% of leaders in your industry are implementing AI agent workflows',
      impact: 'high',
      timeframe: '3-6 months',
    },
    {
      id: 'governance-focus',
      title: 'Governance Focus Increasing',
      description: 'Teams are prioritizing AI governance frameworks',
      impact: 'medium',
      timeframe: '6-12 months',
    },
    {
      id: 'productivity-gains',
      title: 'Productivity Gains Realized',
      description: 'Early adopters seeing 20-30% productivity improvements',
      impact: 'high',
      timeframe: 'Now',
    },
  ];

  const threats = [
    {
      id: 'competitor-advantage',
      title: 'Competitive Advantage Gap',
      description: 'Top performers are 15 points ahead on Experimentation',
      severity: 'high',
    },
    {
      id: 'velocity-mismatch',
      title: 'Industry Moving Faster',
      description: 'Your industry is adapting 2X faster than your current pace',
      severity: 'medium',
    },
  ];

  const opportunities = [
    {
      id: 'strategic-vision',
      title: 'Strategic Vision Strength',
      description: 'You lead peers in Strategic Vision - leverage this advantage',
      impact: 'high',
    },
    {
      id: 'data-quality',
      title: 'Data Quality Opportunity',
      description: 'Strong data foundation enables advanced AI use cases',
      impact: 'medium',
    },
  ];

  const nextTrend = () => {
    setCurrentTrendIndex((prev) => (prev + 1) % trends.length);
  };

  const prevTrend = () => {
    setCurrentTrendIndex((prev) => (prev - 1 + trends.length) % trends.length);
  };

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Market Position */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Market Position</h3>
        <Card className="border rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Position</p>
                <p className="text-3xl font-bold text-foreground">Top {marketPosition.percentile}%</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {marketPosition.overall}/100
              </Badge>
            </div>

            {/* Dimension Comparison */}
            <div className="space-y-3 mt-4">
              {marketPosition.dimensions.map((dim) => (
                <div key={dim.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{dim.name}</span>
                    <div className="flex items-center gap-2">
                      {dim.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                      {dim.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                      <span className="text-sm font-medium text-foreground">{dim.score}</span>
                      <span className="text-xs text-muted-foreground">vs {dim.peerAvg} avg</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground/30 transition-all"
                        style={{ width: `${dim.peerAvg}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Radar */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Trend Radar</h3>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrendIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {trends[currentTrendIndex].title}
                        </h4>
                        <Badge
                          variant={
                            trends[currentTrendIndex].impact === 'high' ? 'destructive' : 'default'
                          }
                          className="text-xs"
                        >
                          {trends[currentTrendIndex].impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {trends[currentTrendIndex].description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Timeframe: {trends[currentTrendIndex].timeframe}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Trend Navigation */}
          {trends.length > 1 && (
            <div className="flex items-center justify-between mt-3">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTrend}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1.5">
                {trends.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentTrendIndex
                        ? 'w-6 bg-primary'
                        : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={nextTrend}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Threats */}
      {threats.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Threats
          </h3>
          <div className="space-y-2">
            {threats.map((threat) => (
              <Card
                key={threat.id}
                className={`border rounded-xl ${
                  threat.severity === 'high'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{threat.title}</h4>
                      <p className="text-sm text-muted-foreground">{threat.description}</p>
                    </div>
                    <Badge
                      variant={threat.severity === 'high' ? 'destructive' : 'default'}
                      className="shrink-0"
                    >
                      {threat.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            Opportunities
          </h3>
          <div className="space-y-2">
            {opportunities.map((opp) => (
              <Card
                key={opp.id}
                className="border rounded-xl border-emerald-500/30 bg-emerald-500/5"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{opp.title}</h4>
                      <p className="text-sm text-muted-foreground">{opp.description}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {opp.impact}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
