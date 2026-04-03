import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStructuredAssessment } from '@/hooks/useStructuredAssessment';
import { ProgressScreen } from './ui/progress-screen';
import { DeepProfileQuestionnaire, DeepProfileData } from './DeepProfileQuestionnaire';
import { SingleScrollResults } from './SingleScrollResults';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';
import { useAssessment } from '@/contexts/AssessmentContext';
import { convertQuizToV2Format } from '@/utils/convertQuizToV2Format';
import { persistAssessmentId, linkAssessmentToUser, getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { SaveResultsPrompt } from './assessment/SaveResultsPrompt';
import { DeepProfileOptIn } from './assessment/DeepProfileOptIn';
import { AssessmentHeader } from './assessment/AssessmentHeader';
import { AssessmentProgressCard } from './assessment/AssessmentProgressCard';
import { AssessmentQuestionCard } from './assessment/AssessmentQuestionCard';


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
  userMode?: 'leader' | 'operator' | null;
}

export const UnifiedAssessment: React.FC<UnifiedAssessmentProps> = ({ onComplete, onBack, userMode = 'leader' }) => {
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
  // CRITICAL: This component is ONLY for leaders - operators should never reach here
  useEffect(() => {
    if (userMode === 'operator') {
      console.error('❌ UnifiedAssessment should never be shown to operators');
      if (onBack) onBack();
      return;
    }

    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Welcome to your AI Leadership Growth Benchmark. I'll guide you through ${totalQuestions} strategic questions designed to evaluate how your AI literacy drives growth, not just buzzwords.\n\nThis benchmark will help you:\n• **Assess your AI leadership capability**\n• **Identify growth acceleration opportunities**\n• **Benchmark against other executives**\n• **Create a strategic roadmap**\n\nEach question evaluates a different dimension of AI leadership. As you answer, I'm learning about your unique context and will personalize your insights. Let's begin your benchmark.`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [totalQuestions, userMode, onBack]);

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
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Brief blocking state update - disable buttons during this moment
    setIsProcessingAnswer(true);

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: option,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Answer the question immediately - this updates state and advances to next question
    answerQuestion(option);
    
    // Show auto-save indicator (subtle feedback) - prevent stacking
    const existingIndicator = document.querySelector('.progress-saved-indicator');
    if (existingIndicator) {
      // Remove existing indicator before showing new one
      existingIndicator.remove();
    }
    
    const saveIndicator = document.createElement('div');
    saveIndicator.className = 'progress-saved-indicator fixed bottom-4 right-4 bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-lg shadow-lg z-50 animate-fade-in';
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
      console.log('✅ Last question answered, transitioning to save-results-prompt');
      // Small delay to show processing, then useEffect will handle transition
      setTimeout(() => {
        setIsProcessingAnswer(false);
      }, 500);
      return;
    }
    
    // Re-enable buttons immediately - next question is now available
    setIsProcessingAnswer(false);

    // Make AI call asynchronously in background (non-blocking)
    // This will update messages when response arrives, but doesn't block UI
    (async () => {
      try {
        // Get session ID non-blocking - use existing or wait for background init
        let currentSessionId = sessionId;
        if (!currentSessionId && sessionInitRef.current) {
          currentSessionId = await sessionInitRef.current;
          if (currentSessionId) {
            setSessionId(currentSessionId);
          } else {
            console.warn('Session creation failed, skipping AI response');
            return;
          }
        }
        if (!currentSessionId) {
          console.warn('No session available for AI response');
          return;
        }

        const progressData = getProgressData();
        const assessmentData = getAssessmentData();

        // Fix #5: Add AI retry mechanism with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
          try {
            // Add timeout handling
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Request timed out')), 30000); // 30 second timeout
            });

            const functionPromise = invokeEdgeFunction('ai-assessment-chat', {
              message: `The executive answered: "${option}" to the question: "${currentQuestion.question}". 
            
            Context: This is question ${currentQuestion.id} of ${totalQuestions} in phase "${currentQuestion.phase}".
            Progress: ${progressData.completedAnswers}/${totalQuestions} questions completed.
            
            Provide a brief acknowledgment that shows understanding, then present the next question. Be professional and encouraging, like an executive coach.`,
              sessionId: currentSessionId,
              userId: null,
              context: {
                currentQuestion: progressData.currentQuestion,
                phase: progressData.phase,
                assessmentData: assessmentData,
                isComplete: false // Not complete yet, we're still in the middle
              }
            }, { logPrefix: '🤖' });

            const { data, error } = await Promise.race([functionPromise, timeoutPromise]) as any;

            if (error) {
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
              return; // Success, exit retry loop
            }

          } catch (error) {
            retryCount++;
            
            // Provide user-friendly error messages
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('timed out');
            const isNetwork = errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch');
            
            if (retryCount <= maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              const delayMs = Math.pow(2, retryCount - 1) * 1000;
              console.warn(`🤖 AI call failed, retrying in ${delayMs}ms (attempt ${retryCount}/${maxRetries})...`);
              
              // Show retry message to user with helpful context
              const retryMessage: Message = {
                id: `retry-${Date.now()}`,
                role: 'assistant',
                content: isNetwork 
                  ? `Connection issue detected. Retrying... (attempt ${retryCount}/${maxRetries})`
                  : `Retrying... (attempt ${retryCount}/${maxRetries})`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, retryMessage]);
              
              await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
              // All retries exhausted - show helpful error message
              console.error('Error generating AI response after retries:', error);
              
              // Show user-friendly error message
              const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: isNetwork
                  ? `I'm having trouble connecting. Please check your internet connection. You can continue without AI feedback.`
                  : isTimeout
                  ? `The request took too long. Please try again. You can continue without AI feedback.`
                  : `I'm having trouble connecting. You can continue without AI feedback.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
            }
          }
        }
      } catch (error) {
        // Silently handle errors - don't block user experience
        console.warn('AI response generation failed:', error);
      }
    })(); // Fire and forget - doesn't block UI
  }, [sessionId, getCurrentQuestion, answerQuestion, getProgressData, getAssessmentData, assessmentState.isComplete, totalQuestions, setSessionId]);

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
      
      // Add timeout handling for assessment generation (5 minutes max)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Assessment generation timed out. Please try again.')), 300000); // 5 minute timeout
      });

      const assessmentPromise = runAssessment(
        contactData!,
        v2FormattedData,
        deepProfileData,
        sessionId!,
        handleProgress
      );

      const result = await Promise.race([assessmentPromise, timeoutPromise]) as any;

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
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('timed out');
      const isNetwork = errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch');
      
      // Show user-friendly error but continue to results
      if (isTimeout) {
        setAuthError('Assessment generation timed out. Showing results with available data. Please refresh if needed.');
      } else if (isNetwork) {
        setAuthError('Network error during generation. Showing results with available data. Please check your connection.');
      } else {
        setAuthError('Some data may be incomplete. Showing available results.');
      }
      
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
      <SaveResultsPrompt
        authFullName={authFullName}
        setAuthFullName={setAuthFullName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        isAuthLoading={isAuthLoading}
        onSubmit={handleSaveResults}
        onSkip={handleSkipSave}
      />
    );
  }

  if (currentScreen === 'deep-profile-optin') {
    return (
      <DeepProfileOptIn
        onStart={handleStartDeepProfile}
        onSkip={handleSkipDeepProfile}
      />
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
    <div className="bg-background h-[var(--mobile-vh)] overflow-hidden flex flex-col">
      {/* Safe area container - no scroll on outer container */}
      <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-6 lg:px-8 pt-safe-top pb-safe-bottom overflow-hidden">
        {/* Brand Header with Icon and Back Button */}
        <AssessmentHeader
          onBack={onBack ? handleBackWithConfirmation : undefined}
          showBackButton={progressData.currentQuestion > 1}
        />

        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full min-h-0 overflow-hidden">
          {/* Compact Progress Section */}
          <AssessmentProgressCard
            progressData={progressData}
            totalQuestions={totalQuestions}
          />

          {/* Current Question - Fills remaining space with internal scroll only */}
          {currentQuestion && (
            <AssessmentQuestionCard
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
              completedAnswers={progressData.completedAnswers}
              isProcessingAnswer={isProcessingAnswer}
              isComplete={assessmentState.isComplete}
              onOptionSelect={handleOptionSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};