import { useState, useCallback } from 'react';

export type CaptureStep =
  | 'welcome'
  | 'prompt_intro'
  | 'prompt_identity'
  | 'recording'
  | 'processing'
  | 'verification'
  | 'prompt_work'
  | 'prompt_goals'
  | 'value_moment'
  | 'complete';

export type CaptureArea = 'identity' | 'work' | 'goals';

const GUIDED_PROMPTS: Record<CaptureArea, { title: string; prompt: string; hint: string }> = {
  identity: {
    title: "Who You Are",
    prompt: "Tell me about yourself — your role, your company, and what you're known for.",
    hint: "Example: \"I'm a VP of Product at a 200-person fintech startup. I'm known for building consensus across engineering and design teams.\"",
  },
  work: {
    title: "What You're Working On",
    prompt: "What are you working on right now? What decisions are on your plate this week?",
    hint: "Example: \"We're deciding whether to build AI features in-house or partner with an API provider. I need to present a recommendation to the board by Friday.\"",
  },
  goals: {
    title: "Where You're Headed",
    prompt: "What does success look like for you in the next 90 days? What's in your way?",
    hint: "Example: \"I need to ship our v2 product, hire a senior engineer, and reduce customer churn by 15%. My biggest blocker is bandwidth — I'm in meetings 6 hours a day.\"",
  },
};

const CAPTURE_SEQUENCE: CaptureArea[] = ['identity', 'work', 'goals'];

export function useGuidedCapture() {
  const [step, setStep] = useState<CaptureStep>('welcome');
  const [isFirstTime] = useState(() => !localStorage.getItem('mindmaker_onboarded'));
  const [currentArea, setCurrentArea] = useState<CaptureArea>('identity');
  const [areaIndex, setAreaIndex] = useState(0);
  const [extractedFactCount, setExtractedFactCount] = useState(0);
  const [completedAreas, setCompletedAreas] = useState<CaptureArea[]>([]);

  const currentPromptData = GUIDED_PROMPTS[currentArea];
  const totalAreas = CAPTURE_SEQUENCE.length;

  const advance = useCallback(
    (factsCount?: number) => {
      if (factsCount) setExtractedFactCount((prev) => prev + factsCount);

      // Use functional updater to avoid stale closure bugs when advance()
      // is called multiple times within the same async handler (e.g.
      // handleTranscript calls advance() then awaits extraction then advance(count)).
      setStep((currentStep) => {
        switch (currentStep) {
          case 'welcome':
            return 'prompt_intro';
          case 'prompt_intro':
            return 'prompt_identity';
          case 'prompt_identity':
          case 'prompt_work':
          case 'prompt_goals':
            return 'recording';
          case 'recording':
            return 'processing';
          case 'processing':
            return 'verification';
          case 'value_moment':
            return 'complete';
          case 'verification':
            // Handled below with side effects
            return currentStep;
          default:
            return currentStep;
        }
      });

      // Handle verification → next area transition separately because it
      // requires updating multiple pieces of state (completedAreas, areaIndex,
      // currentArea). This path is only reached from UI event handlers where
      // the closure values are fresh.
      if (step === 'verification') {
        const newCompleted = [...completedAreas, currentArea];
        setCompletedAreas(newCompleted);
        const nextIdx = areaIndex + 1;
        if (nextIdx < CAPTURE_SEQUENCE.length) {
          const nextArea = CAPTURE_SEQUENCE[nextIdx];
          setAreaIndex(nextIdx);
          setCurrentArea(nextArea);
          setStep(`prompt_${nextArea}` as CaptureStep);
        } else {
          setStep('value_moment');
        }
      }
    },
    [step, areaIndex, currentArea, completedAreas],
  );

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('mindmaker_onboarded', 'true');
    setStep('complete');
  }, []);

  return {
    step,
    isFirstTime,
    currentArea,
    currentPromptData,
    extractedFactCount,
    completedAreas,
    totalAreas,
    areaIndex,
    advance,
    completeOnboarding,
    prompts: GUIDED_PROMPTS,
  };
}
