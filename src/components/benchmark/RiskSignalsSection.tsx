import React from 'react';
import { RiskSignalCard } from '@/components/ui/risk-signal-card';
import type { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface RiskSignalsSectionProps {
  results: AggregatedLeaderResults;
}

export const RiskSignalsSection: React.FC<RiskSignalsSectionProps> = ({ results }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Risk Signals & Execution Gaps</h3>
      <div className="grid gap-4">
        {results.riskSignals
          .sort((a, b) => {
            // Show execution gaps first
            const aIsGap = a.risk_key.startsWith('execution_gap_');
            const bIsGap = b.risk_key.startsWith('execution_gap_');
            if (aIsGap && !bIsGap) return -1;
            if (!aIsGap && bIsGap) return 1;
            return (b.priority_rank || 0) - (a.priority_rank || 0);
          })
          .map((risk, index) => (
            <RiskSignalCard
              key={risk.risk_key}
              signal={{
                risk_key: risk.risk_key,
                level: risk.level,
                description: risk.risk_key.startsWith('execution_gap_')
                  ? `🎯 **Execution Gap Detected**\n\n${risk.description}`
                  : risk.description,
                priority_rank: risk.priority_rank,
              }}
            />
          ))}
        {!results.hasFullDiagnostic && results.riskSignals.length < 4 && (
          Array.from({ length: 3 - results.riskSignals.length }).map((_, i) => (
            <RiskSignalCard
              key={`locked-${i}`}
              signal={{
                risk_key: 'shadow_ai',
                level: 'medium',
                description: 'Unlock to see this risk signal',
                priority_rank: 99,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
