// src/components/onboarding/steps/NorthStarStep.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Mic, Type } from 'lucide-react'

interface NorthStarStepProps {
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function NorthStarStep({ onUpdate, onNext, onBack }: NorthStarStepProps) {
  const [mode, setMode] = useState<'voice' | 'text'>('text') // Default to text for simplicity
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async () => {
    if (!textInput.trim()) return

    setIsProcessing(true)

    try {
      // For now, do simple extraction locally
      // In production, this would call the edge function
      const extracted = extractStrategicContext(textInput)

      onUpdate({
        strategicProblem: extracted.problem,
        biggestObstacle: extracted.obstacle,
        biggestFear: extracted.fear,
        strategicGoal: extracted.goal,
      })

      onNext()
    } catch (error) {
      console.error('Extraction failed:', error)
      // Continue anyway with raw text
      onUpdate({
        strategicProblem: textInput,
        biggestObstacle: '',
        biggestFear: '',
        strategicGoal: '',
      })
      onNext()
    } finally {
      setIsProcessing(false)
    }
  }

  // Simple local extraction (will be replaced with AI in production)
  const extractStrategicContext = (text: string) => {
    return {
      problem: text.substring(0, 200), // Use first part as problem
      obstacle: '', // To be extracted by AI
      fear: null, // To be extracted by AI
      goal: '', // To be extracted by AI
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-[#00D9B6]">
          What keeps you up at night?
        </h2>
        <p className="text-gray-300 text-lg">
          Understanding your biggest challenge helps us give you relevant, actionable advice.
        </p>
        <p className="text-sm text-gray-500">
          🔒 Your response is private and helps us tailor recommendations to your situation
        </p>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-lg">
        <p className="text-gray-300 mb-4">Tell us about:</p>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">•</span>
            <span>Your biggest business challenge or problem right now</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">•</span>
            <span>What's holding you back from solving it</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">•</span>
            <span>What you're most worried about (optional)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00D9B6]">•</span>
            <span>What you're trying to achieve</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Example: I'm scaling our product team from 5 to 15 people this quarter, but I'm worried about maintaining quality and shipping speed. We keep missing deadlines because I'm bottlenecked on all decisions. I need to delegate more effectively but I'm not sure who to trust with what..."
          className="min-h-[200px] bg-gray-900 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-500">
          Be as specific as you can - the more context you provide, the better our recommendations will be
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!textInput.trim() || isProcessing}
          className="bg-[#00D9B6] hover:bg-[#00C4A3] text-black font-semibold"
        >
          {isProcessing ? 'Processing...' : 'Continue'}
        </Button>
      </div>
    </motion.div>
  )
}
