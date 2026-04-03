import React from 'react';
import { OrgScenarioCard } from '@/components/ui/org-scenario-card';
import type { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

interface OrgScenariosSectionProps {
  results: AggregatedLeaderResults;
}

export const OrgScenariosSection: React.FC<OrgScenariosSectionProps> = ({ results }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Organization's Trajectory</h3>
      <div className="grid gap-4">
        {results.orgScenarios.map((scenario, index) => (
          <OrgScenarioCard
            key={scenario.scenario_key}
            scenario={{
              scenario_key: scenario.scenario_key,
              summary: scenario.summary,
              priority_rank: scenario.priority_rank,
            }}
          />
        ))}
        {!results.hasFullDiagnostic && results.orgScenarios.length < 3 && (
          Array.from({ length: 2 - results.orgScenarios.length }).map((_, i) => (
            <OrgScenarioCard
              key={`locked-${i}`}
              scenario={{
                scenario_key: 'stagnation_loop',
                summary: 'Unlock to see this scenario',
                priority_rank: 99,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
