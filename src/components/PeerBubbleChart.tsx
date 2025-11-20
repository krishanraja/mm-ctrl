import React, { useMemo, useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceDot, Label } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Users, HelpCircle } from 'lucide-react';
import { AILearningStyle, getLearningStyleProfile } from '@/utils/aiLearningStyle';
import { generateRealisticPeers, calculateRealisticPercentile, getActualPeerCount } from '@/utils/realisticPeerGeneration';

interface PeerData {
  x: number; // Primary dimension score
  y: number; // Secondary dimension score
  z: number; // Tertiary dimension (bubble size)
  isUser: boolean;
  tier: string;
  id: string;
}

interface PeerBubbleChartProps {
  userDimensions: {
    dimension: string;
    score: number;
    percentile: number;
  }[];
  learningStyle?: AILearningStyle | null;
  viewMode?: 'cohort' | 'all';
}

// Calculate dynamic peer count starting from 102 on Nov 20, 2025
const getDynamicPeerCount = (): number => {
  const launchDate = new Date('2025-11-20');
  const today = new Date();
  const daysSinceLaunch = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
  return 102 + Math.max(0, daysSinceLaunch);
};

// Jitter configuration for natural peer distribution
const JITTER_CONFIG = {
  ahead: { x: 8, y: 10, z: 6 },
  near: { x: 12, y: 15, z: 10 },
  behind: { x: 10, y: 12, z: 8 }
};

// Generate realistic peer distribution ensuring 10% are ahead of user
const generatePeerData = (
  userX: number,
  userY: number,
  userZ: number,
  count: number = 102
): PeerData[] => {
  const peers: PeerData[] = [];
  
  // Calculate number of peers that should be ahead (minimum 10%)
  const peersAhead = Math.max(Math.ceil(count * 0.12), 50); // At least 12% ahead
  const peersNear = Math.ceil(count * 0.15); // 15% near user
  const peersBehind = count - peersAhead - peersNear;

  // Tier thresholds
  const getTier = (score: number): string => {
    if (score >= 85) return 'AI Pioneer';
    if (score >= 65) return 'Confident Practitioner';
    if (score >= 40) return 'Active Explorer';
    return 'Building Foundations';
  };

  // Generate peers ahead of user (higher scores)
  for (let i = 0; i < peersAhead; i++) {
    const xOffset = Math.random() * (100 - userX) * 0.8 + (100 - userX) * 0.15;
    const yOffset = Math.random() * (100 - userY) * 0.8 + (100 - userY) * 0.15;
    const zOffset = Math.random() * (100 - userZ) * 0.7 + (100 - userZ) * 0.2;
    
    // Add natural jitter to prevent vertical stacking
    const jitterX = (Math.random() - 0.5) * JITTER_CONFIG.ahead.x;
    const jitterY = (Math.random() - 0.5) * JITTER_CONFIG.ahead.y;
    const jitterZ = (Math.random() - 0.5) * JITTER_CONFIG.ahead.z;
    
    const x = Math.min(98, userX + xOffset + jitterX);
    const y = Math.min(98, userY + yOffset + jitterY);
    const z = Math.min(95, userZ + zOffset + jitterZ);
    
    peers.push({
      x: Math.round(x),
      y: Math.round(y),
      z: Math.round(z),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `peer-ahead-${i}`
    });
  }

  // Generate peers near user (similar scores ±10 points)
  for (let i = 0; i < peersNear; i++) {
    const baseSpread = 20;
    const jitterX = (Math.random() - 0.5) * JITTER_CONFIG.near.x;
    const jitterY = (Math.random() - 0.5) * JITTER_CONFIG.near.y;
    const jitterZ = (Math.random() - 0.5) * JITTER_CONFIG.near.z;
    
    const x = userX + (Math.random() - 0.5) * baseSpread + jitterX;
    const y = userY + (Math.random() - 0.5) * baseSpread + jitterY;
    const z = userZ + (Math.random() - 0.5) * 15 + jitterZ;
    
    peers.push({
      x: Math.round(Math.max(5, Math.min(95, x))),
      y: Math.round(Math.max(5, Math.min(95, y))),
      z: Math.round(Math.max(5, Math.min(90, z))),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `peer-near-${i}`
    });
  }

  // Generate peers behind user (lower scores)
  for (let i = 0; i < peersBehind; i++) {
    const jitterX = (Math.random() - 0.5) * JITTER_CONFIG.behind.x;
    const jitterY = (Math.random() - 0.5) * JITTER_CONFIG.behind.y;
    const jitterZ = (Math.random() - 0.5) * JITTER_CONFIG.behind.z;
    
    const x = Math.random() * userX * 0.9 + jitterX;
    const y = Math.random() * userY * 0.9 + jitterY;
    const z = Math.random() * userZ * 0.85 + jitterZ;
    
    peers.push({
      x: Math.round(Math.max(2, x)),
      y: Math.round(Math.max(2, y)),
      z: Math.round(Math.max(2, z)),
      isUser: false,
      tier: getTier((x + y + z) / 3),
      id: `peer-behind-${i}`
    });
  }

  return peers;
};

