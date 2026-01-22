// src/components/onboarding/steps/PreferencesStep.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'

interface PreferencesStepProps {
  data: any
  onUpdate: (data: any) => void
  onComplete: () => void
  onBack: () => void
}

export function PreferencesStep({ data, onUpdate, onComplete, onBack }: PreferencesStepProps) {
  const [communicationStyle, setCommunicationStyle] = useState(data.communicationStyle || '')
  const [primaryFocus, setPrimaryFocus] = useState(data.primaryFocus || '')

  const handleComplete = () => {
    onUpdate({
      communicationStyle,
      primaryFocus,
    })
    onComplete()
  }

  const isValid = communicationStyle && primaryFocus

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#00D9B6] mb-2">
          Almost there!
        </h2>
        <p className="text-gray-400">
          Just a couple more quick questions to personalize your experience
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="communicationStyle">How do you prefer to receive advice? *</Label>
          <Select value={communicationStyle} onValueChange={setCommunicationStyle}>
            <SelectTrigger className="bg-gray-900 border-gray-700">
              <SelectValue placeholder="Select your preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct & concise</SelectItem>
              <SelectItem value="detailed">Detailed with examples</SelectItem>
              <SelectItem value="story">Story-based & contextual</SelectItem>
              <SelectItem value="data">Data-driven with metrics</SelectItem>
              <SelectItem value="inspirational">Inspirational & motivating</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            This affects how we structure our recommendations
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryFocus">What's your primary AI focus? *</Label>
          <Select value={primaryFocus} onValueChange={setPrimaryFocus}>
            <SelectTrigger className="bg-gray-900 border-gray-700">
              <SelectValue placeholder="Select your focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="productivity">Personal productivity</SelectItem>
              <SelectItem value="team_efficiency">Team efficiency</SelectItem>
              <SelectItem value="decision_making">Better decision making</SelectItem>
              <SelectItem value="communication">Clearer communication</SelectItem>
              <SelectItem value="strategy">Strategic thinking</SelectItem>
              <SelectItem value="automation">Workflow automation</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            We'll prioritize recommendations in this area
          </p>
        </div>
      </div>

      <div className="bg-[#00D9B6]/10 border border-[#00D9B6]/30 p-4 rounded-lg">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-[#00D9B6]">Ready to go!</span> Once you complete onboarding, you'll be able to:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-400">
          <li>• Get personalized AI recommendations</li>
          <li>• See how you compare to peers in your industry</li>
          <li>• Access your strategic roadmap</li>
        </ul>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!isValid}
          className="bg-[#00D9B6] hover:bg-[#00C4A3] text-black font-semibold px-8"
        >
          Complete Onboarding
        </Button>
      </div>
    </motion.div>
  )
}
