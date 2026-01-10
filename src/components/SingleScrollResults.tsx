import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Users, 
  Sparkles,
  Target,
  ArrowRight,
  Shield,
  MessageSquare,
  Zap,
  Copy,
  Check,
  BarChart3,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mindmakerLogo from '@/assets/mindmaker-logo.png';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileData } from './DeepProfileQuestionnaire';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';
import { ConsentManager } from './ConsentManager';
import { BenchmarkComparison } from './BenchmarkComparison';
import { TensionCard } from '@/components/ui/tension-card';
import { RiskSignalCard } from '@/components/ui/risk-signal-card';
import { UnlockResultsForm, UnlockFormData } from './UnlockResultsForm';
import { ArrowRightCircle } from 'lucide-react';

interface SingleScrollResultsProps {
  assessmentData: any;
  promptLibrary: any;
  contactData: ContactData;
  deepProfileData: DeepProfileData | null;
  sessionId: string | null;
  onBack?: () => void;
}

// Use the same type from aggregateLeaderResults
import { AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'leading': 
    case 'ai-orchestrator':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'advancing': 
    case 'ai-confident':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'establishing': 
    case 'ai-aware':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'emerging': 
    case 'ai-emerging':
      return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
    default: return 'bg-primary/10 text-primary border-primary/30';
  }
};

const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'high': return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
  }
};

// Dynamic gradient based on tier and score
const getScoreCardGradient = (tier: string, score: number) => {
  const tierLower = tier?.toLowerCase() || '';
  if (score >= 80 || tierLower.includes('orchestrator') || tierLower.includes('leading')) {
    return 'from-emerald-500/20 via-emerald-400/10 to-transparent';
  }
  if (score >= 60 || tierLower.includes('confident') || tierLower.includes('advancing')) {
    return 'from-blue-500/20 via-blue-400/10 to-transparent';
  }
  if (score >= 40 || tierLower.includes('aware') || tierLower.includes('establishing')) {
    return 'from-amber-500/20 via-amber-400/10 to-transparent';
  }
  return 'from-slate-500/20 via-slate-400/10 to-transparent';
};

// Glow color based on tier
const getScoreGlowColor = (tier: string, score: number) => {
  const tierLower = tier?.toLowerCase() || '';
  if (score >= 80 || tierLower.includes('orchestrator') || tierLower.includes('leading')) {
    return 'text-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]';
  }
  if (score >= 60 || tierLower.includes('confident') || tierLower.includes('advancing')) {
    return 'text-blue-600 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]';
  }
  if (score >= 40 || tierLower.includes('aware') || tierLower.includes('establishing')) {
    return 'text-amber-600 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]';
  }
  return 'text-foreground';
};

