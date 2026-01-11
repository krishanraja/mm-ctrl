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
import { DesktopDashboard } from '@/components/mobile/DesktopDashboard';
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

  // Desktop dashboard (enhanced layout)
  return (
    <DesktopDashboard
      user={user}
      baselineData={baselineData}
      weeklyAction={weeklyAction}
      dailyPrompt={dailyPrompt}
      recentActivity={recentActivity}
      onNavigate={navigate}
    />
  );
}
