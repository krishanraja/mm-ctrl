import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';
import { Loader2, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { TensionCard } from '@/components/ui/tension-card';
import { RiskSignalCard } from '@/components/ui/risk-signal-card';
import { OrgScenarioCard } from '@/components/ui/org-scenario-card';
import { ContactData } from './ContactCollectionForm';

interface TensionsViewProps {
  assessmentId: string;
  contactData: ContactData;
}

export const TensionsView: React.FC<TensionsViewProps> = ({ assessmentId, contactData }) => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await aggregateLeaderResults(assessmentId, true);
      setResults(data);
      setIsLoading(false);
    };
    loadData();
  }, [assessmentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load diagnostic data</p>
      </div>
    );
  }

  const { tensions, riskSignals, orgScenarios } = results;
  const firstName = contactData.fullName.split(' ')[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Where Things Don't Add Up</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {firstName}, these aren't problems to fix tomorrow. They're the gaps between 
            where you say you want to go and where you're actually heading. The ones that 
            compound over time if you don't hold them in view.
          </p>
        </CardContent>
      </Card>

      {/* Tensions Section */}
      {tensions && tensions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            The Gaps That Matter
          </h2>
          <p className="text-sm text-muted-foreground">
            What you're saying versus what you're doing.
          </p>
          {tensions.map((tension: any, index: number) => (
            <TensionCard key={index} tension={tension} />
          ))}
        </div>
      )}

      {/* Risk Signals Section */}
      {riskSignals && riskSignals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Where Waste Is Hiding
          </h2>
          <p className="text-sm text-muted-foreground">
            The places theatre, blind spots, or inefficiency might be creeping in.
          </p>
          {riskSignals.map((signal: any, index: number) => (
            <RiskSignalCard key={index} signal={signal} />
          ))}
        </div>
      )}

      {/* Org Scenarios Section */}
      {orgScenarios && orgScenarios.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            What's Coming (3-5 Years Out)
          </h2>
          <p className="text-sm text-muted-foreground">
            How AI will reshape your role, your company, and the decisions you'll need to make.
          </p>
          {orgScenarios.map((scenario: any, index: number) => (
            <OrgScenarioCard key={index} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
};
