import { useState, useCallback, useEffect, useRef } from 'react';

export interface AssessmentQuestion {
  id: number;
  phase: string;
  question: string;
  options: string[];
  type: 'multiple_choice' | 'open_ended';
  category: string;
}

export interface AssessmentResponse {
  questionId: number;
  answer: string;
  timestamp: Date;
  category: string;
}

export interface AssessmentState {
  currentQuestion: number;
  responses: AssessmentResponse[];
  phase: string;
  isComplete: boolean;
  selectedOption: string | null;
}

const QUIZ_PROGRESS_KEY = 'mindmaker_quiz_progress';
const QUIZ_SESSION_KEY = 'mindmaker_quiz_session_id';

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    phase: 'Leadership Growth',
    question: 'I can clearly explain AI\'s impact on our industry in growth terms.',
    options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
    type: 'multiple_choice',
    category: 'industry_impact'
  },
  {
    id: 2,
    phase: 'Leadership Growth',
    question: 'I know which areas of our business can be accelerated by AI-first workflows.',
    options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
    type: 'multiple_choice',
    category: 'business_acceleration'
  },
  {
    id: 3,
    phase: 'Leadership Growth',
    question: 'My leadership team shares a common AI growth narrative.',
    options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
    type: 'multiple_choice',
    category: 'team_alignment'
  },
  {
    id: 4,
    phase: 'Leadership Growth',
    question: 'AI is part of our external positioning (investors, market).',
    options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
    type: 'multiple_choice',
    category: 'external_positioning'
  },
  {
    id: 5,
    phase: 'Leadership Growth',
    question: 'I connect AI adoption directly to KPIs (margin, speed, risk-adjusted growth).',
    options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
    type: 'multiple_choice',
    category: 'kpi_connection'
  },
  {
    id: 6,
    phase: 'Leadership Growth',
    question: 'I actively coach emerging AI champions in my org.',
    options: ['1 - Strongly Disagree', '2 - Disagree', '3 - Neutral', '4 - Agree', '5 - Strongly Agree'],
    type: 'multiple_choice',
    category: 'coaching_champions'
  }
];

export const useStructuredAssessment = () => {
  // Generate or retrieve session ID for this quiz session
  const getOrCreateSessionId = (): string => {
    const existing = sessionStorage.getItem(QUIZ_SESSION_KEY);
    if (existing) return existing;
    const newId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(QUIZ_SESSION_KEY, newId);
    return newId;
  };

  // Load persisted state from localStorage
  const loadPersistedState = (): AssessmentState | null => {
    try {
      const persisted = localStorage.getItem(QUIZ_PROGRESS_KEY);
      if (!persisted) return null;
      
      const parsed = JSON.parse(persisted);
      // Validate persisted data structure
      if (
        parsed &&
        typeof parsed.currentQuestion === 'number' &&
        Array.isArray(parsed.responses) &&
        typeof parsed.phase === 'string'
      ) {
        // Convert timestamp strings back to Date objects
        const responses = parsed.responses.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
        return {
          currentQuestion: parsed.currentQuestion,
          responses,
          phase: parsed.phase,
          isComplete: parsed.isComplete || false,
          selectedOption: null
        };
      }
    } catch (error) {
      console.error('Failed to load persisted quiz state:', error);
    }
    return null;
  };

  // Save state to localStorage with debounce
  const saveStateRef = useRef<NodeJS.Timeout | null>(null);
  const saveState = useCallback((state: AssessmentState) => {
    if (saveStateRef.current) {
      clearTimeout(saveStateRef.current);
    }
    saveStateRef.current = setTimeout(() => {
      try {
        // Only persist if not complete (completed assessments are handled elsewhere)
        if (!state.isComplete) {
          localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify({
            currentQuestion: state.currentQuestion,
            responses: state.responses,
            phase: state.phase,
            isComplete: state.isComplete,
            sessionId: getOrCreateSessionId()
          }));
        } else {
          // Clear persisted state when complete
          localStorage.removeItem(QUIZ_PROGRESS_KEY);
          sessionStorage.removeItem(QUIZ_SESSION_KEY);
        }
      } catch (error) {
        console.error('Failed to persist quiz state:', error);
      }
    }, 500); // 500ms debounce
  }, []);

  // Initialize state from localStorage or defaults
  const persistedState = loadPersistedState();
  const [assessmentState, setAssessmentState] = useState<AssessmentState>(
    persistedState || {
      currentQuestion: 1,
      responses: [],
      phase: 'Leadership Growth',
      isComplete: false,
      selectedOption: null
    }
  );

  // Persist state whenever it changes
  useEffect(() => {
    saveState(assessmentState);
  }, [assessmentState, saveState]);

  const getCurrentQuestion = useCallback(() => {
    return ASSESSMENT_QUESTIONS.find(q => q.id === assessmentState.currentQuestion) || null;
  }, [assessmentState.currentQuestion]);

  const answerQuestion = useCallback((answer: string) => {
    const currentQ = getCurrentQuestion();
    if (!currentQ) return;

    const response: AssessmentResponse = {
      questionId: currentQ.id,
      answer,
      timestamp: new Date(),
      category: currentQ.category
    };

    setAssessmentState(prev => {
      const newResponses = [...prev.responses.filter(r => r.questionId !== currentQ.id), response];
      const nextQuestion = prev.currentQuestion + 1;
      // Only mark complete when we've answered ALL questions and moved past the last one
      const isComplete = nextQuestion > ASSESSMENT_QUESTIONS.length;
      
      const nextPhase = isComplete ? 'Complete' : 
        ASSESSMENT_QUESTIONS.find(q => q.id === nextQuestion)?.phase || prev.phase;

      return {
        ...prev,
        responses: newResponses,
        currentQuestion: isComplete ? prev.currentQuestion : nextQuestion,
        phase: nextPhase,
        isComplete,
        selectedOption: null
      };
    });
  }, [getCurrentQuestion]);

  const setSelectedOption = useCallback((option: string | null) => {
    setAssessmentState(prev => ({
      ...prev,
      selectedOption: option
    }));
  }, []);

  const getProgressData = useCallback(() => {
    const totalQuestions = ASSESSMENT_QUESTIONS.length;
    const completedAnswers = assessmentState.responses.length;
    const estimatedTimeRemaining = Math.max(0, (totalQuestions - completedAnswers) * 0.33); // 0.33 min per question

    return {
      currentQuestion: assessmentState.currentQuestion,
      totalQuestions,
      phase: assessmentState.phase,
      completedAnswers,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      progressPercentage: (completedAnswers / totalQuestions) * 100
    };
  }, [assessmentState]);

  const getAssessmentData = useCallback(() => {
    const data: Record<string, any> = {};
    
    assessmentState.responses.forEach(response => {
      data[response.category] = response.answer;
    });

    return data;
  }, [assessmentState.responses]);

  const resetAssessment = useCallback(() => {
    // Clear persisted state
    localStorage.removeItem(QUIZ_PROGRESS_KEY);
    sessionStorage.removeItem(QUIZ_SESSION_KEY);
    setAssessmentState({
      currentQuestion: 1,
      responses: [],
      phase: 'Leadership Growth',
      isComplete: false,
      selectedOption: null
    });
  }, []);

  // Get session ID for this quiz session
  const getSessionId = useCallback(() => {
    return getOrCreateSessionId();
  }, []);

  return {
    assessmentState,
    getCurrentQuestion,
    answerQuestion,
    setSelectedOption,
    getProgressData,
    getAssessmentData,
    resetAssessment,
    getSessionId,
    totalQuestions: ASSESSMENT_QUESTIONS.length
  };
};