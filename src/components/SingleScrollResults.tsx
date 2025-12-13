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
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mindmakerLogo from '@/assets/mindmaker-logo.png';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileData } from './DeepProfileQuestionnaire';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';
import { ConsentManager } from './ConsentManager';

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
    case 'leading': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'advancing': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'establishing': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'emerging': return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
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
        
        {/* 1. Score Card - Always Visible */}
        <Card className="mb-6 shadow-sm border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <img src={mindmakerLogo} alt="Mindmaker" className="h-8 w-8 object-contain" />
              <span className="text-sm font-medium text-muted-foreground">AI Leadership Benchmark</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
              <div>
                <div className="text-5xl sm:text-6xl font-bold text-foreground mb-2">
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

        {/* 2. #1 Tension - Prominent */}
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

        {/* 4. Peer Position Summary */}
        {data?.leadershipComparison && (
          <Card className="mb-6 shadow-sm border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Peer Comparison</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{data.leadershipComparison.dimensions?.length || 6}</div>
                  <div className="text-xs text-muted-foreground">Dimensions Analyzed</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {data.leadershipComparison.dimensions?.[0]?.percentile || '--'}%
                  </div>
                  <div className="text-xs text-muted-foreground">Top Dimension</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-xs text-muted-foreground">Executives Compared</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{data.benchmarkTier}</div>
                  <div className="text-xs text-muted-foreground">Your Tier</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expandable Sections */}
        <div className="space-y-4">
          
          {/* All Tensions */}
          {data?.tensions && data.tensions.length > 1 && (
            <Collapsible open={expandedSections.tensions} onOpenChange={() => toggleSection('tensions')}>
              <Card className="shadow-sm border rounded-xl">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-base font-semibold">All Tensions ({data.tensions.length})</CardTitle>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.tensions ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4 space-y-3">
                    {data.tensions.slice(1).map((tension, idx) => (
                      <div key={idx} className="p-3 bg-secondary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">{tension.summary_line}</p>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Risks */}
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
                      <div key={idx} className="p-3 bg-secondary/20 rounded-lg flex items-start gap-3">
                        <Badge className={`shrink-0 ${getRiskColor(risk.level)}`}>{risk.level}</Badge>
                        <p className="text-sm text-muted-foreground">{risk.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Prompt Library */}
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
                  <CardContent className="pt-0 pb-4 px-4 space-y-3">
                    {data.promptSets.map((set, idx) => (
                      <div key={idx} className="p-4 bg-secondary/20 rounded-lg">
                        <h4 className="font-medium text-foreground mb-1">{set.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{set.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {Array.isArray(set.prompts_json) ? set.prompts_json.length : 0} prompts
                        </Badge>
                      </div>
                    ))}
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

        {/* Prompt Coach CTA */}
        <Card className="mt-8 shadow-sm border rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
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

      </div>
    </div>
  );
};
