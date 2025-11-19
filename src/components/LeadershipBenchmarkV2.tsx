import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RiskSignalCard } from '@/components/ui/risk-signal-card';
import { OrgScenarioCard } from '@/components/ui/org-scenario-card';
import { FirstMovesCard } from '@/components/ui/first-moves-card';
import { AILiteracyRealities } from '@/components/ui/ai-literacy-realities';
import { TensionBadge } from '@/components/ui/tension-badge';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { DimensionCard } from '@/components/ui/dimension-card';
import { InsightCard } from '@/components/ui/insight-card';
import { aggregateLeaderResults, isContentLocked, type AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';
import { usePayment } from '@/hooks/usePayment';
import { checkPaymentCallback, handlePaymentSuccess } from '@/utils/handlePaymentSuccess';
import { useToast } from '@/hooks/use-toast';
import { Crown, Sparkles, Target, TrendingUp, Lock, Loader2 } from 'lucide-react';
import { ContactData } from './ContactCollectionForm';

interface LeadershipBenchmarkV2Props {
  assessmentId: string;
  contactData: ContactData;
  onUpgrade?: () => void;
}

const tierConfig = {
  'AI-Orchestrator': {
    icon: Crown,
    gradient: 'from-yellow-400 to-yellow-600',
    badgeStyle: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  'AI-Confident': {
    icon: Sparkles,
    gradient: 'from-blue-400 to-blue-600',
    badgeStyle: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  'AI-Aware': {
    icon: Target,
    gradient: 'from-green-400 to-green-600',
    badgeStyle: 'bg-green-100 text-green-800 border-green-300',
  },
  'AI-Emerging': {
    icon: TrendingUp,
    gradient: 'from-gray-400 to-gray-600',
    badgeStyle: 'bg-gray-100 text-gray-800 border-gray-300',
  },
};

const dimensionLabels: Record<string, string> = {
  ai_fluency: 'AI Fluency',
  decision_velocity: 'Decision Velocity',
  experimentation_cadence: 'Experimentation Cadence',
  delegation_augmentation: 'Delegation & Augmentation',
  alignment_communication: 'Alignment & Communication',
  risk_governance: 'Risk & Governance',
};

export const LeadershipBenchmarkV2: React.FC<LeadershipBenchmarkV2Props> = ({
  assessmentId,
  contactData,
  onUpgrade,
}) => {
  const [results, setResults] = useState<AggregatedLeaderResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { createPaymentSession } = usePayment();
  const { toast } = useToast();

  useEffect(() => {
    loadResults();
    
    // Check for payment callback
    const paymentCallback = checkPaymentCallback();
    if (paymentCallback.success && paymentCallback.assessmentId === assessmentId) {
      // Verify and unlock
      if (paymentCallback.sessionId) {
        handlePaymentSuccess(assessmentId, paymentCallback.sessionId).then(verified => {
          if (verified) {
            // Reload results to show unlocked content
            loadResults();
            toast({
              title: 'Diagnostic Unlocked!',
              description: 'Your Full Leadership Diagnostic is now available.',
            });
          }
        });
      }
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [assessmentId]);

  const loadResults = async () => {
    setIsLoading(true);
    const data = await aggregateLeaderResults(assessmentId, true);
    setResults(data);
    setIsLoading(false);
  };

  const handleUpgradeClick = () => {
    setUpgradeModalOpen(true);
  };

  const handleUpgrade = async () => {
    // Create Stripe checkout session
    const checkoutUrl = await createPaymentSession(assessmentId);
    
    if (checkoutUrl) {
      // Open Stripe checkout in new tab
      window.open(checkoutUrl, '_blank');
    }
    
    setUpgradeModalOpen(false);
  };

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
        <p className="text-muted-foreground">Unable to load assessment results</p>
      </div>
    );
  }

  const config = tierConfig[results.benchmarkTier as keyof typeof tierConfig] || tierConfig['AI-Emerging'];
  const TierIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Upgrade Badge (Free users only) */}
      {!results.hasFullDiagnostic && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Unlock Your Full Leadership Diagnostic</p>
                <p className="text-sm text-muted-foreground">Get all insights, risks, and actionable recommendations</p>
              </div>
            </div>
            <Button onClick={handleUpgradeClick} size="sm">
              Upgrade - $99
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Benchmark Score Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${config.gradient} p-1`}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{results.benchmarkScore}</div>
                  <div className="text-xs text-muted-foreground">/100</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {contactData.fullName.split(' ')[0]}'s AI Leadership Benchmark
              </h2>
              <Badge className={config.badgeStyle}>
                {results.benchmarkTier}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Signals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Risk Signals</h3>
        <div className="grid gap-4">
          {results.riskSignals.map((risk, index) => (
            <RiskSignalCard
              key={risk.risk_key}
              riskKey={risk.risk_key}
              level={risk.level}
              description={risk.description}
              isLocked={isContentLocked(results.hasFullDiagnostic, 'risk', index)}
            />
          ))}
          {!results.hasFullDiagnostic && results.riskSignals.length < 4 && (
            Array.from({ length: 3 - results.riskSignals.length }).map((_, i) => (
              <RiskSignalCard
                key={`locked-${i}`}
                riskKey="shadow_ai"
                level="medium"
                description="Unlock to see this risk signal"
                isLocked={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Leadership Dimensions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Leadership Dimensions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {results.dimensionScores.map((dim, index) => {
            const tension = results.tensions.find(t => t.dimension_key === dim.dimension_key);
            const isLocked = tension && isContentLocked(results.hasFullDiagnostic, 'tension', results.tensions.indexOf(tension));
            
            return (
              <Card key={dim.dimension_key}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{dimensionLabels[dim.dimension_key]}</h4>
                    {tension && (
                      <TensionBadge 
                        summaryLine={tension.summary_line}
                        isLocked={isLocked}
                      />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{dim.score_numeric}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <Progress value={dim.score_numeric} className="h-2" />
                  <Badge variant="outline" className="text-xs">
                    {dim.dimension_tier}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Org Scenarios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Organization's Trajectory</h3>
        <div className="grid gap-4">
          {results.orgScenarios.map((scenario, index) => (
            <OrgScenarioCard
              key={scenario.scenario_key}
              scenarioKey={scenario.scenario_key}
              summary={scenario.summary}
              isLocked={isContentLocked(results.hasFullDiagnostic, 'scenario', index)}
            />
          ))}
          {!results.hasFullDiagnostic && results.orgScenarios.length < 3 && (
            Array.from({ length: 2 - results.orgScenarios.length }).map((_, i) => (
              <OrgScenarioCard
                key={`locked-${i}`}
                scenarioKey="stagnation_loop"
                summary="Unlock to see this scenario"
                isLocked={true}
              />
            ))
          )}
        </div>
      </div>

      {/* First 3 Moves */}
      <FirstMovesCard 
        moves={results.firstMoves.map(m => ({
          moveNumber: m.move_number,
          content: m.content,
        }))}
        showAll={results.hasFullDiagnostic}
      />

      {/* AI Literacy Realities */}
      <AILiteracyRealities />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};
