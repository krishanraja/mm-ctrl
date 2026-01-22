// src/components/onboarding/steps/WelcomeStep.tsx
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-center"
    >
      <div>
        <h1 className="text-4xl font-bold mb-4 text-[#00D9B6]">
          Welcome to CTRL
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Your AI decision-making confidante
        </p>
        <p className="text-gray-400">
          Let's understand your world so we can give you the most relevant advice
        </p>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-lg space-y-4 text-left">
        <h3 className="text-lg font-semibold text-[#00D9B6]">Why we ask</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">✓</span>
            <span>Your industry helps us benchmark you against similar leaders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">✓</span>
            <span>Your challenges help us tailor advice to your situation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">✓</span>
            <span>You can edit or delete any information at any time</span>
          </li>
        </ul>
      </div>

      <div className="pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-[#00D9B6] hover:bg-[#00C4A3] text-black font-semibold px-8"
        >
          Let's Begin
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Takes about 3 minutes • All information is private
      </p>
    </motion.div>
  )
}
