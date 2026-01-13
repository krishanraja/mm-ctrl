/**
 * StrategicPulse Component
 * 
 * Strategic pulse - the big picture view.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';

export function StrategicPulse() {
  const { baselineData } = useDashboard();

  if (!baselineData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Pulse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Complete your diagnostic to see your strategic pulse</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Baseline Status */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Your Baseline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-base text-muted-foreground">Tier</span>
            <span className="text-lg font-semibold text-foreground">{baselineData.benchmarkTier}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-base text-muted-foreground">Score</span>
            <span className="text-lg font-semibold text-foreground">{baselineData.benchmarkScore}/100</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-base text-muted-foreground">Percentile</span>
            <span className="text-lg font-semibold text-foreground">{baselineData.percentile}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Tensions */}
      {baselineData.tensions && baselineData.tensions.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Strategic Tensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {baselineData.tensions.slice(0, 3).map((tension, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border/40">
                <p className="text-base font-medium text-foreground mb-2 leading-relaxed">{tension.summary_line}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{tension.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Signals */}
      {baselineData.riskSignals && baselineData.riskSignals.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="h-6 w-6" />
              Risk Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {baselineData.riskSignals.map((risk, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  risk.level === 'high'
                    ? 'bg-red-500/10 border-red-500/30'
                    : risk.level === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-muted/30 border-border/40'
                }`}
              >
                <p className="text-base text-foreground leading-relaxed">{risk.description}</p>
                <p className="text-sm text-muted-foreground mt-2 capitalize">{risk.level} risk</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
