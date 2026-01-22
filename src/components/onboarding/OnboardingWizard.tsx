// src/components/onboarding/OnboardingWizard.tsx
import { useState } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { BusinessContextStep } from './steps/BusinessContextStep'
import { NorthStarStep } from './steps/NorthStarStep'
import { VerificationStep } from './steps/VerificationStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { ProgressBar } from './ProgressBar'

type OnboardingStep = 'welcome' | 'business' | 'northstar' | 'verify' | 'preferences'

export interface OnboardingData {
  // Business context
  role?: string
  title?: string
  company?: string
  industry?: string
  companyStage?: string
  companySize?: string

  // North Star (extracted from voice/text)
  strategicProblem?: string
  biggestObstacle?: string
  biggestFear?: string
  strategicGoal?: string

  // Preferences
  communicationStyle?: string
  primaryFocus?: string
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [data, setData] = useState<OnboardingData>({})

  const steps: OnboardingStep[] = ['welcome', 'business', 'northstar', 'verify', 'preferences']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    } else {
      onComplete(data)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ProgressBar progress={progress} />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={nextStep} />
          )}

          {currentStep === 'business' && (
            <BusinessContextStep
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'northstar' && (
            <NorthStarStep
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'verify' && (
            <VerificationStep
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'preferences' && (
            <PreferencesStep
              data={data}
              onUpdate={updateData}
              onComplete={() => onComplete(data)}
              onBack={prevStep}
            />
          )}
        </div>
      </div>
    </div>
  )
}
