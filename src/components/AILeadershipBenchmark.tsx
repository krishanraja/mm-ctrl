import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, TrendingUp, Target, Brain, Lightbulb, BarChart3, Users, Calendar, Zap, CheckCircle, ArrowRight, Crown, Rocket, Sparkles, Award, Compass, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import mindmakerLogo from '@/assets/mindmaker-logo-dark.png';
import { SaveProfileDialog } from '@/components/auth/SaveProfileDialog';
import { useAssessment } from '@/contexts/AssessmentContext';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileData } from './DeepProfileQuestionnaire';
import { deriveLeadershipComparison, type LeadershipComparison } from '@/utils/scaleUpsMapping';

interface PersonalizedInsights {
  growthReadiness: { level: string; preview: string; details: string };
  leadershipStage: { stage: string; preview: string; details: string };
  keyFocus: { category: string; preview: string; details: string };
  roadmapInitiatives: Array<{
    title: string;
    description: string;
    basedOn: string[];
    impact: string;
    timeline: string;
    growthMetric: string;
    scaleUpsDimensions?: string[];
  }>;
}

interface AILeadershipBenchmarkProps {
  assessmentData: any;
  sessionId: string | null;
  contactData: ContactData;
  deepProfileData: DeepProfileData | null;
  onBack?: () => void;
  onViewToolkit?: () => void;
  onLeadershipComparisonReady?: (comparison: LeadershipComparison | null) => void;
}

