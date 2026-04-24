// src/components/onboarding/steps/NorthStarStep.tsx
//
// Strategic context capture. Previously this rendered a single textarea
// and stored the first 200 chars as `strategicProblem`, leaving the other
// three fields empty (a stub that promised AI extraction "in production"
// but never delivered). The downstream VerificationStep then showed the
// user blank cards.
//
// Replaced with four direct prompts that map 1:1 to the four fields the
// rest of the app actually uses. No AI extraction needed; the user gives
// us exactly what we need.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'

interface NorthStarStepProps {
  onUpdate: (data: {
    strategicProblem: string
    biggestObstacle: string
    biggestFear: string
    strategicGoal: string
  }) => void
  onNext: () => void
  onBack: () => void
}

export function NorthStarStep({ onUpdate, onNext, onBack }: NorthStarStepProps) {
  const [strategicProblem, setStrategicProblem] = useState('')
  const [biggestObstacle, setBiggestObstacle] = useState('')
  const [biggestFear, setBiggestFear] = useState('')
  const [strategicGoal, setStrategicGoal] = useState('')

  // Problem and goal are required; obstacle and fear are nice-to-have.
  // A leader can give us a useful slice of context without filling everything.
  const canContinue = strategicProblem.trim().length > 0 && strategicGoal.trim().length > 0

  const handleSubmit = () => {
    if (!canContinue) return
    onUpdate({
      strategicProblem: strategicProblem.trim(),
      biggestObstacle: biggestObstacle.trim(),
      biggestFear: biggestFear.trim(),
      strategicGoal: strategicGoal.trim(),
    })
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-[#00D9B6]">
          What keeps you up at night?
        </h2>
        <p className="text-gray-300 text-base">
          Four short prompts. Required ones are marked.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="problem" className="text-gray-200">
            Biggest challenge right now <span className="text-[#00D9B6]">*</span>
          </Label>
          <Textarea
            id="problem"
            value={strategicProblem}
            onChange={(e) => setStrategicProblem(e.target.value)}
            placeholder="e.g. Scaling product team from 5 to 15 this quarter without losing shipping speed."
            rows={3}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal" className="text-gray-200">
            What you're trying to achieve <span className="text-[#00D9B6]">*</span>
          </Label>
          <Textarea
            id="goal"
            value={strategicGoal}
            onChange={(e) => setStrategicGoal(e.target.value)}
            placeholder="e.g. Ship v2 by end of quarter, hit $5M ARR, hire two senior engineers."
            rows={3}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="obstacle" className="text-gray-200">
            What's holding you back <span className="text-gray-500 text-xs">(optional)</span>
          </Label>
          <Textarea
            id="obstacle"
            value={biggestObstacle}
            onChange={(e) => setBiggestObstacle(e.target.value)}
            placeholder="e.g. I'm bottlenecked on every decision because nobody's been promoted to share it."
            rows={2}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fear" className="text-gray-200">
            What you're most worried about <span className="text-gray-500 text-xs">(optional)</span>
          </Label>
          <Textarea
            id="fear"
            value={biggestFear}
            onChange={(e) => setBiggestFear(e.target.value)}
            placeholder="e.g. Delegating the wrong decision to the wrong person and finding out three weeks too late."
            rows={2}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canContinue}
          className="bg-[#00D9B6] hover:bg-[#00C4A3] text-black font-semibold"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}
