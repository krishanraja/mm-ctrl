import { useState, useCallback } from 'react';

export type CaptureStep =
  | 'welcome'
  | 'first_prompt'
  | 'recording'
  | 'processing'
  | 'verification'
  | 'value_moment'
  | 'second_prompt'
  | 'complete';

const GUIDED_PROMPTS = {
  first: "Tell me about yourself. What do you do, what's your company, and what keeps you up at night?",
  second: 'What are you working on right now? What decisions are you facing this week?',
  followups: [
    "What's the biggest thing on your plate right now?",
    'Tell me about your team. Who do you rely on most?',
    'What would success look like for you in the next 90 days?',
    "What's something you keep putting off?",
  ],
};

export function useGuidedCapture() {
  const [step, setStep] = useState<CaptureStep>('welcome');
  const [isFirstTime] = useState(() => {
    return !localStorage.getItem('mindmaker_onboarded');
  });
  const [currentPrompt, setCurrentPrompt] = useState(GUIDED_PROMPTS.first);
  const [extractedFactCount, setExtractedFactCount] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  const advance = useCallback(
    (factsCount?: number) => {
      if (factsCount) setExtractedFactCount((prev) => prev + factsCount);

      if (step === 'welcome') {
        setStep('first_prompt');
      } else if (step === 'first_prompt') {
        setStep('recording');
      } else if (step === 'recording') {
        setStep('processing');
      } else if (step === 'processing') {
        setStep('verification');
      } else if (step === 'verification') {
        if (roundNumber === 1) {
          setStep('value_moment');
        } else {
          setStep('complete');
        }
      } else if (step === 'value_moment') {
        setRoundNumber(2);
        setCurrentPrompt(GUIDED_PROMPTS.second);
        setStep('second_prompt');
      } else if (step === 'second_prompt') {
        setStep('recording');
      }
    },
    [step, roundNumber],
  );

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('mindmaker_onboarded', 'true');
    setStep('complete');
  }, []);

  const getNextPrompt = useCallback(() => {
    const idx = Math.floor(Math.random() * GUIDED_PROMPTS.followups.length);
    return GUIDED_PROMPTS.followups[idx];
  }, []);

  return {
    step,
    isFirstTime,
    currentPrompt,
    extractedFactCount,
    advance,
    completeOnboarding,
    getNextPrompt,
    prompts: GUIDED_PROMPTS,
  };
}