const AILeadershipBenchmark: React.FC<AILeadershipBenchmarkProps> = ({
  assessmentData,
  sessionId,
  contactData,
  deepProfileData,
  onBack,
  onViewToolkit,
  onLeadershipComparisonReady
}) => {
  const { toast } = useToast();
  const { sessionId: contextSessionId } = useAssessment();
  const [personalizedInsights, setPersonalizedInsights] = useState<PersonalizedInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedDimensions, setExpandedDimensions] = useState<Record<string, boolean>>({});
  const [leadershipComparison, setLeadershipComparison] = useState<LeadershipComparison | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<LeadershipComparison['dimensions'][0] | null>(null);
  const [isSaveProfileOpen, setIsSaveProfileOpen] = useState(false);

  // Utility function to clean and validate "Based on" text
  const cleanBasedOnText = (items: string[]): string[] => {
    const labelMap: Record<string, string> = {
      'Kpi_connection': 'KPI tracking',
      'kpi_connection': 'Performance metrics',
      'KPI_CONNECTION': 'Performance tracking',
      'time_waste': 'Time optimization',
      'delegation_tasks': 'Delegation priorities',
      'work_breakdown': 'Work distribution',
      'communication_style': 'Communication preferences',
      'stakeholder_needs': 'Stakeholder requirements',
    };
    
    return items
      .filter(item => item && item.trim().length > 0)
      .map(item => {
        if (labelMap[item]) return labelMap[item];
        if (item.includes('_')) {
          return item.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
        }
        return item;
      })
      .filter((value, index, self) => self.indexOf(value) === index);
  };

  // Calculate leadership score
  const calculateLeadershipScore = (data: any) => {
    if (!data) return 0;
    const responses = Object.values(data).filter((v): v is number => typeof v === 'number');
    if (responses.length === 0) return 0;
    const sum = responses.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / (responses.length * 5)) * 100);
  };

  // Get leadership tier
  const getLeadershipTier = (score: number) => {
    if (score >= 25) return { 
      name: 'AI-Orchestrator', 
      tier: 'AI-Orchestrator',
      tagline: "You're setting the pace in AI leadership",
      description: 'Strategic AI integration across organization with clear governance and measurable outcomes.',
      icon: Crown,
      gradient: 'from-yellow-400 to-yellow-600',
      badgeStyle: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      borderGlow: 'border-yellow-500/50 shadow-yellow-500/20',
      bgGradient: 'bg-gradient-to-br from-yellow-50/50 via-background to-background'
    };
    if (score >= 19) return { 
      name: 'AI-Pathfinder', 
      tier: 'AI-Pathfinder',
      tagline: "You're actively building AI capabilities",
      description: 'Systematic approach to AI adoption with growing team capabilities and pilot programs in progress.',
      icon: Compass,
      gradient: 'from-blue-400 to-blue-600',
      badgeStyle: 'bg-blue-100 text-blue-800 border-blue-300',
      borderGlow: 'border-blue-500/50 shadow-blue-500/20',
      bgGradient: 'bg-gradient-to-br from-blue-50/50 via-background to-background'
    };
    if (score >= 13) return { 
      name: 'AI-Explorer', 
      tier: 'AI-Explorer',
      tagline: "You're beginning your AI journey",
      description: 'Initial exploration phase with interest in AI but limited structured implementation.',
      icon: Rocket,
      gradient: 'from-green-400 to-green-600',
      badgeStyle: 'bg-green-100 text-green-800 border-green-300',
      borderGlow: 'border-green-500/50 shadow-green-500/20',
      bgGradient: 'bg-gradient-to-br from-green-50/50 via-background to-background'
    };
    return { 
      name: 'AI-Curious', 
      tier: 'AI-Curious',
      tagline: "You're exploring AI possibilities",
      description: 'Early awareness stage with potential for growth in AI adoption and capability building.',
      icon: Sparkles,
      gradient: 'from-purple-400 to-purple-600',
      badgeStyle: 'bg-purple-100 text-purple-800 border-purple-300',
      borderGlow: 'border-purple-500/50 shadow-purple-500/20',
      bgGradient: 'bg-gradient-to-br from-purple-50/50 via-background to-background'
    };
  };

  const score = calculateLeadershipScore(assessmentData);
  const leadershipProfile = getLeadershipTier(score);

  // Load or generate personalized insights
  useEffect(() => {
    const loadOrGenerateInsights = async () => {
      const effectiveSessionId = sessionId || contextSessionId;
      if (!effectiveSessionId) {
        console.error('No session ID available');
        setIsLoadingInsights(false);
        return;
      }

      try {
        // Check if insights already exist
        const { data: existingProfile } = await supabase
          .from('prompt_library_profiles')
          .select('*')
          .eq('session_id', effectiveSessionId)
          .maybeSingle();

        if (existingProfile?.implementation_roadmap) {
          const insights = existingProfile.implementation_roadmap as unknown as PersonalizedInsights;
          setPersonalizedInsights(insights);
          setIsLoadingInsights(false);
          return;
        }

        // Generate new insights
        const { data, error } = await supabase.functions.invoke('generate-personalized-insights', {
          body: {
            sessionId: effectiveSessionId,
            assessmentData,
            contactData,
            deepProfileData
          }
        });

        if (error) throw error;
        if (data?.insights) {
          setPersonalizedInsights(data.insights);
        }
      } catch (error) {
        console.error('Error loading insights:', error);
        toast({
          title: "Using fallback insights",
          description: "Generated insights based on your responses",
          variant: "default"
        });
        
        // Fallback insights
        setPersonalizedInsights({
          growthReadiness: {
            level: score >= 25 ? 'High' : score >= 19 ? 'Medium-High' : score >= 13 ? 'Medium' : 'Developing',
            preview: 'Strong foundation for AI adoption',
            details: 'Your organization shows readiness for strategic AI implementation.'
          },
          leadershipStage: {
            stage: leadershipProfile.tier,
            preview: leadershipProfile.tagline,
            details: leadershipProfile.description
          },
          keyFocus: {
            category: 'Strategic Implementation',
            preview: 'Focus on structured AI adoption',
            details: 'Prioritize pilot programs and team capability building.'
          },
          roadmapInitiatives: []
        });
      } finally {
        setIsLoadingInsights(false);
      }
    };

    loadOrGenerateInsights();
  }, [sessionId, contextSessionId, assessmentData, contactData, deepProfileData, score, leadershipProfile, toast]);

  // Derive leadership comparison
  useEffect(() => {
    if (assessmentData && deepProfileData) {
      const comparison = deriveLeadershipComparison(assessmentData, deepProfileData);
      setLeadershipComparison(comparison);
      onLeadershipComparisonReady?.(comparison);
    }
  }, [assessmentData, deepProfileData, onLeadershipComparisonReady]);

  const getDimensionIcon = (dimension: string) => {
    const iconMap: Record<string, any> = {
      'Strategic Vision': Target,
      'Team Capability': Users,
      'Data Foundation': BarChart3,
      'Innovation Drive': Lightbulb,
      'Governance': CheckCircle,
      'default': Brain
    };
    return iconMap[dimension] || iconMap.default;
  };

  const handleExecutivePrimerBooking = async () => {
    const effectiveSessionId = sessionId || contextSessionId;
    
    try {
      await supabase.functions.invoke('send-booking-notification', {
        body: {
          sessionId: effectiveSessionId,
          contactData,
          serviceType: 'executive-primer',
          leadScore: score
        }
      });
    } catch (error) {
      console.error('Booking notification error:', error);
    }

    window.open('https://calendly.com/krish-raja/mindmaker-meeting', '_blank');
    
    toast({
      title: "Executive Primer Booking",
      description: `Hi ${contactData.fullName}! Your leadership benchmark data has been prepared for your session.`,
    });
  };

  const roadmapInsights = personalizedInsights?.roadmapInitiatives?.slice(0, 3).map(initiative => ({
    ...initiative,
    description: initiative.description?.length > 200 
      ? initiative.description.substring(0, 197) + '...' 
      : initiative.description,
    basedOn: cleanBasedOnText(initiative.basedOn || [])
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Executive Header - Single Row */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <img 
              src={mindmakerLogo} 
              alt="Mindmaker" 
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{contactData.fullName}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">{contactData.companyName}</span>
            </div>
          </div>
          <Button 
            onClick={() => setIsSaveProfileOpen(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Save className="h-3 w-3" />
            Save Profile
          </Button>
        </div>

        {/* Executive Dashboard - Above The Fold */}
        <div className="mb-8 max-h-[80vh]">
          {/* Hero Score Section - Horizontal Layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start mb-6">
            {/* Score Circle - Compact */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${leadershipProfile.gradient} p-1`}>
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center relative">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold text-primary">{score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-background rounded-full p-1.5 shadow-md border border-border">
                      <leadershipProfile.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title and Tier */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {contactData.fullName.split(' ')[0]}'s AI Leadership Benchmark
              </h1>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${leadershipProfile.badgeStyle} text-base px-3 py-1`}>
                  {leadershipProfile.tier}
                </Badge>
                <span className="text-sm text-muted-foreground">{leadershipProfile.tagline}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {leadershipProfile.description}
              </p>
            </div>
          </div>

          {/* 3 Key Insight Cards - Horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {isLoadingInsights ? (
              <div className="col-span-3 flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Loading insights...</span>
              </div>
            ) : (
              <>
                {/* Growth Readiness */}
                <Card className="border border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Growth Readiness</div>
                        <div className="text-base font-bold text-foreground mb-1">
                          {personalizedInsights?.growthReadiness.level || 'Medium'}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {personalizedInsights?.growthReadiness.preview || 'Strong foundation for AI adoption'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leadership Stage */}
                <Card className="border border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Leadership Stage</div>
                        <div className="text-base font-bold text-foreground mb-1">
                          {personalizedInsights?.leadershipStage.stage || leadershipProfile.tier}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {personalizedInsights?.leadershipStage.preview || leadershipProfile.tagline}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Focus */}
                <Card className="border border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Focus</div>
                        <div className="text-base font-bold text-foreground mb-1">
                          {personalizedInsights?.keyFocus.category || 'Strategic Implementation'}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {personalizedInsights?.keyFocus.preview || 'Prioritize pilot programs'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Button 
              onClick={handleExecutivePrimerBooking}
              size="lg"
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Book Executive Primer
            </Button>
          </div>
        </div>

        {/* 90-Day Roadmap */}
        {roadmapInsights.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              90-Day Growth Roadmap
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmapInsights.map((initiative, index) => (
                <Card key={index} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{initiative.title}</h3>
                        <p className="text-xs text-muted-foreground">{initiative.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{initiative.timeline}</span>
                      </div>
                      {initiative.basedOn.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {initiative.basedOn.slice(0, 3).map((item, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Leadership Comparison */}
        {leadershipComparison && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Leadership Dimensions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadershipComparison.dimensions.map((dimension, index) => {
                const DimIcon = getDimensionIcon(dimension.dimension);
                return (
                  <Card key={index} className="border border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <DimIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{dimension.dimension}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-bold">{Math.round(dimension.score || 0)}/5</span>
                        </div>
                        <Progress value={(dimension.score || 0) * 20} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SaveProfileDialog
        open={isSaveProfileOpen}
        onClose={() => setIsSaveProfileOpen(false)}
        sessionId={sessionId || contextSessionId || ''}
        email={contactData.email}
        onSuccess={() => {
          toast({
            title: "Profile saved",
            description: "Your leadership profile has been saved successfully.",
          });
          setIsSaveProfileOpen(false);
        }}
      />

      {selectedDimension && (
        <Dialog open={!!selectedDimension} onOpenChange={() => setSelectedDimension(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(getDimensionIcon(selectedDimension.dimension), { className: "h-5 w-5 text-primary" })}
                {selectedDimension.dimension}
              </DialogTitle>
              <DialogDescription>
                Detailed analysis of this leadership dimension
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-2">Score: {Math.round(selectedDimension.score || 0)}/5</div>
                <Progress value={(selectedDimension.score || 0) * 20} className="h-3" />
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Analysis</div>
                <p className="text-sm text-muted-foreground">
                  Continue building capabilities in this leadership dimension.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AILeadershipBenchmark;
