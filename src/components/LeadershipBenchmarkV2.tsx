import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RiskSignalCard } from '@/components/ui/risk-signal-card';
import { OrgScenarioCard } from '@/components/ui/org-scenario-card';
import { FirstMovesCard } from '@/components/ui/first-moves-card';
import { QuickWinsCard } from '@/components/ui/quick-wins-card';
import { AILiteracyRealities } from '@/components/ui/ai-literacy-realities';
import { TensionBadge } from '@/components/ui/tension-badge';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { DimensionCard } from '@/components/ui/dimension-card';
import { InsightCard } from '@/components/ui/insight-card';
import { aggregateLeaderResults, isContentLocked, type AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';
import { usePayment } from '@/hooks/usePayment';
import { checkPaymentCallback, handlePaymentSuccess } from '@/utils/handlePaymentSuccess';
import { exportDiagnosticPDF, ExportData } from '@/utils/exportPDF';
import { useToast } from '@/hooks/use-toast';
import { Crown, Sparkles, Target, TrendingUp, Lock, Loader2, Download } from 'lucide-react';
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
    try {
      const data = await aggregateLeaderResults(assessmentId, true);
      
      // Defensive check: if all dimension scores are zero, show error
      if (data && data.dimensionScores.every(d => (d.score_numeric || 0) === 0)) {
        console.error('❌ All dimension scores are zero - data structure mismatch detected');
        setResults(null);
        toast({
          title: 'Assessment Data Error',
          description: 'Unable to load valid assessment scores. Please retake the assessment.',
          variant: 'destructive',
        });
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error('❌ Error loading results:', error);
      setResults(null);
      toast({
        title: 'Loading Error',
        description: 'Unable to load assessment results. Please refresh the page.',
        variant: 'destructive',
      });
    }
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

  const handleExportPDF = async () => {
    if (!results || !results.hasFullDiagnostic) return;

    const exportData: ExportData = {
      leaderName: contactData.fullName,
      companyName: contactData.companyName,
      benchmarkScore: results.benchmarkScore,
      benchmarkTier: results.benchmarkTier,
      dimensionScores: results.dimensionScores.map(d => ({
        dimension: dimensionLabels[d.dimension_key] || d.dimension_key,
        score: d.score_numeric || 0,
        tier: d.dimension_tier || 'Emerging',
      })),
      firstMoves: results.firstMoves.map(m => m.content),
      riskSignals: results.riskSignals.map(r => ({
        risk_key: r.risk_key,
        level: r.level,
        description: r.description,
      })),
      tensions: results.tensions.map(t => ({
        dimension_key: t.dimension_key,
        summary_line: t.summary_line,
      })),
      scenarios: results.orgScenarios.map(s => ({
        scenario_key: s.scenario_key,
        summary: s.summary,
      })),
    };

    try {
      await exportDiagnosticPDF(exportData);
      toast({
        title: 'PDF Exported',
        description: 'Your diagnostic report has been downloaded.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Unable to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
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
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${config.gradient} p-1 flex-shrink-0`}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{results.benchmarkScore}</div>
                  <div className="text-xs text-muted-foreground">/100</div>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    {contactData.fullName.split(' ')[0]}'s AI Leadership Benchmark
                  </h2>
                  <Badge className={config.badgeStyle}>
                    {results.benchmarkTier}
                  </Badge>
                </div>
                {results.hasFullDiagnostic && (
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins Section - Free Tier Value */}
      {generateQuickWins(results).length > 0 && (
        <QuickWinsCard wins={generateQuickWins(results)} />
      )}

      {/* Risk Signals & Execution Gaps */}
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
                riskKey={risk.risk_key}
                level={risk.level}
                description={
                  risk.risk_key.startsWith('execution_gap_')
                    ? `🎯 **Execution Gap Detected**\n\n${risk.description}`
                    : risk.description
                }
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

// Generate quick wins from available data
function generateQuickWins(results: AggregatedLeaderResults): Array<{ title: string; impact: string; timeToValue: string }> {
  const wins: Array<{ title: string; impact: string; timeToValue: string }> = [];

  // Win 1: From first move if available
  if (results.firstMoves.length > 0) {
    const firstMove = results.firstMoves[0];
    wins.push({
      title: `Priority Action: ${firstMove.content.split('.')[0]}`,
      impact: firstMove.content,
      timeToValue: '1-2 weeks'
    });
  }

  // Win 2: From lowest dimension score
  const sortedDimensions = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
  if (sortedDimensions.length > 0) {
    const lowestDim = sortedDimensions[0];
    const dimLabel = dimensionLabels[lowestDim.dimension_key] || lowestDim.dimension_key;
    
    const improvementMap: Record<string, { title: string; impact: string }> = {
      ai_fluency: {
        title: 'Launch Weekly AI Tool Training',
        impact: `Your ${dimLabel} score (${lowestDim.score_numeric}/100) suggests starting with hands-on practice. Dedicate 30 minutes weekly to experiment with AI tools in your actual workflow.`
      },
      decision_velocity: {
        title: 'Create AI-Assisted Decision Framework',
        impact: `With ${dimLabel} at ${lowestDim.score_numeric}/100, use AI to pre-analyze options and surface key tradeoffs before meetings, cutting decision time by 40%.`
      },
      experimentation_cadence: {
        title: 'Start a Small AI Pilot This Month',
        impact: `Your ${dimLabel} score (${lowestDim.score_numeric}/100) shows opportunity. Pick one repetitive process, test an AI solution for 2 weeks, and measure time saved.`
      },
      delegation_augmentation: {
        title: 'Automate Your Top Repetitive Task',
        impact: `${dimLabel} at ${lowestDim.score_numeric}/100 indicates delegation gaps. Identify your most time-consuming repetitive task and explore AI automation to reclaim 5-8 hours weekly.`
      },
      alignment_communication: {
        title: 'Build Stakeholder Communication Templates',
        impact: `With ${dimLabel} at ${lowestDim.score_numeric}/100, create AI-powered templates for common stakeholder updates to ensure consistent, clear messaging.`
      },
      risk_governance: {
        title: 'Draft AI Usage Guidelines',
        impact: `Your ${dimLabel} score (${lowestDim.score_numeric}/100) suggests establishing basic AI usage principles now, before risks emerge. Start with a one-page policy.`
      }
    };

    const improvement = improvementMap[lowestDim.dimension_key];
    if (improvement) {
      wins.push({
        title: improvement.title,
        impact: improvement.impact,
        timeToValue: '2-3 weeks'
      });
    }
  }

  // Win 3: From risk signal if available
  if (results.riskSignals.length > 0) {
    const topRisk = results.riskSignals[0];
    const riskWinMap: Record<string, { title: string; impact: string }> = {
      skills_gap: {
        title: 'Invest in Targeted AI Upskilling',
        impact: 'Address immediate capability gaps with focused training on the tools most relevant to your role and industry.'
      },
      shadow_ai: {
        title: 'Establish Team AI Tool Inventory',
        impact: 'Uncover what tools your team is already using informally, then standardize on secure, approved solutions.'
      },
      roi_leakage: {
        title: 'Track AI Time Savings Weekly',
        impact: 'Start measuring time saved on AI-assisted tasks to build your ROI case and identify high-value use cases.'
      },
      decision_friction: {
        title: 'Map Decision Bottlenecks',
        impact: 'Document where decisions stall in your workflow, then test AI tools to accelerate analysis and consensus-building.'
      }
    };

    const riskWin = riskWinMap[topRisk.risk_key as keyof typeof riskWinMap];
    if (riskWin && wins.length < 3) {
      wins.push({
        title: riskWin.title,
        impact: riskWin.impact,
        timeToValue: '1 month'
      });
    }
  }

  return wins.slice(0, 3); // Max 3 quick wins
}
