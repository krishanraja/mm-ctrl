/**
 * StrategicPulseSheet Component
 * 
 * Strategic pulse content for bottom sheet.
 */

import { AlertTriangle, TrendingUp } from 'lucide-react';
import type { BaselineData, WeeklyAction } from '@/core/types';

interface StrategicPulseSheetProps {
  baselineData: BaselineData | null;
  weeklyAction: WeeklyAction | null;
}

export function StrategicPulseSheet({ baselineData, weeklyAction }: StrategicPulseSheetProps) {
  return (
    <div className="space-y-6">
      {/* Baseline Status */}
      {baselineData && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Your Baseline</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tier</span>
              <span className="text-sm font-medium text-foreground">{baselineData.benchmarkTier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score</span>
              <span className="text-sm font-medium text-foreground">{baselineData.benchmarkScore}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Percentile</span>
              <span className="text-sm font-medium text-foreground">{baselineData.percentile}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Tensions */}
      {baselineData?.tensions && baselineData.tensions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Strategic Tensions</h3>
          <div className="space-y-3">
            {baselineData.tensions.slice(0, 3).map((tension, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border/40">
                <p className="text-base font-medium text-foreground mb-2 leading-relaxed">{tension.summary_line}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{tension.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Signals */}
      {baselineData?.riskSignals && baselineData.riskSignals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Signals
          </h3>
          <div className="space-y-2">
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
          </div>
        </div>
      )}

      {/* Weekly Action */}
      {weeklyAction && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            This Week's Action
          </h3>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-foreground mb-2">{weeklyAction.action_text}</p>
            {weeklyAction.why_text && (
              <p className="text-xs text-muted-foreground">{weeklyAction.why_text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
