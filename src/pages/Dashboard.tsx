import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, ArrowRight, Sparkles, Target, Clock, ChevronRight, User, Brain, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';
import { supabase } from '@/integrations/supabase/client';
import { ExecutiveVoiceCapture } from '@/components/voice/ExecutiveVoiceCapture';
import { transitions, fadeInProps } from '@/lib/motion';
import { DailyProvocation } from '@/components/dashboard/DailyProvocation';
import { PatternInsight } from '@/components/dashboard/PatternInsight';
import { MobileDashboard } from '@/components/mobile/MobileDashboard';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Dashboard - AI Confidante Experience
 * 
 * Transformed into a trusted thinking partner that:
 * - Challenges users with daily provocations
 * - Captures stream-of-consciousness reflections
 * - Learns patterns and provides personalized insights
 * - Helps users become AI-literate boardroom leaders
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topTension, setTopTension] = useState<string | null>(null);
  const [weeklyAction, setWeeklyAction] = useState<{ action_text: string; why_text: string | null } | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [recentActivity, setRecentActivity] = useState<{ type: string; date: string } | null>(null);
  const [dailyPrompt, setDailyPrompt] = useState<{ id: string; question: string; category: string } | null>(null);
  const [promptLoading, setPromptLoading] = useState(true);
  const [baselineData, setBaselineData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get user info
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load personalized data from baseline
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { assessmentId } = getPersistedAssessmentId();
      if (!assessmentId) {
        // No baseline - redirect to home to complete diagnostic
        navigate('/', { replace: true });
        return;
      }

      setIsLoading(true);
      try {
        const aggregated = await aggregateLeaderResults(assessmentId, false);
        if (!isMounted) return;
        
        setBaselineData(aggregated);
        const tension = aggregated.tensions?.[0];
        if (tension?.summary_line) {
          setTopTension(tension.summary_line);
        }
      } catch (err) {
        console.warn('Could not load baseline data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [navigate]);

  // Load weekly action
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { assessmentId } = getPersistedAssessmentId();
        let baselineContext: any = null;
        
        if (assessmentId) {
          try {
            const aggregated = await aggregateLeaderResults(assessmentId, false);
            baselineContext = {
              benchmarkTier: aggregated.benchmarkTier,
              benchmarkScore: aggregated.benchmarkScore,
              topTension: aggregated.tensions?.[0]?.summary_line ?? null,
              topRisk: aggregated.riskSignals?.[0]?.description ?? null,
            };
          } catch {
            // ignore baseline context errors
          }
        }

        const { data, error } = await supabase.functions.invoke('get-or-generate-weekly-action', {
          body: { baseline_context: baselineContext },
        });

        if (isMounted && !error && data?.action_text) {
          setWeeklyAction({ action_text: data.action_text, why_text: data.why_text ?? null });
        }
      } catch {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Load recent activity
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [checkinsRes, capturesRes] = await Promise.all([
          supabase
            .from('leader_checkins' as any)
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('leader_decision_captures' as any)
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        const latestCheckin = checkinsRes.data?.[0];
        const latestCapture = capturesRes.data?.[0];

        if (isMounted) {
          if (latestCheckin?.created_at && latestCapture?.created_at) {
            const checkinDate = new Date(latestCheckin.created_at);
            const captureDate = new Date(latestCapture.created_at);
            if (checkinDate > captureDate) {
              setRecentActivity({ type: 'check-in', date: checkinDate.toLocaleDateString() });
            } else {
              setRecentActivity({ type: 'decision', date: captureDate.toLocaleDateString() });
            }
          } else if (latestCheckin?.created_at) {
            setRecentActivity({ type: 'check-in', date: new Date(latestCheckin.created_at).toLocaleDateString() });
          } else if (latestCapture?.created_at) {
            setRecentActivity({ type: 'decision', date: new Date(latestCapture.created_at).toLocaleDateString() });
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Load daily prompt
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setPromptLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-daily-prompt', {
          body: {},
        });

        if (isMounted && !error && data?.prompt) {
          setDailyPrompt(data.prompt);
        }
      } catch (err) {
        console.warn('Could not load daily prompt:', err);
      } finally {
        if (isMounted) setPromptLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handlePromptResponse = useCallback(() => {
    // Reload prompt after response
    setDailyPrompt(null);
    setPromptLoading(true);
    supabase.functions.invoke('get-daily-prompt', { body: {} }).then(({ data, error }) => {
      if (!error && data?.prompt) {
        setDailyPrompt(data.prompt);
      }
      setPromptLoading(false);
    });
  }, []);

  const handleVoiceClose = useCallback(() => {
    setIsVoiceActive(false);
  }, []);

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Leader';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  // Voice capture mode
  if (isVoiceActive) {
    return (
      <ExecutiveVoiceCapture 
        onClose={handleVoiceClose}
        tensionContext={topTension || undefined}
      />
    );
  }

  // Handle voice capture event from mobile dashboard
  useEffect(() => {
    const handleVoiceCapture = () => {
      setIsVoiceActive(true);
    };
    window.addEventListener('open-voice-capture', handleVoiceCapture);
    return () => window.removeEventListener('open-voice-capture', handleVoiceCapture);
  }, []);

  // Mobile-first dashboard
  if (isMobile) {
    return (
      <MobileDashboard
        user={user}
        baselineData={baselineData}
        weeklyAction={weeklyAction}
        dailyPrompt={dailyPrompt}
        recentActivity={recentActivity}
        onNavigate={navigate}
      />
    );
  }

  // Desktop dashboard (existing layout)
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-24">
        {/* Header */}
        <motion.div 
          className="mb-8"
          {...fadeInProps}
          transition={transitions.default}
        >
          <h1 className="text-2xl font-semibold text-foreground">
            {getUserGreeting()}
          </h1>
          {recentActivity && (
            <p className="text-sm text-muted-foreground mt-1">
              Last {recentActivity.type}: {recentActivity.date}
            </p>
          )}
        </motion.div>

        {/* Daily Provocation - AI Confidante Core Feature */}
        {dailyPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...transitions.default }}
          >
            <DailyProvocation
              prompt={dailyPrompt}
              onResponseSubmitted={handlePromptResponse}
            />
          </motion.div>
        )}

        {/* Pattern Insight - Learned from reflections */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ...transitions.default }}
        >
          <PatternInsight />
        </motion.div>

        {promptLoading && !dailyPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...transitions.default }}
          >
            <Card className="mb-6 border rounded-2xl">
              <CardContent className="p-6">
                <div className="h-32 bg-secondary/30 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* This Week's Focus */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...transitions.default }}
        >
          <Card className="mb-6 border rounded-2xl bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">This week's focus</span>
              </div>
              
              {isLoading ? (
                <div className="h-12 bg-secondary/30 rounded-lg animate-pulse" />
              ) : (
                <>
                  <p className="text-foreground leading-relaxed">
                    {weeklyAction?.action_text || topTension || "Complete a weekly check-in to get personalized guidance."}
                  </p>
                  {weeklyAction?.why_text && (
                    <p className="text-sm text-muted-foreground mt-2">{weeklyAction.why_text}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...transitions.default }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h2>

          {/* Voice Capture - Primary */}
          <Card 
            className="border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsVoiceActive(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Talk through a decision</div>
                    <div className="text-sm text-muted-foreground">60 seconds → 3 sharp questions</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Check-in */}
          <Card 
            className="border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/checkin')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Weekly check-in</div>
                    <div className="text-sm text-muted-foreground">30 seconds → one insight</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* View Baseline */}
          <Card 
            className="border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/baseline')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Your baseline</div>
                    <div className="text-sm text-muted-foreground">Scores, tensions, and prompts</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subtle footer */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your AI confidante learns from every reflection. The more you share, the better it gets.
        </motion.p>
      </div>
    </div>
  );
}
