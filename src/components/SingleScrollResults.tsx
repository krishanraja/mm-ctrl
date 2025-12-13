import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import mindmakerLogo from '@/assets/mindmaker-logo.png';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileData } from './DeepProfileQuestionnaire';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';
import { ConsentManager } from './ConsentManager';
import { BenchmarkComparison } from './BenchmarkComparison';
import { TensionCard } from '@/components/ui/tension-card';
import { RiskSignalCard } from '@/components/ui/risk-signal-card';
import { UnlockResultsForm, UnlockFormData } from './UnlockResultsForm';

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
    privacy: false
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Restore assessment ID and fetch data
  useEffect(() => {
    const fetchData = async () => {
      const { getPersistedAssessmentId } = await import('@/utils/assessmentPersistence');
      const { assessmentId: storedId } = getPersistedAssessmentId();
      
      if (storedId && isValidUUID(storedId)) {
        try {
          const result = await aggregateLeaderResults(storedId, false);
          setData(result);
        } catch (error) {
          console.error('Failed to fetch results:', error);
        }
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUnlock = async (formData: UnlockFormData) => {
    setUnlockLoading(true);
    try {
      // TODO: Implement actual signup with Supabase auth
      // For now, just unlock the results
      console.log('Unlock form submitted:', formData);
      
      // Simulate brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsUnlocked(true);
      toast.success('Full results unlocked!');
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error('Failed to unlock results. Please try again.');
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
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopiedPromptIdx(null), 2000);
    } catch (err) {
      toast.error('Failed to copy prompt');
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
    <div className="bg-background min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        
        {/* 1. Score Card - Always Visible with Animation */}
        <Card className="mb-6 shadow-lg border rounded-xl overflow-hidden animate-fade-in">
          <div className={`bg-gradient-to-br ${getScoreCardGradient(data?.benchmarkTier || '', data?.benchmarkScore || 0)} p-6 sm:p-8`}>
            {/* Logo + Title - Left Aligned, 3x Larger (192px) */}
            <div className="flex flex-col items-start mb-6">
              <img 
                src={mindmakerLogo} 
                alt="Mindmaker" 
                className="w-48 h-auto mb-4 animate-scale-in" 
                style={{ animationDelay: '0.1s' }}
              />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                AI Leadership Benchmark
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Your personalized leadership insights</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
              <div className="text-center sm:text-left">
                <div 
                  className={`text-5xl sm:text-6xl font-bold mb-2 transition-all duration-500 ${getScoreGlowColor(data?.benchmarkTier || '', data?.benchmarkScore || 0)}`}
                  style={{ animationDelay: '0.2s' }}
                >
                  {data?.benchmarkScore || 0}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge className={`${getTierColor(data?.benchmarkTier || '')} px-3 py-1`}>
                  {data?.benchmarkTier || 'Calculating...'} Tier
                </Badge>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">vs 500+ executives</span>
                  <span className="font-medium text-foreground">Top {data?.benchmarkScore ? Math.max(1, 100 - data.benchmarkScore) : '--'}%</span>
                </div>
                <Progress value={data?.benchmarkScore || 0} className="h-2" />
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

        {/* GATED CONTENT: Unlock Form or Full Results */}
        {!isUnlocked ? (
          <>
            {/* Unlock Form */}
            <div className="mb-6">
              <UnlockResultsForm onSubmit={handleUnlock} isLoading={unlockLoading} />
            </div>

            {/* Blurred Preview of Locked Content */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-center justify-center">
                <div className="text-center p-4">
                  <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Unlock to see peer comparison, prompts & more</p>
                </div>
              </div>
              <div className="blur-sm pointer-events-none opacity-50">
                {/* Placeholder cards */}
                <Card className="mb-4 h-48 bg-secondary/20" />
                <Card className="mb-4 h-32 bg-secondary/20" />
                <Card className="h-32 bg-secondary/20" />
              </div>
            </div>
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
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.prompts ? 'rotate-180' : ''}`} />
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
