import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, ArrowRight, CheckCircle, Target, Clock, Zap, Rocket } from 'lucide-react';
import mindmakerLogo from '@/assets/mindmaker-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useStructuredAssessment } from '@/hooks/useStructuredAssessment';
import { ProgressScreen } from './ui/progress-screen';
import LLMInsightEngine from './ai-chat/LLMInsightEngine';
import { ContactCollectionForm, ContactData } from './ContactCollectionForm';
import { DeepProfileQuestionnaire, DeepProfileData } from './DeepProfileQuestionnaire';
import { SingleScrollResults } from './SingleScrollResults';
import { QuickPreview } from './QuickPreview';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';
import { useAssessment } from '@/contexts/AssessmentContext';
import { convertQuizToV2Format } from '@/utils/convertQuizToV2Format';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ScreenState = 
  | 'assessment' 
  | 'quick-preview'
  | 'contact-form' 
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('assessment');
  const [insightProgress, setInsightProgress] = useState(0);
  const [insightPhase, setInsightPhase] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  const [libraryProgress, setLibraryProgress] = useState(0);
  const [libraryPhase, setLibraryPhase] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  const { toast } = useToast();
  
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

  const initializeAssessmentSession = useCallback(async () => {
    try {
      const anonymousSessionId = crypto.randomUUID();
      
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
      setIsInitialized(true);

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Welcome to your AI Leadership Growth Benchmark. I'll guide you through ${totalQuestions} strategic questions designed to evaluate how your AI literacy drives growth—not just buzzwords.\n\nThis benchmark will help you:\n• **Assess your AI leadership capability**\n• **Identify growth acceleration opportunities**\n• **Benchmark against other executives**\n• **Create a strategic roadmap**\n\nEach question evaluates a different dimension of AI leadership. Let's begin your benchmark.`,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error initializing assessment session:', error);
      toast({
        title: "Session Error",
        description: "Failed to initialize assessment. Please refresh and try again.",
        variant: "destructive",
      });
    }
  }, [setSessionId, totalQuestions, toast]);

  useEffect(() => {
    if (!isInitialized) {
      initializeAssessmentSession();
    }
  }, [isInitialized, initializeAssessmentSession]);

  // Phase 1: Show Quick Preview after question 3, then contact form after all questions
  useEffect(() => {
    const progressData = getProgressData();
    const hasAnsweredAllQuestions = progressData.completedAnswers >= totalQuestions;
    const hasAnsweredThreeQuestions = progressData.completedAnswers >= 3;
    
    // After Q3, show quick preview (but only if not already past it)
    if (hasAnsweredThreeQuestions && !hasAnsweredAllQuestions && currentScreen === 'assessment' && !contactData) {
      setCurrentScreen('quick-preview');
    }
    
    // After all questions, go to contact form (value already shown)
    if (assessmentState.isComplete && hasAnsweredAllQuestions && currentScreen === 'assessment' && !contactData && insightProgress === 0) {
      setCurrentScreen('contact-form');
    }
  }, [assessmentState.isComplete, getProgressData, totalQuestions, currentScreen, contactData, insightProgress]);

  // Handle returning from quick preview to continue assessment
  const handleContinueFromPreview = useCallback(() => {
    setCurrentScreen('assessment');
  }, []);

  const handleOptionSelect = useCallback(async (option: string) => {
    if (!sessionId) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: option,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    answerQuestion(option);

    const progressData = getProgressData();
    const assessmentData = getAssessmentData();

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
          isComplete: assessmentState.isComplete
        }
      }, { logPrefix: '🤖' });

      if (error) throw error;

      if (data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      
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
        sessionStorage.setItem('v2_assessment_id', result.assessmentId);
        
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
        // Pipeline returned failure
        console.error('❌ Assessment pipeline failed:', result.error);
        toast({
          title: "Assessment Processing Issue",
          description: "Some insights may be incomplete. Showing available results.",
          variant: "default",
        });
        setInsightProgress(100);
        setCurrentScreen('unified-results');
      }
    } catch (error) {
      console.error('❌ V2 orchestration error:', error);
      
      // Show user-friendly message for timeout vs other errors
      if (error instanceof Error && error.message.includes('timed out')) {
        toast({
          title: "Generation Taking Longer Than Expected",
          description: "Your results are still being processed. We'll show what's ready now.",
          variant: "default",
        });
      } else {
        toast({
          title: "Assessment Processing Failed",
          description: error instanceof Error ? error.message : "Unable to generate your complete assessment. Please try again.",
          variant: "destructive",
        });
      }
      
      // Continue to results even if generation fails - fallback content will be shown
      setInsightProgress(100);
      setCurrentScreen('unified-results');
    }
  }, [contactData, deepProfileData, sessionId, getAssessmentData, toast, setPromptLibrary]);

  const handleContactSubmit = useCallback(async (data: ContactData) => {
    setContactData(data);
    
    const assessmentData = getAssessmentData();
    const progressData = getProgressData();
    
    // Populate index participant data and get company hash
    let companyHash: string | null = null;
    try {
      console.log('📊 Populating AI Leadership Index data...');
      const { data: indexData, error: indexError } = await invokeEdgeFunction('populate-index-participant', {
        sessionId: sessionId,
        userId: null,
        assessmentData: assessmentData,
        contactData: data,
        consentFlags: {
          index_publication: data.consentToInsights,
          product_improvements: true,
          case_study: false,
          research_partnerships: false,
          sales_outreach: false
        }
      }, { logPrefix: '📊' });
      
      if (!indexError && indexData?.companyHash) {
        companyHash = indexData.companyHash;
        console.log('✅ Index data populated successfully');
        
        // Update adoption momentum
        try {
          console.log('📈 Updating adoption momentum...');
          await invokeEdgeFunction('update-adoption-momentum', {
            companyHash: companyHash,
            sessionId: sessionId,
            userId: null,
            contactData: data,
            eventType: 'assessment_completed'
          }, { logPrefix: '📈' });
          console.log('✅ Momentum tracking updated');
        } catch (momentumError) {
          console.error('❌ Error updating momentum:', momentumError);
          // Don't block user flow
        }
      }
    } catch (error) {
      console.error('❌ Error populating index data:', error);
      // Don't block user flow if this fails
    }
    
    // Email will be sent after deep profile completion with all data
    
    setCurrentScreen('deep-profile-optin');
  }, [setContactData, getAssessmentData, getProgressData, sessionId, setCompanyHash]);

  const handleSkipDeepProfile = useCallback(() => {
    setInsightPhase('analyzing');
    setInsightProgress(15);
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
        
        const result = await runAssessment(
          contactData!,
          v2FormattedData,
          profileData,
          sessionId!
        );

        if (result.success && result.assessmentId) {
          console.log('✅ V2 assessment orchestrated successfully:', result.assessmentId);
          sessionStorage.setItem('v2_assessment_id', result.assessmentId);
          
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
            toast({
              title: "AI Command Center Ready!",
              description: promptsLoaded ? "Your personalized assessment is complete" : "Still generating prompts - they'll appear shortly",
            });
          }, 500);
        } else {
          console.error('❌ Assessment failed:', result.error);
          throw new Error('Assessment failed');
        }
      } catch (orchestrationError) {
        console.error('❌ V2 orchestration error:', orchestrationError);
        
        toast({
          title: "Generation Error",
          description: "Failed to complete assessment. Showing basic results instead.",
          variant: "destructive",
        });
        startInsightGeneration();
      }
    } catch (error: any) {
      console.error('Error in handleDeepProfileComplete:', error);
      
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }, [setDeepProfileData, getAssessmentData, getProgressData, contactData, sessionId, setPromptLibrary, toast, startInsightGeneration]);

  // Render based on current screen state
  
  // Quick Preview after Q3 - show value before asking for contact
  if (currentScreen === 'quick-preview') {
    const assessmentData = getAssessmentData();
    return (
      <QuickPreview
        assessmentData={assessmentData}
        onContinue={handleContinueFromPreview}
      />
    );
  }
  
  if (currentScreen === 'contact-form') {
    return (
      <ContactCollectionForm
        onSubmit={handleContactSubmit}
        onBack={onBack}
      />
    );
  }

  if (currentScreen === 'deep-profile-optin' && contactData) {
    return (
      <div className="bg-background min-h-screen relative overflow-hidden flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-sm border rounded-xl">
          <CardContent className="p-6 sm:p-8">
            {/* Minimal Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-primary text-sm mb-4">
                <Zap className="h-4 w-4" />
                <span>10x personalization</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
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
                className="w-full rounded-xl"
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
        onBack={onBack}
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
    <div className="bg-background min-h-screen relative overflow-hidden">
        {/* Back Button - Mobile Optimized */}
        {onBack && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
            <Button
              variant="outline"
              onClick={onBack}
              className="rounded-xl"
              aria-label="Go back to home page"
            >
              ← Back to Selection
            </Button>
          </div>
        )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-6 sm:py-8">
        {/* Header - Clean Mobile Design */}
        <div className="text-center mb-6 sm:mb-8 pt-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
            <img src={mindmakerLogo} alt="Mindmaker" className="h-4 w-4 object-contain" />
            AI Leadership Growth Benchmark
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight leading-tight">
            Benchmark Your AI
            <span className="block text-primary">Leadership Growth</span>
          </h1>
          
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            Evaluate how your AI literacy drives strategic growth and competitive advantage
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Progress Section - Clean Design */}
          <Card className="mb-6 sm:mb-8 shadow-sm border rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Benchmark Progress</h2>
                <Badge variant="outline" className="flex items-center gap-2 bg-primary/10 text-primary border-primary/20 px-3 py-1 whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  <span className="text-sm">{progressData.currentQuestion}/{totalQuestions}</span>
                </Badge>
              </div>
              
              <Progress value={progressData.progressPercentage} className="h-3 mb-3" />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Phase: {progressData.phase}</span>
                <span>{Math.round(progressData.estimatedTimeRemaining)} min remaining</span>
              </div>
            </CardContent>
          </Card>


          {/* Current Question - Clean Design */}
          {currentQuestion && (
            <Card className="shadow-sm border rounded-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 leading-tight">
                    Question {currentQuestion.id} of {totalQuestions}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground mb-4 text-sm">
                    Select your answer:
                  </h4>
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full h-auto text-left justify-start hover:bg-primary/10 transition-colors rounded-xl p-4"
                      onClick={() => handleOptionSelect(option)}
                      aria-label={`Select option: ${option}`}
                    >
                      <ArrowRight className="h-4 w-4 mr-3 flex-shrink-0 text-primary" />
                      <span className="text-sm text-foreground leading-relaxed text-left">{option}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};