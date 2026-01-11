import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Target, Clock } from 'lucide-react';

interface StrategicPulseSheetProps {
  baselineData: any;
  weeklyAction: any;
  recentActivity: any;
}

export const StrategicPulseSheet: React.FC<StrategicPulseSheetProps> = ({
  baselineData,
  weeklyAction,
  recentActivity,
}) => {
  const tensions = baselineData?.tensions || [];
  const risks = baselineData?.riskSignals || [];
  const score = baselineData?.benchmarkScore || 0;
  const tier = baselineData?.benchmarkTier || 'Emerging';

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Scorecard */}
      <Card className="border rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">AI Literacy Score</p>
              <p className="text-3xl font-bold text-foreground">{score}</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {tier}
            </Badge>
          </div>
          
          {/* Dimension Scores */}
          {baselineData?.dimensionScores && (
            <div className="space-y-2 mt-4">
              {baselineData.dimensionScores.slice(0, 3).map((dim: any) => (
                <div key={dim.dimension_key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground capitalize">
                    {dim.dimension_key.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${dim.score_numeric}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-8 text-right">
                      {Math.round(dim.score_numeric)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {risks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Critical Alerts
          </h3>
          <div className="space-y-2">
            {risks.slice(0, 5).map((risk: any) => (
              <Card
                key={risk.id}
                className={`border rounded-xl ${
                  risk.level === 'high'
                    ? 'border-red-500/30 bg-red-500/5'
                    : risk.level === 'medium'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-blue-500/30 bg-blue-500/5'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground flex-1">{risk.description}</p>
                    <Badge
                      variant={
                        risk.level === 'high'
                          ? 'destructive'
                          : risk.level === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                      className="shrink-0"
                    >
                      {risk.level}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Tensions */}
      {tensions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Strategic Tensions
          </h3>
          <div className="space-y-2">
            {tensions.slice(0, 3).map((tension: any) => (
              <Card key={tension.id} className="border rounded-xl">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">{tension.summary_line}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* This Week's Focus */}
      {weeklyAction && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            This Week's Focus
          </h3>
          <Card className="border rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <p className="text-sm text-foreground mb-2">{weeklyAction.action_text}</p>
              {weeklyAction.why_text && (
                <p className="text-xs text-muted-foreground">{weeklyAction.why_text}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </h3>
          <Card className="border rounded-xl">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">
                Last {recentActivity.type}: {recentActivity.date}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
