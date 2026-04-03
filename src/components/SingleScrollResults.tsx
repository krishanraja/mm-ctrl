import React, { useState, useEffect } from 'react';
import { FirstMoveSelector } from '@/components/missions/FirstMoveSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileData } from './DeepProfileQuestionnaire';
import { aggregateLeaderResults, AggregatedLeaderResults } from '@/utils/aggregateLeaderResults';
import { UnlockFormData } from './UnlockResultsForm';
import { ArrowRightCircle } from 'lucide-react';

import {
  ResultsScoreCard,
  ResultsKeyInsights,
  ResultsDimensionScores,
  ResultsRiskPreview,
  ResultsLockedGate,
  ResultsUnlockedSections,
} from './results';

interface SingleScrollResultsProps {
  assessmentData: any;
  promptLibrary: any;
  contactData: ContactData;
  deepProfileData: DeepProfileData | null;
  sessionId: string | null;
  onBack?: () => void;
}

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
  const [showMissionSelector, setShowMissionSelector] = useState(false);

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fix Issue 1: Check auth state on mount and unlock for logged-in users
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !session.user.is_anonymous) {
          setIsUnlocked(true);
        }
      } catch (error) {
        console.warn('Could not check auth state:', error);
      }
    };
    checkAuthState();
  }, []);

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

  const topRisks = data?.riskSignals?.slice(0, 3) || [];

  return (
    <div className="bg-background min-h-[100dvh] py-4 sm:py-6">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-4xl">

        {/* Brand Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <img
            src="/mindmaker-favicon.png"
            alt="Mindmaker"
            className="h-6 sm:h-7 w-auto"
          />
          <span className="text-xs sm:text-sm text-muted-foreground">Your Results</span>
        </div>

        {/* Ongoing loop CTA */}
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
                    Weekly 30s check-ins + decision capture when you're stuck.
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

        {/* 1. Score Card */}
        <ResultsScoreCard loading={loading} data={data} />

        {/* Prompt Coach CTA */}
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

        {/* 2-3. Primary Tension + Next Move */}
        <ResultsKeyInsights
          data={data}
          isUnlocked={isUnlocked}
          onShowMissionSelector={() => setShowMissionSelector(true)}
        />

        {/* Mission Selector Modal */}
        {data?.firstMoves && (
          <FirstMoveSelector
            open={showMissionSelector}
            onOpenChange={setShowMissionSelector}
            firstMoves={data.firstMoves}
            assessmentId={data.assessmentId}
            onMissionCreated={() => navigate('/dashboard')}
          />
        )}

        {/* Dimension Scores */}
        <ResultsDimensionScores dimensionScores={data?.dimensionScores || []} />

        {/* Top Risk Signal Preview */}
        <ResultsRiskPreview topRisks={topRisks} />

        {/* GATED CONTENT: Unlock Form or Full Results */}
        {!isUnlocked ? (
          <ResultsLockedGate
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            unlockError={unlockError}
            unlockLoading={unlockLoading}
            onUnlock={handleUnlock}
          />
        ) : (
          <ResultsUnlockedSections
            data={data}
            sessionId={sessionId}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            copiedPromptIdx={copiedPromptIdx}
            onCopyPrompt={handleCopyPrompt}
            onDownloadPrompts={handleDownloadPrompts}
          />
        )}

      </div>
    </div>
  );
};