export const SingleScrollResults: React.FC<SingleScrollResultsProps> = ({
  assessmentData,
  promptLibrary,
  contactData,
  deepProfileData,
  sessionId,
  onBack
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<AggregatedLeaderResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tensions: false,
    risks: false,
    prompts: false,
    privacy: false,
    unlock: false // Collapsed by default
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fix #3: Restore assessment ID and fetch data with generation status polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const fetchData = async () => {
      const { getPersistedAssessmentId } = await import('@/utils/assessmentPersistence');
      const { assessmentId: storedId } = getPersistedAssessmentId();
      
      if (!storedId || !isValidUUID(storedId)) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Check generation status first
        const { data: assessment } = await supabase
          .from('leader_assessments')
          .select('generation_status')
          .eq('id', storedId)
          .single();

        const generationStatus = assessment?.generation_status as any;
        const isGenerating = generationStatus && (
          !generationStatus.insights_generated ||
          !generationStatus.prompts_generated ||
          !generationStatus.risks_computed ||
          !generationStatus.tensions_computed ||
          !generationStatus.scenarios_generated
        );

        // Fetch results
        const result = await aggregateLeaderResults(storedId, false);
        
        if (isMounted) {
          setData(result);
          setLoading(false);
        }

        // If still generating, start polling
        if (isGenerating && isMounted && !pollInterval) {
          pollInterval = setInterval(async () => {
            try {
              const updatedResult = await aggregateLeaderResults(storedId, false);
              if (isMounted) {
                setData(updatedResult);
              }
              
              // Check if generation is complete
              const { data: checkAssessment } = await supabase
                .from('leader_assessments')
                .select('generation_status')
                .eq('id', storedId)
                .single();
              
              const updatedStatus = checkAssessment?.generation_status as any;
              const stillGenerating = updatedStatus && (
                !updatedStatus.insights_generated ||
                !updatedStatus.prompts_generated ||
                !updatedStatus.risks_computed ||
                !updatedStatus.tensions_computed ||
                !updatedStatus.scenarios_generated
              );
              
              if (!stillGenerating && pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, 3000); // Poll every 3 seconds
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUnlock = async (formData: UnlockFormData) => {
    setUnlockLoading(true);
    setUnlockError(null);
    try {
      // Create account with Supabase Auth
      const { supabase } = await import('@/integrations/supabase/client');
      const { getPersistedAssessmentId, linkAssessmentToUser } = await import('@/utils/assessmentPersistence');
      const { invokeEdgeFunction } = await import('@/utils/edgeFunctionClient');
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            department: formData.department,
          }
        }
      });

      if (authError) {
        // If user already exists, try to sign them in instead
        if (authError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          
          if (signInError) {
            setUnlockError('Account exists but password is incorrect. Please try signing in.');
            return;
          }
        } else {
          setUnlockError(authError.message);
          return;
        }
      }
      
      // Link the assessment to the user if we have one
      const { assessmentId: storedId } = getPersistedAssessmentId();
      if (storedId && authData?.user?.id) {
        await linkAssessmentToUser(storedId, authData.user.id);
      }
      
      // Send notification email via Resend
      try {
        await invokeEdgeFunction('send-diagnostic-email', {
          data: {
            firstName: formData.fullName.split(' ')[0],
            lastName: formData.fullName.split(' ').slice(1).join(' '),
            email: formData.email,
            title: formData.department,
            primaryFocus: formData.primaryFocus,
            consentToInsights: formData.consentToInsights,
            // Include benchmark data for email
            benchmarkScore: data?.benchmarkScore,
            benchmarkTier: data?.benchmarkTier
          },
          scores: { total: data?.benchmarkScore || 0 },
          contactType: 'results_unlock',
          sessionId: sessionId
        }, { logPrefix: '📧' });
        console.log('✅ Unlock notification email sent');
      } catch (emailError) {
        console.error('❌ Email notification failed (non-blocking):', emailError);
        // Don't block unlock if email fails
      }
      
      setIsUnlocked(true);
    } catch (error: any) {
      console.error('Unlock error:', error);
      setUnlockError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setUnlockLoading(false);
    }
  };

  // Track which prompt was just copied
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<string | null>(null);

  const handleCopyPrompt = async (prompt: string, idx: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPromptIdx(idx);
      // Show toast for better visibility
      const { toast } = await import('sonner');
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedPromptIdx(null), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
      const { toast } = await import('sonner');
      toast.error('Failed to copy');
    }
  };

  const handleDownloadPrompts = (promptSets: any[]) => {
    try {
      const allPromptsText = promptSets
        .map((set: any) => {
          const prompts = Array.isArray(set.prompts_json) ? set.prompts_json : [];
          return `## ${set.title}\n\n${set.description ? `${set.description}\n\n` : ''}${set.what_its_for ? `**What it's for:** ${set.what_its_for}\n\n` : ''}${set.when_to_use ? `**When to use:** ${set.when_to_use}\n\n` : ''}${set.how_to_use ? `**How to use:** ${set.how_to_use}\n\n` : ''}### Prompts:\n\n${prompts.map((p: string | { text?: string; prompt?: string }, i: number) => {
            const promptText = typeof p === 'string' ? p : (p?.text || p?.prompt || '');
            return `${i + 1}. ${promptText}`;
          }).join('\n\n')}`;
        })
        .join('\n\n---\n\n');

      const blob = new Blob([allPromptsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmaker-prompt-library-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const { toast } = require('sonner');
      toast.success('Prompt library downloaded');
    } catch (err) {
      console.error('Failed to download prompts:', err);
      const { toast } = require('sonner');
      toast.error('Failed to download');
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  const primaryTension = data?.tensions?.[0];
  const primaryMove = data?.firstMoves?.[0];
  const topRisks = data?.riskSignals?.slice(0, 3) || [];

  return (
    <div className="bg-background min-h-[100dvh] py-4 sm:py-6">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-4xl">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <img 
            src="/2.png" 
            alt="Mindmaker" 
            className="h-6 sm:h-7 w-auto"
          />
          <span className="text-xs sm:text-sm text-muted-foreground">Your Results</span>
        </div>

        {/* Ongoing loop CTA (keeps baseline as "starting point") */}
        <Card className="mb-4 sm:mb-6 shadow-sm border rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 p-2 bg-primary/10 rounded-lg">
                  <ArrowRightCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Make this compound weekly</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Weekly 30s check-ins + decision capture when you’re stuck.
                  </div>
                </div>
              </div>
              <div className="sm:ml-auto">
                <Button variant="cta" onClick={() => navigate('/today')} className="w-full sm:w-auto">
                  Go to Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 1. Score Card - Always Visible with Animation */}
        <Card className="mb-4 sm:mb-6 shadow-lg border rounded-xl overflow-hidden animate-fade-in">
          <div className={`bg-gradient-to-br ${getScoreCardGradient(data?.benchmarkTier || '', data?.benchmarkScore || 0)} p-4 sm:p-6`}>
            {/* Logo + Title - Left Aligned */}
            <div className="flex flex-col items-start mb-4 sm:mb-6">
              <img 
                src={mindmakerLogo} 
                alt="Mindmaker" 
                className="w-32 sm:w-36 h-auto mb-3 animate-scale-in" 
                style={{ animationDelay: '0.1s' }}
              />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                AI Leadership Benchmark
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your personalized leadership insights</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
              <div className="text-center sm:text-left">
                <div 
                  className={`text-4xl sm:text-5xl font-bold mb-1 sm:mb-2 transition-all duration-500 ${getScoreGlowColor(data?.benchmarkTier || '', data?.benchmarkScore || 0)}`}
                  style={{ animationDelay: '0.2s' }}
                >
                  {data?.benchmarkScore || 0}
                  <span className="text-lg sm:text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge className={`${getTierColor(data?.benchmarkTier || '')} px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm mb-2`}>
                  {data?.benchmarkTier || 'Calculating...'} Tier
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Your AI leadership capability score based on 6 dimensions: strategic vision, experimentation, delegation, data quality, team capability, and governance.
                </p>
              </div>
              
              <div className="flex-1 space-y-1 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">vs 500+ executives</span>
                  <span className="font-medium text-foreground">Top {data?.benchmarkScore ? Math.max(1, 100 - data.benchmarkScore) : '--'}%</span>
                </div>
                <Progress value={data?.benchmarkScore || 0} className="h-1.5 sm:h-2" />
              </div>
            </div>
          </div>
        </Card>

        {/* Prompt Coach CTA - High Visibility */}
        <Card className="mb-6 shadow-sm border rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0 p-3 bg-primary/10 rounded-full">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-foreground">Practice Your Prompts</h3>
                <p className="text-sm text-muted-foreground">
                  Test any AI prompt before you use it. Get instant feedback on what's working.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/coach')}
                className="group whitespace-nowrap"
              >
                Try Prompt Coach
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {primaryTension && (
          <Card className="mb-6 shadow-sm border rounded-xl border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Your #1 Tension</h3>
                    <Badge variant="outline" className="text-xs">Priority Focus</Badge>
                  </div>
              <p className="text-muted-foreground leading-relaxed">
                {primaryTension.summary_line}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Next Move - Actionable */}
        {primaryMove && (
          <Card className="mb-6 shadow-sm border rounded-xl border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-2 bg-emerald-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Your Next Move</h3>
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">This Week</Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {primaryMove.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show dimension scores preview for everyone */}
        {data?.dimensionScores && data.dimensionScores.length > 0 && (
          <Card className="mb-6 shadow-sm border rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Your Dimension Scores
              </h3>
              <div className="space-y-3">
                {data.dimensionScores.slice(0, 6).map((dim, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {dim.dimension_key?.replace(/_/g, ' ') || 'Dimension'}
                      </span>
                      <span className="font-medium text-foreground">{dim.score_numeric}/100</span>
                    </div>
                    <Progress value={dim.score_numeric} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show top risk signal preview for everyone */}
        {topRisks.length > 0 && (
          <Card className="mb-6 shadow-sm border rounded-xl border-l-4 border-l-red-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Top Risk Signal</h3>
                    <Badge className={getRiskColor(topRisks[0].level || 'medium')}>
                      {topRisks[0].level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {topRisks[0].description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GATED CONTENT: Unlock Form or Full Results */}
        {!isUnlocked ? (
          <>
            {/* HOOK: Preview of locked content FIRST to create urgency */}
            <div className="relative rounded-xl overflow-hidden mb-4">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-4">
                <div className="text-center p-3">
                  <Lock className="h-5 w-5 text-primary mx-auto mb-1.5" />
                  <p className="text-xs sm:text-sm font-medium text-foreground">Unlock to see peer comparison, full prompt library & more</p>
                </div>
              </div>
              <div className="blur-sm pointer-events-none opacity-50 space-y-3">
                <Card className="h-32 bg-gradient-to-br from-primary/10 to-secondary/20" />
                <Card className="h-20 bg-secondary/20" />
              </div>
            </div>

            {/* THEN: Collapsible Unlock Form */}
            <Collapsible open={expandedSections.unlock} onOpenChange={() => toggleSection('unlock')}>
              <Card className="mb-6 shadow-lg border rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-base sm:text-lg font-semibold">Unlock Your Full Results</CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Create an account for personalized prompts, peer comparison & more
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.unlock ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    {unlockError && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        {unlockError}
                      </div>
                    )}
                    <UnlockResultsForm onSubmit={handleUnlock} isLoading={unlockLoading} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </>
        ) : (
          <>
            {/* 4. Visual Peer Comparison - FOMO-inducing Graph (UNLOCKED) */}
            {data?.leadershipComparison && (
              <Card className="mb-6 shadow-sm border rounded-xl overflow-hidden animate-fade-in">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Your Position Among 500+ Executives</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <BenchmarkComparison
                    userScore={data.benchmarkScore || 0}
                    userTier={data.benchmarkTier || ''}
                    leadershipComparison={data.leadershipComparison}
                    showCohortToggle={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Expandable Sections (UNLOCKED) */}
            <div className="space-y-4">
          
          {/* All Tensions - Rich Cards */}
          {data?.tensions && data.tensions.length > 1 && (
            <Collapsible open={expandedSections.tensions} onOpenChange={() => toggleSection('tensions')}>
              <Card className="shadow-sm border rounded-xl">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-base font-semibold">Strategic Tensions ({data.tensions.length})</CardTitle>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.tensions ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4 space-y-3">
                    {data.tensions.slice(1).map((tension, idx) => (
                      <TensionCard 
                        key={idx} 
                        tension={{
                          dimension_key: tension.dimension_key || 'general',
                          summary_line: tension.summary_line,
                          priority_rank: tension.priority_rank || idx + 2
                        }} 
                      />
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Risks - Rich Signal Cards */}
          {topRisks.length > 0 && (
            <Collapsible open={expandedSections.risks} onOpenChange={() => toggleSection('risks')}>
              <Card className="shadow-sm border rounded-xl">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <CardTitle className="text-base font-semibold">Risk Signals ({topRisks.length})</CardTitle>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.risks ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4 space-y-3">
                    {topRisks.map((risk, idx) => (
                      <RiskSignalCard 
                        key={idx} 
                        signal={{
                          risk_key: risk.risk_key || 'shadow_ai',
                          level: (risk.level as 'low' | 'medium' | 'high') || 'medium',
                          description: risk.description,
                          priority_rank: risk.priority_rank || idx + 1
                        }} 
                      />
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Prompt Library - Expandable with Copy */}
          {data?.promptSets && data.promptSets.length > 0 && (
            <Collapsible open={expandedSections.prompts} onOpenChange={() => toggleSection('prompts')}>
              <Card className="shadow-sm border rounded-xl">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base font-semibold">Your Prompt Library ({data.promptSets.length} sets)</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPrompts(data.promptSets);
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.prompts ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4 space-y-4">
                    {data.promptSets.map((set, setIdx) => {
                      const prompts = Array.isArray(set.prompts_json) ? set.prompts_json : [];
                      return (
                        <Collapsible key={setIdx}>
                          <Card className="border bg-card">
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="text-left">
                                    <h4 className="font-semibold text-foreground">{set.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{set.description}</p>
                                    {set.what_its_for && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        <strong>What it's for:</strong> {set.what_its_for}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="text-xs">
                                      {prompts.length} prompts
                                    </Badge>
                                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 px-4 space-y-3">
                                {set.when_to_use && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">When to use:</strong> {set.when_to_use}
                                  </p>
                                )}
                                {set.how_to_use && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">How to use:</strong> {set.how_to_use}
                                  </p>
                                )}
                                <div className="space-y-2 mt-4">
                                  {prompts.map((prompt: string | { text?: string; prompt?: string }, promptIdx: number) => {
                                    const promptText = typeof prompt === 'string' ? prompt : (prompt?.text || prompt?.prompt || '');
                                    const uniqueKey = `${setIdx}-${promptIdx}`;
                                    return (
                                      <div 
                                        key={promptIdx} 
                                        className="p-3 bg-secondary/30 rounded-lg border border-border/50 group"
                                      >
                                        <div className="flex items-start gap-3">
                                          <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                            {promptIdx + 1}
                                          </span>
                                          <p className="flex-1 text-sm text-foreground leading-relaxed font-mono">
                                            {promptText}
                                          </p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyPrompt(promptText, uniqueKey);
                                            }}
                                            className="shrink-0 h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                                          >
                                            {copiedPromptIdx === uniqueKey ? (
                                              <Check className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Privacy Settings */}
          <Collapsible open={expandedSections.privacy} onOpenChange={() => toggleSection('privacy')}>
            <Card className="shadow-sm border rounded-xl">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">Privacy Settings</CardTitle>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.privacy ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4">
                  <ConsentManager
                    userId={sessionId || undefined}
                    onUpdate={(consent) => console.log('Consent updated:', consent)}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
          </>
        )}


      </div>
    </div>
  );
};