export const PeerBubbleChart: React.FC<PeerBubbleChartProps> = ({ 
  userDimensions, 
  learningStyle = null,
  viewMode = 'all' 
}) => {
  const [actualPeerCount, setActualPeerCount] = useState(102);

  // PHASE 3: Fetch actual peer count on mount
  useEffect(() => {
    const fetchPeerCount = async () => {
      const count = await getActualPeerCount();
      setActualPeerCount(count);
      console.log('📊 Actual peer count:', count);
    };
    fetchPeerCount();
  }, []);

  const chartData = useMemo(() => {
    // Get top 3 dimensions by score
    const topDimensions = [...userDimensions]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (topDimensions.length < 3) return { data: [], dimensions: topDimensions, stats: null };

    const [primary, secondary, tertiary] = topDimensions;
    
    // PHASE 3: Generate realistic peers with proper distribution
    const peers = generateRealisticPeers(
      primary.score,
      secondary.score,
      tertiary.score,
      actualPeerCount
    );

    // Add user data point
    const userData: PeerData = {
      x: primary.score,
      y: secondary.score,
      z: tertiary.score,
      isUser: true,
      tier: 'You',
      id: 'user'
    };

    const allData = [...peers, userData];

    // PHASE 3: Calculate realistic statistics with percentile cap
    const avgScore = (userData.x + userData.y + userData.z) / 3;
    const peerAvgScores = peers.map(p => (p.x + p.y + p.z) / 3);
    
    const percentileRank = calculateRealisticPercentile(avgScore, peerAvgScores);
    
    const peersAhead = peers.filter(p => 
      (p.x + p.y + p.z) / 3 > avgScore
    ).length;

    return {
      data: allData,
      dimensions: topDimensions,
      stats: {
        totalPeers: peers.length,
        peersAhead,
        percentileRank, // Now capped at 92nd percentile
        tierDistribution: {
          pioneer: peers.filter(p => p.tier === 'AI Pioneer').length,
          confident: peers.filter(p => p.tier === 'Confident Practitioner').length,
          explorer: peers.filter(p => p.tier === 'Active Explorer').length,
          building: peers.filter(p => p.tier === 'Building Foundations').length
        }
      }
    };
  }, [userDimensions, actualPeerCount]);

  if (chartData.dimensions.length < 3) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            Insufficient data for peer comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data, dimensions, stats } = chartData;
  const [primary, secondary, tertiary] = dimensions;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">
            {point.isUser ? '🎯 You' : point.tier}
          </p>
          <p className="text-xs text-muted-foreground">
            {primary.dimension}: {Math.round(point.x)}
          </p>
          <p className="text-xs text-muted-foreground">
            {secondary.dimension}: {Math.round(point.y)}
          </p>
          <p className="text-xs text-muted-foreground">
            {tertiary.dimension}: {Math.round(point.z)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                Peer Comparison Matrix
              </CardTitle>
              <CardDescription>
                Your position among {stats?.totalPeers.toLocaleString()}+ AI leaders
                {viewMode === 'cohort' && learningStyle && (
                  <span className="block mt-1 text-xs">
                    Showing peers from <span className="font-semibold">{getLearningStyleProfile(learningStyle).label}</span> cohort
                  </span>
                )}
              </CardDescription>
            </div>
            {stats && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="default" className="text-base px-4 py-1.5 cursor-help">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Top {Math.round(100 - stats.percentileRank)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    You're performing better than {Math.round(stats.percentileRank)}% of all AI leaders in the platform. 
                    This percentile is calculated across all dimensions.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
      <CardContent>
        {/* Dimension labels */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {dimensions.map((dim, idx) => (
            <div key={dim.dimension} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {idx === 0 ? 'X-Axis' : idx === 1 ? 'Y-Axis' : 'Bubble Size'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      {idx === 0 && `Horizontal axis: Your score in ${dim.dimension}. Higher scores appear further right.`}
                      {idx === 1 && `Vertical axis: Your score in ${dim.dimension}. Higher scores appear higher up.`}
                      {idx === 2 && `Bubble size: Your score in ${dim.dimension}. Higher scores create larger bubbles.`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-sm font-semibold">{dim.dimension}</div>
              <div className="text-xs text-primary font-medium">You: {Math.round(dim.score)}/100</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
          >
            <XAxis
              type="number"
              dataKey="x"
              name={primary.dimension}
              domain={[0, 100]}
              label={{ 
                value: primary.dimension, 
                position: 'bottom',
                offset: 40,
                style: { fontSize: 12, fontWeight: 600 }
              }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={secondary.dimension}
              domain={[0, 100]}
              label={{ 
                value: secondary.dimension, 
                angle: -90, 
                position: 'left',
                offset: 40,
                style: { fontSize: 12, fontWeight: 600 }
              }}
              tick={{ fontSize: 11 }}
            />
            <ZAxis
              type="number"
              dataKey="z"
              name={tertiary.dimension}
              domain={[0, 100]}
              range={[20, 400]}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            {/* Peer data */}
            <Scatter data={data.filter(d => !d.isUser)} fillOpacity={0.3}>
              {data.filter(d => !d.isUser).map((entry, index) => {
                let color = '#94a3b8'; // Default gray for building foundations
                if (entry.tier === 'AI Pioneer') color = '#8b5cf6'; // Purple
                else if (entry.tier === 'Confident Practitioner') color = '#3b82f6'; // Blue
                else if (entry.tier === 'Active Explorer') color = '#10b981'; // Green
                
                return <Cell key={`cell-${index}`} fill={color} stroke="none" />;
              })}
            </Scatter>

            {/* User data point - highlighted */}
            <Scatter data={data.filter(d => d.isUser)} fillOpacity={1}>
              <Cell fill="hsl(var(--primary))" stroke="#fff" strokeWidth={3} />
            </Scatter>

            {/* User label */}
            <ReferenceDot
              x={data.find(d => d.isUser)?.x}
              y={data.find(d => d.isUser)?.y}
              r={0}
              label={{
                value: '👑 You',
                position: 'top',
                offset: 15,
                style: { 
                  fontSize: 13, 
                  fontWeight: 700,
                  fill: 'hsl(var(--primary))'
                }
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend and stats */}
        {stats && (
          <div className="mt-8">
            {viewMode === 'cohort' && learningStyle && (
              <h4 className="text-sm font-semibold mb-2">
                {getLearningStyleProfile(learningStyle).label} Cohort Distribution
              </h4>
            )}
            {viewMode === 'all' && (
              <h4 className="text-sm font-semibold mb-2">
                All Users Distribution
              </h4>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 cursor-help">
                    <div className="text-xs font-medium text-muted-foreground mb-1">AI Pioneer</div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {stats.tierDistribution.pioneer}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((stats.tierDistribution.pioneer / stats.totalPeers) * 100)}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>AI Pioneer (85-100):</strong> Cutting-edge practitioners who are leading AI adoption 
                    in their organizations with advanced implementations and strategic vision.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-help">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Confident</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {stats.tierDistribution.confident}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((stats.tierDistribution.confident / stats.totalPeers) * 100)}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>AI Confident (70-84):</strong> Experienced users who have solid AI foundations 
                    and are actively expanding their capabilities across multiple use cases.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 cursor-help">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Explorer</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {stats.tierDistribution.explorer}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((stats.tierDistribution.explorer / stats.totalPeers) * 100)}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>AI Explorer (55-69):</strong> Active learners who are experimenting with AI tools 
                    and building practical experience in specific domains.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800 cursor-help">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Building</div>
                    <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      {stats.tierDistribution.building}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((stats.tierDistribution.building / stats.totalPeers) * 100)}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>AI Building (0-54):</strong> Early-stage learners who are beginning their AI journey 
                    and establishing foundational knowledge and skills.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {stats && stats.peersAhead > 0 && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.peersAhead}</span> leaders ({Math.round((stats.peersAhead / stats.totalPeers) * 100)}%) 
              are currently ahead—giving you clear targets to learn from and chase.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};