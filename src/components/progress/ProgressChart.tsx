import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Snapshot {
  id: string;
  snapshot_date: string;
  dimension_scores: Record<string, number>;
  comparison_to_baseline: Record<string, number>;
  benchmark_score: number;
  benchmark_tier: string;
}

interface ProgressChartProps {
  leaderId: string;
}

export function ProgressChart({ leaderId }: ProgressChartProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [biggestImprovement, setBiggestImprovement] = useState<{ dimension: string; delta: number } | null>(null);

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        const { data, error } = await supabase
          .from('leader_progress_snapshots')
          .select('*')
          .eq('leader_id', leaderId)
          .order('snapshot_date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setSnapshots(data as Snapshot[]);

          // Calculate biggest improvement
          const latest = data[data.length - 1] as Snapshot;
          if (latest.comparison_to_baseline) {
            const improvements = Object.entries(latest.comparison_to_baseline)
              .map(([dimension, delta]) => ({ dimension, delta: delta as number }))
              .sort((a, b) => b.delta - a.delta);

            if (improvements.length > 0 && improvements[0].delta > 0) {
              setBiggestImprovement(improvements[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading snapshots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (leaderId) {
      loadSnapshots();
    }
  }, [leaderId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00D9B6]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your AI Leadership Progress
          </CardTitle>
          <CardDescription>
            Complete another assessment to see your progress over time
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = snapshots.map(snapshot => ({
    date: format(new Date(snapshot.snapshot_date), 'MMM d'),
    'AI Strategy': snapshot.dimension_scores.ai_strategy || 0,
    'Momentum': snapshot.dimension_scores.momentum || 0,
    'Learning': snapshot.dimension_scores.learning_orientation || 0,
    'Integration': snapshot.dimension_scores.integration_depth || 0,
    'Overall': snapshot.benchmark_score || 0
  }));

  const formatDimensionName = (key: string): string => {
    const names: Record<string, string> = {
      ai_strategy: 'AI Strategy',
      momentum: 'Momentum',
      learning_orientation: 'Learning',
      integration_depth: 'Integration'
    };
    return names[key] || key;
  };

  return (
    <div className="space-y-4">
      
      {/* Biggest Improvement Card */}
      {biggestImprovement && biggestImprovement.delta > 10 && (
        <Card className="border-2 border-[#00D9B6]/30 bg-gradient-to-br from-[#00D9B6]/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#00D9B6]/10 rounded-lg">
                <Trophy className="h-6 w-6 text-[#00D9B6]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Biggest Improvement!</h3>
                <p className="text-muted-foreground mb-3">
                  You've improved your <strong>{formatDimensionName(biggestImprovement.dimension)}</strong> score by{' '}
                  <strong className="text-[#00D9B6]">+{biggestImprovement.delta}%</strong>
                </p>
                <Badge className="bg-[#00D9B6] text-black">
                  Share Your Progress
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your AI Leadership Progress
          </CardTitle>
          <CardDescription>
            Dimension scores over time ({snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#888888" 
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="AI Strategy" 
                stroke="#00D9B6" 
                strokeWidth={2}
                dot={{ fill: '#00D9B6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Momentum" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Learning" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Integration" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Latest Scores Summary */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {snapshots.length > 0 && (() => {
              const latest = snapshots[snapshots.length - 1];
              const dimensions = [
                { key: 'ai_strategy', label: 'AI Strategy', color: 'text-[#00D9B6]' },
                { key: 'momentum', label: 'Momentum', color: 'text-purple-600' },
                { key: 'learning_orientation', label: 'Learning', color: 'text-amber-600' },
                { key: 'integration_depth', label: 'Integration', color: 'text-red-600' }
              ];

              return dimensions.map(dim => {
                const score = latest.dimension_scores[dim.key] || 0;
                const delta = latest.comparison_to_baseline?.[dim.key] || 0;

                return (
                  <div key={dim.key} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{dim.label}</p>
                    <p className={`text-2xl font-bold ${dim.color}`}>{score}</p>
                    {delta !== 0 && (
                      <p className={`text-xs ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </p>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
