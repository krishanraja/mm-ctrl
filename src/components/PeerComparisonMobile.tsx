/**
 * Mobile-Optimized Peer Comparison Component
 * 
 * Reimagined for mobile-first experience:
 * - Vertical stacked dimension cards
 * - User position prominently at top
 * - Progress bars with percentile ranks
 * - Tap to expand for peer distribution context
 * 
 * Not a shrunk desktop chart - intentionally designed for mobile.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DimensionData {
  dimension: string;
  score: number;
  percentile: number;
}

interface PeerComparisonMobileProps {
  userDimensions: DimensionData[];
  totalPeers: number;
  overallPercentile: number;
}

// Format dimension keys to readable labels
const dimensionLabels: Record<string, string> = {
  ai_fluency: 'AI Fluency',
  decision_velocity: 'Decision Velocity',
  experimentation_cadence: 'Experimentation',
  delegation_augmentation: 'Delegation',
  alignment_communication: 'Alignment',
  risk_governance: 'Risk Governance',
};

// Get tier badge style based on score
const getTierStyle = (score: number): string => {
  if (score >= 80) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (score >= 65) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 50) return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

// Get tier label based on score
const getTierLabel = (score: number): string => {
  if (score >= 80) return 'Leading';
  if (score >= 65) return 'Advanced';
  if (score >= 50) return 'Developing';
  return 'Emerging';
};

// Get progress bar color based on percentile
const getProgressColor = (percentile: number): string => {
  if (percentile >= 70) return 'bg-emerald-500';
  if (percentile >= 50) return 'bg-blue-500';
  if (percentile >= 30) return 'bg-amber-500';
  return 'bg-gray-400';
};

export const PeerComparisonMobile: React.FC<PeerComparisonMobileProps> = ({
  userDimensions,
  totalPeers,
  overallPercentile,
}) => {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  // Sort dimensions by score (highest first for mobile prominence)
  const sortedDimensions = [...userDimensions].sort((a, b) => b.score - a.score);
  const topDimension = sortedDimensions[0];
  const bottomDimension = sortedDimensions[sortedDimensions.length - 1];

  // Calculate peers ahead
  const peersAhead = Math.round(totalPeers * (1 - overallPercentile / 100));

  return (
    <Card className="border-0 shadow-none bg-transparent">
      {/* Header - Overall Position */}
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Your Position
            </CardTitle>
            <CardDescription className="mt-1">
              Among {totalPeers.toLocaleString()}+ AI leaders
            </CardDescription>
          </div>
          <Badge 
            variant="default" 
            className="text-base px-4 py-1.5 bg-primary"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Top {Math.max(1, 100 - overallPercentile)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-3">
        {/* Quick Summary */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{peersAhead}</span> leaders 
              ({Math.round((peersAhead / totalPeers) * 100)}%) are ahead of you
            </span>
          </div>
        </div>

        {/* Dimension Cards */}
        <div className="space-y-2">
          {sortedDimensions.map((dim, index) => {
            const isExpanded = expandedDimension === dim.dimension;
            const label = dimensionLabels[dim.dimension] || dim.dimension;
            const isTop = dim.dimension === topDimension?.dimension;
            const isBottom = dim.dimension === bottomDimension?.dimension;

            return (
              <Collapsible
                key={dim.dimension}
                open={isExpanded}
                onOpenChange={() => 
                  setExpandedDimension(isExpanded ? null : dim.dimension)
                }
              >
                <div 
                  className={cn(
                    "rounded-xl border bg-card transition-all",
                    isExpanded && "ring-2 ring-primary/20"
                  )}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{label}</span>
                          {isTop && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
                              Strongest
                            </Badge>
                          )}
                          {isBottom && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                              Focus area
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{dim.score}</span>
                          <span className="text-muted-foreground text-sm">/100</span>
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )} 
                          />
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-full transition-all",
                            getProgressColor(dim.percentile)
                          )}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      
                      {/* Percentile */}
                      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>Top {Math.max(1, 100 - dim.percentile)}% of peers</span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getTierStyle(dim.score))}
                        >
                          {getTierLabel(dim.score)}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 border-t">
                      <div className="pt-3 space-y-3">
                        {/* Peer Distribution Context */}
                        <div className="text-sm text-muted-foreground">
                          <p>
                            {dim.percentile >= 70 ? (
                              <>
                                Your {label.toLowerCase()} score puts you in the 
                                <span className="font-semibold text-foreground"> top third </span>
                                of assessed leaders. This is a competitive advantage.
                              </>
                            ) : dim.percentile >= 40 ? (
                              <>
                                Your {label.toLowerCase()} score is 
                                <span className="font-semibold text-foreground"> around the median</span>. 
                                Small improvements here will move you ahead of many peers.
                              </>
                            ) : (
                              <>
                                Your {label.toLowerCase()} score is 
                                <span className="font-semibold text-foreground"> below most peers</span>. 
                                This is your highest-leverage improvement area.
                              </>
                            )}
                          </p>
                        </div>

                        {/* Mini Distribution Visual */}
                        <div className="flex items-center gap-1 h-8">
                          {[...Array(10)].map((_, i) => {
                            const segmentPercentile = (i + 1) * 10;
                            const isUserSegment = dim.percentile >= (i * 10) && dim.percentile < ((i + 1) * 10);
                            return (
                              <div 
                                key={i}
                                className={cn(
                                  "flex-1 rounded-sm transition-all",
                                  isUserSegment 
                                    ? "bg-primary h-full" 
                                    : segmentPercentile <= dim.percentile
                                      ? "bg-primary/30 h-3/4"
                                      : "bg-muted h-1/2"
                                )}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Bottom 10%</span>
                          <span>Top 10%</span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center pt-2 text-xs text-muted-foreground">
          Tap any dimension to see peer distribution details
        </div>
      </CardContent>
    </Card>
  );
};

