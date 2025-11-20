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
import { Crown, Sparkles, Target, TrendingUp, Lock, Loader2, Download, LogIn, LogOut, ArrowRight } from 'lucide-react';
import { ContactData } from './ContactCollectionForm';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import AuthScreen from './auth/AuthScreen';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [user, setUser] = useState<User | null>(null);
  const { createPaymentSession } = usePayment();
  const { toast } = useToast();

  // Handle authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // PHASE 1: Sign-in modal instead of redirect
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleAuth = async () => {
    if (user) {
      await supabase.auth.signOut();
      toast({ title: 'Signed out successfully' });
    } else {
      setAuthModalOpen(true); // Open modal instead of redirect
    }
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);
    
    // Link assessment to user
    const { linkAssessmentToUser } = await import('@/utils/assessmentPersistence');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser) {
      const linked = await linkAssessmentToUser(assessmentId, currentUser.id);
      if (linked) {
        toast({
          title: 'Assessment Saved!',
          description: 'Your results are now linked to your account',
        });
        // Reload results to reflect user ownership
        loadResults();
      }
    }
  };

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
            <div className="flex items-center gap-2">
              <Button onClick={handleUpgradeClick} size="sm">
                Upgrade
              </Button>
              <Button 
                onClick={handleAuth} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                {user ? (
                  <>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </div>
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

      {/* Executive Summary Section */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle>What Your {results.benchmarkScore}/100 Score Means</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">You're {results.benchmarkTier === 'AI-Leading' ? 'in the top 15%' : results.benchmarkTier === 'AI-Advancing' ? 'in the upper-middle 25%' : results.benchmarkTier === 'AI-Aware' ? 'in the middle 40%' : 'building your foundation'} of leaders.</span>{' '}
            {results.benchmarkScore >= 70 ? 'You have strong AI adoption muscle and are positioned to scale.' : results.benchmarkScore >= 50 ? 'Solid foundation, but missing the AI leverage that top 20% executives have mastered.' : 'You understand AI\'s potential but haven\'t built systematic adoption muscle yet.'}
          </p>
          {(() => {
            const sortedDims = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
            const lowestDim = sortedDims[0];
            const highestDim = sortedDims[sortedDims.length - 1];
            const dimLabels = {
              ai_fluency: 'AI Fluency',
              decision_velocity: 'Decision Velocity',
              experimentation_cadence: 'Experimentation',
              delegation_augmentation: 'Delegation',
              alignment_communication: 'Alignment',
              risk_governance: 'Risk Management'
            };
            const lowestLabel = dimLabels[lowestDim.dimension_key as keyof typeof dimLabels];
            const highestLabel = dimLabels[highestDim.dimension_key as keyof typeof dimLabels];
            const gap = Math.round(highestDim.score_numeric - lowestDim.score_numeric);
            
            return (
              <>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">The Gap:</span> Your scores show strong {highestLabel} ({Math.round(highestDim.score_numeric)}/100) but weaker {lowestLabel} ({Math.round(lowestDim.score_numeric)}/100). 
                  This {gap}-point gap is typical of leaders who understand AI but haven't systematized execution.
                </p>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Path Forward:</span> Focus on {lowestLabel} first. Improving from {Math.round(lowestDim.score_numeric)} to {Math.min(100, Math.round(lowestDim.score_numeric) + 15)} will lift your overall score by 8-12 points and unlock compound benefits in other areas.
                </p>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Your Biggest Lever Analysis */}
      {(() => {
        const sortedDims = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
        const lowestDim = sortedDims[0];
        const dimLabels = {
          ai_fluency: 'AI Fluency',
          decision_velocity: 'Decision Velocity',
          experimentation_cadence: 'Experimentation',
          delegation_augmentation: 'Delegation',
          alignment_communication: 'Alignment',
          risk_governance: 'Risk Management'
        };
        const label = dimLabels[lowestDim.dimension_key as keyof typeof dimLabels];
        const current = Math.round(lowestDim.score_numeric);
        const target = Math.min(100, current + 20);
        const impact = Math.round((target - current) * 0.6);
        
        const leverInsights = {
          ai_fluency: {
            why: 'AI Fluency is your foundation. Without hands-on tool mastery, strategic decisions lack grounding and team adoption stalls.',
            action: 'Commit to 30 minutes daily practicing AI tools in your actual workflow. Start with meeting prep automation.',
            outcome: `Within 2 weeks, you'll reclaim 3-5 hours weekly and have credibility to drive team adoption.`
          },
          decision_velocity: {
            why: 'Slow decisions compound. Every delayed choice costs momentum and gives competitors time to move.',
            action: 'Use AI to pre-analyze options before meetings. Generate tradeoff matrices and stakeholder impact assessments.',
            outcome: 'Cut decision time by 40% and make higher-quality calls with quantified risks.'
          },
          experimentation_cadence: {
            why: 'Without regular pilots, you\'re theorizing instead of learning. Competitors are building real AI muscle.',
            action: 'Launch a 2-week pilot on one repetitive process this month. Measure time saved and iterate.',
            outcome: 'Build confidence through proof points and establish a systematic testing rhythm.'
          },
          delegation_augmentation: {
            why: 'Every hour you spend on automatable work is an hour not spent on strategy. This gap scales linearly with time.',
            action: 'Identify your top 3 time-wasters and automate the most repetitive one using AI tools.',
            outcome: 'Reclaim 5-8 hours weekly and model effective AI delegation for your team.'
          },
          alignment_communication: {
            why: 'Misaligned stakeholders create friction that slows every initiative. Clear communication is your force multiplier.',
            action: 'Build AI-powered templates for stakeholder updates that address their specific priorities.',
            outcome: 'Reduce alignment meetings by 30% and accelerate initiative approvals.'
          },
          risk_governance: {
            why: 'Unmanaged AI risk creates future crises. Early guardrails cost hours now but prevent months of cleanup later.',
            action: 'Draft a one-page AI usage policy covering data sensitivity, approval workflows, and tool standards.',
            outcome: 'Prevent shadow AI proliferation and build foundation for scaled adoption.'
          }
        };
        
        const insight = leverInsights[lowestDim.dimension_key as keyof typeof leverInsights];
        
        return (
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Your Single Biggest Lever: {label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-foreground">{current}</span>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <span className="text-4xl font-bold text-primary">{target}</span>
                <span className="text-sm text-muted-foreground">= +{impact} overall points</span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Why this matters:</span> {insight.why}</p>
                <p><span className="font-semibold">Your specific action:</span> {insight.action}</p>
                <p><span className="font-semibold">Expected outcome:</span> {insight.outcome}</p>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick Wins Section - Free Tier Value */}
      {generateQuickWins(results, contactData).length > 0 && (
        <QuickWinsCard wins={generateQuickWins(results, contactData)} />
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
        <div>
          <h3 className="text-lg font-semibold">Leadership Dimensions</h3>
          {(() => {
            const sorted = [...results.dimensionScores].sort((a, b) => b.score_numeric - a.score_numeric);
            const strongest = sorted[0];
            const weakest = sorted[sorted.length - 1];
            const dimLabels = {
              ai_fluency: 'AI Fluency',
              decision_velocity: 'Decision Velocity',
              experimentation_cadence: 'Experimentation',
              delegation_augmentation: 'Delegation',
              alignment_communication: 'Alignment',
              risk_governance: 'Risk Management'
            };
            const strongLabel = dimLabels[strongest.dimension_key as keyof typeof dimLabels];
            const weakLabel = dimLabels[weakest.dimension_key as keyof typeof dimLabels];
            
            return (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your pattern: Strong {strongLabel} ({Math.round(strongest.score_numeric)}/100) but weaker {weakLabel} ({Math.round(weakest.score_numeric)}/100). 
                This gap creates tension—{strongest.score_numeric > 70 ? 'you envision possibilities but struggle to execute systematically' : 'you have foundation but lack strategic integration'}. 
                Strengthening {weakLabel} will amplify your existing strength in {strongLabel}.
              </p>
            );
          })()}
        </div>
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
                    <span className="text-2xl font-bold">{Math.round(dim.score_numeric)}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <Progress value={Math.round(dim.score_numeric)} className="h-2" />
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

// Generate quick wins from available data with personalization
function generateQuickWins(
  results: AggregatedLeaderResults, 
  contactData?: { roleTitle?: string; companyName?: string; companySize?: string; industry?: string }
): Array<{ title: string; impact: string; timeToValue: string }> {
  const wins: Array<{ title: string; impact: string; timeToValue: string }> = [];
  
  const role = contactData?.roleTitle || 'leader';
  const company = contactData?.companyName || 'your organization';
  const size = contactData?.companySize || 'similar-sized';
  const industry = contactData?.industry || 'your industry';

  // Win 1: From first move if available - make it personal and urgent
  if (results.firstMoves.length > 0) {
    const firstMove = results.firstMoves[0];
    const actionPhrase = firstMove.content.split('.')[0];
    wins.push({
      title: `Your Priority: ${actionPhrase}`,
      impact: `As ${role}, ${firstMove.content} This is your highest-leverage move right now.`,
      timeToValue: '1-2 weeks'
    });
  }

  // Win 2: From lowest dimension score - contextualize to their role
  const sortedDimensions = [...results.dimensionScores].sort((a, b) => a.score_numeric - b.score_numeric);
  if (sortedDimensions.length > 0) {
    const lowestDim = sortedDimensions[0];
    const dimLabel = dimensionLabels[lowestDim.dimension_key] || lowestDim.dimension_key;
    const score = Math.round(lowestDim.score_numeric);
    
    const improvementMap: Record<string, { title: string; impact: string }> = {
      ai_fluency: {
        title: `Your ${dimLabel} Gap Is Costing You 8+ Hours/Week`,
        impact: `As ${role} at ${company}, your ${score}/100 ${dimLabel} score means you're manually doing work that 73% of ${industry} leaders have automated. Commit to 30 minutes daily practicing AI tools in your actual workflow. Within 2 weeks: reclaim 5-8 hours weekly.`
      },
      decision_velocity: {
        title: `Accelerate Decisions: Cut ${dimLabel} Time by 40%`,
        impact: `With ${dimLabel} at ${score}/100, you're spending 2-3x longer on decisions than peers. Use AI to pre-analyze options before meetings—generate tradeoff matrices and stakeholder impact assessments. For ${role}s at ${size} companies, this typically saves 6-10 hours weekly.`
      },
      experimentation_cadence: {
        title: `Launch Your First AI Pilot This Month`,
        impact: `Your ${dimLabel} score (${score}/100) shows you're theorizing instead of learning. Pick one repetitive process at ${company}, test an AI solution for 2 weeks, measure time saved. 68% of ${industry} leaders who started small pilots saw 40%+ time savings within 30 days.`
      },
      delegation_augmentation: {
        title: `Automate Your Biggest Time-Waster Now`,
        impact: `${dimLabel} at ${score}/100 indicates serious delegation gaps. As ${role}, identify your most time-consuming repetitive task and automate it using AI. Most ${industry} executives reclaim 5-8 hours weekly within 2-3 weeks of focused automation.`
      },
      alignment_communication: {
        title: `Fix Stakeholder Misalignment in 1 Week`,
        impact: `With ${dimLabel} at ${score}/100, you're losing momentum to communication friction. Build AI-powered templates for stakeholder updates at ${company}—address their specific priorities using their language. Reduce alignment meetings by 30% and accelerate approvals.`
      },
      risk_governance: {
        title: `Prevent Future AI Crises: Draft Policy Today`,
        impact: `Your ${dimLabel} score (${score}/100) means unmanaged risk is accumulating. At ${company}, draft a one-page AI usage policy covering data sensitivity and tool standards. This takes 2 hours now but prevents months of cleanup later when shadow AI creates problems.`
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

  // Win 3: From risk signal if available - make it concrete and urgent
  if (results.riskSignals.length > 0 && wins.length < 3) {
    const topRisk = results.riskSignals[0];
    const riskWinMap: Record<string, { title: string; impact: string }> = {
      skills_gap: {
        title: 'Close Your Team\'s AI Skills Gap Fast',
        impact: `As ${role}, your team's capability gaps are slowing adoption. Focus training on the 3 tools most relevant to ${industry}—most teams see 50%+ proficiency within 3 weeks of targeted upskilling.`
      },
      shadow_ai: {
        title: 'Discover & Secure Hidden AI Tools',
        impact: `Shadow AI is proliferating at ${company}. Conduct a 1-hour team inventory of current AI tools, then standardize on secure, approved solutions. This prevents future security incidents and improves ROI tracking.`
      },
      roi_leakage: {
        title: 'Start Tracking AI ROI This Week',
        impact: `You're generating AI value but not capturing it. As ${role}, implement a simple weekly tracker for time saved on AI-assisted tasks. Within 2 weeks you'll have concrete ROI data to justify scaled investment.`
      },
      decision_friction: {
        title: 'Map & Eliminate Decision Bottlenecks',
        impact: `At ${company}, slow decisions compound cost. Document where decisions stall, then test AI tools to accelerate analysis and consensus-building. Most ${industry} teams reduce decision time by 35-50%.`
      }
    };

    const riskWin = riskWinMap[topRisk.risk_key as keyof typeof riskWinMap];
    if (riskWin) {
      wins.push({
        title: riskWin.title,
        impact: riskWin.impact,
        timeToValue: '3-4 weeks'
      });
    }
  }

  return wins.slice(0, 3); // Max 3 quick wins
}
