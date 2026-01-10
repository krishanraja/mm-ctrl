import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, ArrowRight, CheckCircle, Target, Clock, Zap, Rocket, Mail, Lock, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import mindmakerLogo from '@/assets/mindmaker-logo.png';
import { supabase } from '@/integrations/supabase/client';
// Toast removed - using inline UI feedback instead
import { useStructuredAssessment } from '@/hooks/useStructuredAssessment';
import { ProgressScreen } from './ui/progress-screen';
import LLMInsightEngine from './ai-chat/LLMInsightEngine';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileQuestionnaire, DeepProfileData } from './DeepProfileQuestionnaire';
import { SingleScrollResults } from './SingleScrollResults';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';
import { useAssessment } from '@/contexts/AssessmentContext';
import { convertQuizToV2Format } from '@/utils/convertQuizToV2Format';
import { persistAssessmentId, linkAssessmentToUser, getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { useNavigate } from 'react-router-dom';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ScreenState = 
  | 'assessment' 
  | 'save-results-prompt'
  | 'deep-profile-optin' 
  | 'deep-profile-questionnaire'
  | 'generating-insights'
  | 'generating-library'
  | 'results'
  | 'unified-results';

interface UnifiedAssessmentProps {
  onComplete?: (sessionData: any) => void;
  onBack?: () => void;
}

export const UnifiedAssessment: React.FC<UnifiedAssessmentProps> = ({ onComplete, onBack }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(true); // Fix Issue 9: Show questions immediately
  const sessionInitRef = useRef<Promise<string | null>>(null); // Track session creation promise
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('assessment');
  const [insightProgress, setInsightProgress] = useState(0);
  const [insightPhase, setInsightPhase] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  const [libraryProgress, setLibraryProgress] = useState(0);
  const [libraryPhase, setLibraryPhase] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  
  // Auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const {
    sessionId,
    setSessionId,
    contactData,
    setContactData,
    deepProfileData,
    setDeepProfileData,
    promptLibrary,
    setPromptLibrary,
    companyHash,
    setCompanyHash,
    setAssessmentInsights,
    setAssessmentId: setContextAssessmentId
  } = useAssessment();
  
  const {
    assessmentState,
    getCurrentQuestion,
    answerQuestion,
    getProgressData,
    getAssessmentData,
    totalQuestions
  } = useStructuredAssessment();

  // Fix Issue 9: Show welcome message immediately, create session in background
  useEffect(() => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Welcome to your AI Leadership Growth Benchmark. I'll guide you through ${totalQuestions} strategic questions designed to evaluate how your AI literacy drives growth—not just buzzwords.\n\nThis benchmark will help you:\n• **Assess your AI leadership capability**\n• **Identify growth acceleration opportunities**\n• **Benchmark against other executives**\n• **Create a strategic roadmap**\n\nEach question evaluates a different dimension of AI leadership. Let's begin your benchmark.`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [totalQuestions]);

  // Fix Issue 9: Initialize session in background (non-blocking)
  const initializeAssessmentSession = useCallback(async (): Promise<string | null> => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: null,
          session_title: 'AI Leadership Growth Benchmark',
          status: 'active',
          business_context: {}
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);
      return session.id;
    } catch (error) {
      console.error('Error initializing assessment session:', error);
      return null;
    }
  }, [setSessionId]);

  // Start session creation in background immediately
  useEffect(() => {
    if (!sessionInitRef.current) {
      sessionInitRef.current = initializeAssessmentSession();
    }
  }, [initializeAssessmentSession]);

  // Fix #8: Check generation status on mount to recover from refresh during generation
  useEffect(() => {
    const checkGenerationStatus = async () => {
      const { getPersistedAssessmentId } = await import('@/utils/assessmentPersistence');
      const { assessmentId: storedId } = getPersistedAssessmentId();
      
      if (!storedId) return;
      
      try {
        const { data: assessment } = await supabase
          .from('leader_assessments')
          .select('generation_status, id')
          .eq('id', storedId)
          .single();
        
        if (assessment?.generation_status) {
          const status = assessment.generation_status as any;
          const isGenerating = status && (
            !status.insights_generated ||
            !status.prompts_generated ||
            !status.risks_computed ||
            !status.tensions_computed ||
            !status.scenarios_generated
          );
          
          if (isGenerating && currentScreen === 'assessment') {
            // Generation was in progress, redirect to results screen to show progress
            console.log('🔄 Generation in progress, redirecting to results...');
            setContextAssessmentId(storedId);
            setCurrentScreen('unified-results');
          }
        }
      } catch (error) {
        console.warn('Could not check generation status:', error);
      }
    };
    
    if (isInitialized && sessionId) {
      checkGenerationStatus();
    }
  }, [isInitialized, sessionId, currentScreen, setContextAssessmentId]);

  // SECURITY: Quiz progress is stored in localStorage only (not URL)
  // This prevents accidental sharing of quiz state via URL copy/paste
  // Restoration happens automatically via useStructuredAssessment hook which reads from localStorage
  // See: src/hooks/useStructuredAssessment.ts for persistence implementation

  // Fix #2: Add back button warning when quiz is in progress
  useEffect(() => {
    const hasProgress = assessmentState.responses.length > 0 && !assessmentState.isComplete;
    const isQuizScreen = currentScreen === 'assessment';
    
    if (hasProgress && isQuizScreen) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [assessmentState.responses.length, assessmentState.isComplete, currentScreen]);

  // Handle back button with confirmation
  const handleBackWithConfirmation = useCallback(() => {
    const hasProgress = assessmentState.responses.length > 0 && !assessmentState.isComplete;
    
    if (hasProgress) {
      const confirmed = window.confirm(
        'You have unsaved progress. If you go back, your answers will be saved but you\'ll need to restart the quiz. Continue?'
      );
      if (!confirmed) return;
    }
    
    if (onBack) {
      onBack();
    }
  }, [assessmentState.responses.length, assessmentState.isComplete, onBack]);

  // Phase 1: After all questions, prompt user to save their results (create account)
  useEffect(() => {
    // Check completion directly from state, not from getProgressData (which may be stale)
    const hasAnsweredAllQuestions = assessmentState.responses.length >= totalQuestions;
    
    // After all questions, show save results prompt
    // Use both isComplete flag and response count check for robustness
    if ((assessmentState.isComplete || hasAnsweredAllQuestions) && currentScreen === 'assessment') {
      // Set minimal contact data to satisfy downstream requirements
      if (!contactData) {
        setContactData({
          fullName: '',
          email: '',
          department: '',
          primaryFocus: '',
          consentToInsights: true,
        });
      }
      
      // Small delay to ensure state is fully updated, then transition
      const timer = setTimeout(() => {
        setCurrentScreen('save-results-prompt');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [assessmentState.isComplete, assessmentState.responses.length, totalQuestions, currentScreen, contactData, setContactData]);

  // Handle account creation to save results
  const handleSaveResults = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authFullName) return;
    
    setIsAuthLoading(true);
    setAuthError(null);
    
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Try to sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: authFullName,
            first_name: authFullName.split(' ')[0],
            last_name: authFullName.split(' ').slice(1).join(' '),
          }
        }
      });
      
      if (authError) {
        // If user already exists, try to sign them in
        if (authError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });
          
          if (signInError) {
            setAuthError('Account exists. Please use the correct password.');
            setIsAuthLoading(false);
            return;
          }
          
          // Link assessment to existing user
          const { assessmentId } = getPersistedAssessmentId();
          if (assessmentId && signInData?.user?.id) {
            await linkAssessmentToUser(assessmentId, signInData.user.id);
          }
        } else {
          setAuthError(authError.message);
          setIsAuthLoading(false);
          return;
        }
      } else if (authData?.user?.id) {
        // New user created - link assessment
        const { assessmentId } = getPersistedAssessmentId();
        if (assessmentId) {
          await linkAssessmentToUser(assessmentId, authData.user.id);
        }
      }
      
      // Update contact data with user info
      setContactData({
        fullName: authFullName,
        email: authEmail,
        department: '',
        primaryFocus: '',
        consentToInsights: true,
      });
      
      console.log('✅ Account created/signed in, proceeding to deep profile');
      setCurrentScreen('deep-profile-optin');
      
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  }, [authEmail, authPassword, authFullName, setContactData]);

  // Skip save and continue without account
  const handleSkipSave = useCallback(() => {
    setCurrentScreen('deep-profile-optin');
  }, []);

  const handleOptionSelect = useCallback(async (option: string) => {
    // Fix Issue 9: Ensure session is created before processing answer
    let currentSessionId = sessionId;
    if (!currentSessionId && sessionInitRef.current) {
      currentSessionId = await sessionInitRef.current;
      if (currentSessionId) {
        setSessionId(currentSessionId);
      } else {
        console.warn('Session creation failed, cannot process answer');
        return;
      }
    }
    if (!currentSessionId) {
      console.warn('No session available');
      return;
    }

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: option,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Answer the question - this updates state including isComplete
    answerQuestion(option);
    
    // Show auto-save indicator (subtle feedback)
    const saveIndicator = document.createElement('div');
    saveIndicator.className = 'fixed bottom-4 right-4 bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg z-50 animate-fade-in';
    saveIndicator.textContent = '✓ Progress saved';
    document.body.appendChild(saveIndicator);
    setTimeout(() => {
      saveIndicator.style.opacity = '0';
      saveIndicator.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        if (document.body.contains(saveIndicator)) {
          document.body.removeChild(saveIndicator);
        }
      }, 300);
    }, 2000);
    
    // Check if this was the last question
    const isLastQuestion = currentQuestion.id === totalQuestions;
    
    if (isLastQuestion) {
      // Last question answered - show loading state briefly, then transition
      setIsProcessingAnswer(true);
      console.log('✅ Last question answered, transitioning to save-results-prompt');
      // Small delay to show processing, then useEffect will handle transition
      setTimeout(() => {
        setIsProcessingAnswer(false);
      }, 500);
      return;
    }
    
    setIsProcessingAnswer(true);

    const progressData = getProgressData();
    const assessmentData = getAssessmentData();

    // Fix #5: Add AI retry mechanism with exponential backoff
    const maxRetries = 3;
    let lastError: any = null;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const { data, error } = await invokeEdgeFunction('ai-assessment-chat', {
          message: `The executive answered: "${option}" to the question: "${currentQuestion.question}". 
        
        Context: This is question ${currentQuestion.id} of ${totalQuestions} in phase "${currentQuestion.phase}".
        Progress: ${progressData.completedAnswers}/${totalQuestions} questions completed.
        
        Provide a brief acknowledgment that shows understanding, then present the next question. Be professional and encouraging, like an executive coach.`,
          sessionId: sessionId,
          userId: null,
          context: {
            currentQuestion: progressData.currentQuestion,
            phase: progressData.phase,
            assessmentData: assessmentData,
            isComplete: false // Not complete yet, we're still in the middle
          }
        }, { logPrefix: '🤖' });

        if (error) {
          lastError = error;
          throw error;
        }

        if (data) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, aiMessage]);
          setIsProcessingAnswer(false);
          return; // Success, exit retry loop
        }

      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          console.warn(`🤖 AI call failed, retrying in ${delayMs}ms (attempt ${retryCount}/${maxRetries})...`);
          
          // Show retry message to user
          const retryMessage: Message = {
            id: `retry-${Date.now()}`,
            role: 'assistant',
            content: `Retrying... (attempt ${retryCount}/${maxRetries})`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, retryMessage]);
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // All retries exhausted
          console.error('Error generating AI response after retries:', error);
          
          // Show error message to user with retry option
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `I'm having trouble connecting. You can continue without AI feedback, or try again.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsProcessingAnswer(false);
          
          // Fallback: show next question
          const nextQuestion = getCurrentQuestion();
          if (nextQuestion && !assessmentState.isComplete) {
            const nextQuestionMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `**Question ${nextQuestion.id} of ${totalQuestions}:** ${nextQuestion.question}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, nextQuestionMessage]);
          }
        }
      }
    }
  }, [sessionId, getCurrentQuestion, answerQuestion, getProgressData, getAssessmentData, assessmentState.isComplete, totalQuestions]);

  const startInsightGeneration = useCallback(async () => {
    setCurrentScreen('generating-insights');
    setInsightPhase('analyzing');
    setInsightProgress(10);

    try {
      // Call assessment pipeline with progress callback
      const { runAssessment } = await import('@/utils/runAssessment');
      const rawQuizData = getAssessmentData();
      
      // Convert quiz data to v2 format with numeric dimension scores
      const v2FormattedData = convertQuizToV2Format(rawQuizData);
      
      // Progress callback for real-time UI updates
      const handleProgress = (phase: string, percentage: number, message: string) => {
        console.log(`📊 Progress: ${phase} - ${percentage}% - ${message}`);
        setInsightProgress(percentage);
        if (percentage < 40) setInsightPhase('analyzing');
        else if (percentage < 80) setInsightPhase('generating');
        else setInsightPhase('finalizing');
      };
      
      const result = await runAssessment(
        contactData!,
        v2FormattedData,
        deepProfileData,
        sessionId!,
        handleProgress
      );

      if (result.success && result.assessmentId) {
        console.log('✅ V2 assessment orchestrated successfully');
        console.log('📊 Using v2 assessment ID:', result.assessmentId);
        // PHASE 1: Persist assessment ID to all storage layers (localStorage, sessionStorage, URL)
        persistAssessmentId(result.assessmentId);
        
        // Fetch prompts from database
        const { data: promptSets, error: promptError } = await supabase
          .from('leader_prompt_sets')
          .select('*')
          .eq('assessment_id', result.assessmentId)
          .order('priority_rank', { ascending: true });
        
        if (!promptError && promptSets && promptSets.length > 0) {
          // Transform to expected format
          const library = {
            promptSets: promptSets.map(set => ({
              category: set.category_key,
              title: set.title,
              description: set.description || '',
              whatItsFor: set.what_its_for || '',
              whenToUse: set.when_to_use || '',
              howToUse: set.how_to_use || '',
              prompts: set.prompts_json || []
            }))
          };
          setPromptLibrary(library);
          console.log('✅ Prompts loaded from database:', promptSets.length);
        } else {
          console.warn('⚠️ No prompts found for assessment:', result.assessmentId);
        }
        
        // Store assessment ID and insights in context for cross-feature intelligence
        setContextAssessmentId(result.assessmentId);
        
        // Fetch and store assessment insights for Prompt Coach
        try {
          const { aggregateLeaderResults } = await import('@/utils/aggregateLeaderResults');
          const aggregated = await aggregateLeaderResults(result.assessmentId, false);
          
          setAssessmentInsights({
            benchmarkScore: aggregated.benchmarkScore,
            benchmarkTier: aggregated.benchmarkTier,
            topTension: aggregated.tensions?.[0]?.summary_line || null,
            topGap: aggregated.dimensionScores?.find(d => d.score_numeric < 60)?.dimension_key || null,
            learningStyle: null, // Will be populated from deep profile
            primaryBottleneck: deepProfileData?.biggestChallenge || null,
            suggestedPromptCategories: aggregated.promptSets?.slice(0, 3).map(p => p.category_key) || []
          });
          console.log('✅ Assessment insights stored in context for cross-feature use');
        } catch (insightError) {
          console.warn('⚠️ Could not store assessment insights:', insightError);
        }
        
        // Success - go to results
        setInsightProgress(100);
        setCurrentScreen('unified-results');
      } else {
        // Pipeline returned failure - continue to results anyway
        console.error('❌ Assessment pipeline failed:', result.error);
        setInsightProgress(100);
        setCurrentScreen('unified-results');
      }
    } catch (error) {
      console.error('❌ V2 orchestration error:', error);
      // Continue to results even if generation fails - fallback content will be shown
      setInsightProgress(100);
      setCurrentScreen('unified-results');
    }
  }, [contactData, deepProfileData, sessionId, getAssessmentData, setPromptLibrary, setAssessmentInsights, setContextAssessmentId]);


  // PHASE 2: Fixed - let startInsightGeneration control progress, don't set redundant values
  const handleSkipDeepProfile = useCallback(() => {
    startInsightGeneration();
  }, [startInsightGeneration]);

  const handleStartDeepProfile = useCallback(() => {
    setCurrentScreen('deep-profile-questionnaire');
  }, []);

  const handleDeepProfileComplete = useCallback(async (profileData: DeepProfileData) => {
    setDeepProfileData(profileData);
    
    // Use default learning style
    const { getDefaultLearningStyle } = await import('@/utils/aiLearningStyle');
    const learningStyle = getDefaultLearningStyle();
    console.log('🎯 Using learning style:', learningStyle);
    
    // Update index participant data with learning style and deep profile
    try {
      const assessmentData = getAssessmentData();
      console.log('📊 Updating index with learning style...');
      await invokeEdgeFunction('populate-index-participant', {
        sessionId: sessionId,
        userId: null,
        assessmentData: assessmentData,
        contactData: contactData,
        deepProfileData: profileData,
        learningStyle: learningStyle,
        consentFlags: {
          index_publication: contactData?.consentToInsights,
          product_improvements: true,
          case_study: false,
          research_partnerships: false,
          sales_outreach: false
        }
      }, { logPrefix: '📊' });
      console.log('✅ Index updated with learning style');
    } catch (error) {
      console.error('❌ Error updating index with learning style:', error);
      // Don't block user flow
    }
    
    setCurrentScreen('generating-library');
    setLibraryPhase('analyzing');
    setLibraryProgress(10);
    
    // Send updated email with deep profile data
    try {
      console.log('📧 Sending deep profile notification email...');
      
      const assessmentData = getAssessmentData();
      const progressData = getProgressData();
      
      await invokeEdgeFunction('send-diagnostic-email', {
        data: {
          ...contactData,
          firstName: contactData?.fullName.split(' ')[0],
          lastName: contactData?.fullName.split(' ').slice(1).join(' '),
          company: contactData?.companyName,
          title: contactData?.department,
          
          // Assessment responses
          industry_impact: assessmentData.industry_impact,
          business_acceleration: assessmentData.business_acceleration,
          team_alignment: assessmentData.team_alignment,
          external_positioning: assessmentData.external_positioning,
          kpi_connection: assessmentData.kpi_connection,
          coaching_champions: assessmentData.coaching_champions,
          
          // Deep profile data
          deepProfile: profileData,
          hasDeepProfile: true
        },
        scores: { total: progressData.completedAnswers * 5 },
        contactType: 'deep_profile_completed',
        sessionId: sessionId
      }, { logPrefix: '📧' });
      
      console.log('✅ Deep profile notification email sent');
    } catch (error) {
      console.error('❌ Error sending deep profile notification:', error);
    }

    try {
      const rawQuizData = getAssessmentData();
      const { convertQuizToV2Format } = await import('@/utils/convertQuizToV2Format');
      const v2FormattedData = convertQuizToV2Format(rawQuizData);
      
      // Run assessment pipeline
      try {
        const { runAssessment } = await import('@/utils/runAssessment');
        
        // PHASE 2: Add progress callback for real-time UI updates
        const handleProgress = (phase: string, percentage: number, message: string) => {
          console.log(`📊 DeepProfile Progress: ${phase} - ${percentage}% - ${message}`);
          setLibraryProgress(percentage);
          if (percentage < 40) setLibraryPhase('analyzing');
          else if (percentage < 80) setLibraryPhase('generating');
          else setLibraryPhase('finalizing');
        };
        
        const result = await runAssessment(
          contactData!,
          v2FormattedData,
          profileData,
          sessionId!,
          handleProgress  // PHASE 2: Pass progress callback
        );

        if (result.success && result.assessmentId) {
          console.log('✅ V2 assessment orchestrated successfully:', result.assessmentId);
          // PHASE 1: Persist assessment ID to all storage layers
          persistAssessmentId(result.assessmentId);
          
          // Poll for background prompt generation to complete (up to 15 seconds)
          let promptsLoaded = false;
          let pollAttempts = 0;
          const maxPollAttempts = 7; // 7 * 2s = 14s
          
          while (!promptsLoaded && pollAttempts < maxPollAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            pollAttempts++;
            
            const { data: promptSets, error: promptError } = await supabase
              .from('leader_prompt_sets')
              .select('*')
              .eq('assessment_id', result.assessmentId)
              .order('priority_rank', { ascending: true });
            
            if (!promptError && promptSets && promptSets.length > 0) {
              const library = {
                promptSets: promptSets.map(set => ({
                  category: set.category_key,
                  title: set.title,
                  description: set.description || '',
                  whatItsFor: set.what_its_for || '',
                  whenToUse: set.when_to_use || '',
                  howToUse: set.how_to_use || '',
                  prompts: set.prompts_json || []
                }))
              };
              setPromptLibrary(library);
              promptsLoaded = true;
              console.log('✅ Prompts loaded from database:', promptSets.length);
            } else {
              // Update progress bar during polling
              setLibraryProgress(Math.min(95, 50 + (pollAttempts * 2)));
              console.log(`⏳ Poll attempt ${pollAttempts}/${maxPollAttempts} - waiting for prompts...`);
            }
          }
          
          if (!promptsLoaded) {
            console.warn('⚠️ Prompts not ready after 15s, showing results anyway');
          }
          
          setLibraryProgress(100);
          
          setTimeout(() => {
            setCurrentScreen('unified-results');
          }, 500);
        } else {
          console.error('❌ Assessment failed:', result.error);
          throw new Error('Assessment failed');
        }
      } catch (orchestrationError) {
        console.error('❌ V2 orchestration error:', orchestrationError);
        startInsightGeneration();
      }
    } catch (error: any) {
      console.error('Error in handleDeepProfileComplete:', error);
      // Errors are logged but don't block flow
    }
  }, [setDeepProfileData, getAssessmentData, getProgressData, contactData, sessionId, setPromptLibrary, startInsightGeneration]);

  // Render based on current screen state

  // Save Results Prompt - shown after diagnostic completion
  if (currentScreen === 'save-results-prompt') {
    return (
      <div className="bg-background fixed inset-0 flex items-center justify-center px-4 overflow-hidden">
        <Card className="max-w-md w-full shadow-lg border rounded-xl">
          <CardContent className="p-5 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Save className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Save your results
              </h2>
              <p className="text-sm text-muted-foreground">
                Create an account so you never have to take this diagnostic again.
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSaveResults} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-name" className="text-sm font-medium">
                  Your name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="Jane Smith"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="pl-10 rounded-lg"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-email" className="text-sm font-medium">
                  Work email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@company.com"
                    value={authEmail}
                    onChange={(e) => {
                      setAuthEmail(e.target.value);
                      // Real-time validation
                      if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                        setAuthError('Please enter a valid email address');
                      } else if (authError && e.target.value) {
                        setAuthError(null);
                      }
                    }}
                    onBlur={(e) => {
                      // Validate on blur
                      if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                        setAuthError('Please enter a valid email address');
                      }
                    }}
                    className="pl-10 rounded-lg"
                    required
                  />
                  {authError && authError.includes('email') && (
                    <p className="text-xs text-destructive mt-1">Please enter a valid email address (e.g., you@company.com)</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-password" className="text-sm font-medium">
                  Create password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="pl-10 rounded-lg"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {authError && (
                <p className="text-sm text-destructive">{authError}</p>
              )}

              <Button 
                type="submit"
                variant="cta" 
                size="lg"
                className="w-full rounded-xl min-h-[48px]"
                disabled={isAuthLoading || !authEmail || !authPassword || !authFullName}
              >
                {isAuthLoading ? 'Creating account...' : 'Save & continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <button 
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-3 mt-3"
              onClick={handleSkipSave}
            >
              Skip for now
            </button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Your data is private. We'll never share it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'deep-profile-optin') {
    return (
      <div className="bg-background fixed inset-0 flex items-center justify-center px-4 overflow-hidden">
        <Card className="max-w-md w-full shadow-lg border rounded-xl">
          <CardContent className="p-5 sm:p-8">
            {/* Minimal Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
                <Zap className="h-4 w-4" />
                <span>10x personalization</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                Quick personalization?
              </h2>
              <p className="text-sm text-muted-foreground">
                10 more questions = prompts tailored to your exact workflow.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button 
                variant="cta" 
                size="lg"
                className="w-full rounded-xl min-h-[48px]"
                onClick={handleStartDeepProfile}
              >
                Yes, personalize it
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button 
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={handleSkipDeepProfile}
              >
                Skip for now
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'deep-profile-questionnaire') {
    return (
      <DeepProfileQuestionnaire
        onComplete={handleDeepProfileComplete}
        onBack={() => {
          setCurrentScreen('deep-profile-optin');
        }}
      />
    );
  }

  if (currentScreen === 'generating-library') {
    return (
      <ProgressScreen 
        progress={libraryProgress} 
        phase={libraryPhase}
      />
    );
  }

  if (currentScreen === 'unified-results' && contactData) {
    const assessmentData = getAssessmentData();
    
    return (
      <SingleScrollResults
        assessmentData={assessmentData}
        promptLibrary={promptLibrary}
        contactData={contactData}
        deepProfileData={deepProfileData}
        sessionId={sessionId}
        onBack={handleBackWithConfirmation}
      />
    );
  }

  if (currentScreen === 'generating-insights') {
    return (
      <ProgressScreen 
        progress={insightProgress} 
        phase={insightPhase} 
      />
    );
  }

  if (currentScreen === 'results' && contactData) {
    // Check if v2 assessment exists, redirect to unified-results
    const v2Id = sessionStorage.getItem('v2_assessment_id');
    if (v2Id) {
      console.log('🔄 Redirecting to unified-results with v2 ID:', v2Id);
      setCurrentScreen('unified-results');
      return null;
    }
    
    // Redirect to unified-results (no legacy fallback)
    console.log('🔄 No v2 assessment found, redirecting to unified-results');
    setCurrentScreen('unified-results');
    return null;
  }

  const progressData = getProgressData();
  const currentQuestion = getCurrentQuestion();

  return (
    <div className="bg-background fixed inset-0 flex flex-col overflow-hidden">
      {/* Safe area container - no scroll on outer container */}
      <div className="flex-1 flex flex-col px-3 sm:px-6 lg:px-8 pt-safe-top pb-safe-bottom overflow-hidden">
        {/* Brand Header with Icon and Back Button */}
        <div className="flex items-center justify-between py-2 sm:py-3 shrink-0">
          <div className="flex items-center gap-3">
            {onBack && progressData.currentQuestion > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackWithConfirmation}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back
              </Button>
            )}
            <img 
              src="/2.png" 
              alt="Mindmaker" 
              className="h-6 sm:h-7 w-auto"
            />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-right flex-1 ml-3">
            AI Leadership Benchmark
          </p>
        </div>

        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full min-h-0 overflow-hidden">
          {/* Compact Progress Section */}
          <Card className="mb-2 sm:mb-3 shadow-sm border rounded-xl shrink-0">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">Benchmark Progress</h2>
                <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 px-2 py-0.5 whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{progressData.currentQuestion}/{totalQuestions}</span>
                </Badge>
              </div>
              
              <Progress value={progressData.progressPercentage} className="h-1.5 mb-1.5" />
              
              <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                <span>Phase: {progressData.phase}</span>
                <span>
                  {progressData.isComplete || progressData.estimatedTimeRemaining === 0 
                    ? 'Almost done' 
                    : `${Math.round(progressData.estimatedTimeRemaining * 10) / 10} min remaining`}
                </span>
              </div>
            </CardContent>
          </Card>


          {/* Current Question - Fills remaining space with internal scroll only */}
          {currentQuestion && (
            <Card className="shadow-sm border rounded-xl flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardContent className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="mb-2 shrink-0">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 leading-tight">
                    Question {currentQuestion.id} of {totalQuestions}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
                
                {/* Answer options with internal scroll if needed */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
                  <h4 className="font-medium text-foreground mb-1 text-xs shrink-0">
                    Select your answer:
                  </h4>
                  {isProcessingAnswer && currentQuestion.id === totalQuestions ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <div className="h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Processing your responses...
                    </div>
                  ) : (
                    currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full h-auto text-left justify-start hover:bg-primary/10 transition-colors rounded-xl p-2.5 sm:p-3 min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleOptionSelect(option)}
                        aria-label={`Select option: ${option}`}
                        disabled={isProcessingAnswer || assessmentState.isComplete || (currentQuestion && currentQuestion.id === totalQuestions && progressData.completedAnswers >= totalQuestions)}
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-primary" />
                        <span className="text-xs sm:text-sm text-foreground leading-relaxed text-left">{option}</span>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};