import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target, ChevronLeft, ChevronRight, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface CompetitiveIntelligenceSheetProps {
  baselineData: any;
}

export const CompetitiveIntelligenceSheet: React.FC<CompetitiveIntelligenceSheetProps> = ({
  baselineData,
}) => {
  const [currentTrendIndex, setCurrentTrendIndex] = useState(0);
  const [peerData, setPeerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calculate market position from real data
  const marketPosition = useMemo(() => {
    if (!baselineData || !peerData) {
      // Fallback to calculated values from baseline
      const score = baselineData?.benchmarkScore || 50;
      const dimensions = baselineData?.dimensionScores || [];
      
      return {
        overall: score,
        percentile: Math.max(1, Math.min(99, Math.round((score / 100) * 100))),
        dimensions: dimensions.slice(0, 4).map((dim: any) => ({
          name: dim.dimension_key.replace('_', ' '),
          score: Math.round(dim.score_numeric),
          peerAvg: Math.round(dim.score_numeric * 0.9), // Estimate until real data loads
          trend: 'stable' as const,
        })),
      };
    }

    const userScore = baselineData.benchmarkScore || 50;
    const userDimensions = baselineData.dimensionScores || [];
    
    // Calculate percentile from peer data
    const peerScores = peerData.map((p: any) => p.readiness_score || p.benchmarkScore || 50);
    const sortedScores = [...peerScores].sort((a, b) => b - a);
    const userRank = sortedScores.findIndex((s) => s <= userScore);
    const percentile = userRank === -1 ? 1 : Math.max(1, Math.min(99, Math.round(((sortedScores.length - userRank) / sortedScores.length) * 100)));

    // Calculate dimension averages from peers
    const dimensionAvgs = userDimensions.map((userDim: any) => {
      const peerDimScores = peerData
        .map((p: any) => {
          const dims = p.dimension_scores || p.dimensionScores || {};
          return dims[userDim.dimension_key] || dims[userDim.dimension_key?.replace('_', '')] || null;
        })
        .filter((s: any) => s !== null && typeof s === 'number');
      
      const avg = peerDimScores.length > 0
        ? peerDimScores.reduce((a: number, b: number) => a + b, 0) / peerDimScores.length
        : userDim.score_numeric * 0.9;

      return {
        name: userDim.dimension_key.replace('_', ' '),
        score: Math.round(userDim.score_numeric),
        peerAvg: Math.round(avg),
        trend: userDim.score_numeric > avg ? 'up' : userDim.score_numeric < avg ? 'down' : 'stable',
      };
    });

    return {
      overall: userScore,
      percentile,
      dimensions: dimensionAvgs.slice(0, 4),
    };
  }, [baselineData, peerData]);

  // Load peer data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // Get user's industry/company size for filtering
        const userIndustry = baselineData?.industry;
        const userCompanySize = baselineData?.companySize;

        // Query peer data (anonymized)
        const { data, error } = await supabase
          .from('index_participant_data')
          .select('readiness_score, dimension_scores, tier, industry, company_size')
          .eq('consent_flags->index_publication', true)
          .limit(100);

        if (!error && data && isMounted) {
          // Filter by similar industry if available
          const filtered = userIndustry
            ? data.filter((p: any) => p.industry === userIndustry)
            : data;
          
          setPeerData(filtered.length > 0 ? filtered : data);
        }
      } catch (err) {
        console.warn('Could not load peer data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [baselineData]);

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

  if (loading) {
    return (
      <div className="px-6 py-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Market Position */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Market Position</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Voice summary of market position
              const summary = `You're in the top ${marketPosition.percentile}% of leaders with an overall score of ${marketPosition.overall}. ` +
                marketPosition.dimensions.map(d => 
                  `${d.name}: ${d.score} compared to ${d.peerAvg} average, ${d.trend === 'up' ? 'leading' : d.trend === 'down' ? 'behind' : 'on par'}.`
                ).join(' ');
              
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(summary);
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="h-8"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Voice Summary
          </Button>
        </div>
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
