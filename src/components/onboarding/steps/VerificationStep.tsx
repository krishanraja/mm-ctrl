// src/components/onboarding/steps/VerificationStep.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Check, Edit2 } from 'lucide-react'

interface VerificationStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function VerificationStep({ data, onUpdate, onNext, onBack }: VerificationStepProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const fields = [
    { key: 'strategicProblem', label: 'Your Biggest Challenge', icon: '🎯' },
    { key: 'biggestObstacle', label: 'What\'s Holding You Back', icon: '🚧' },
    { key: 'biggestFear', label: 'Your Main Concern', icon: '💭' },
    { key: 'strategicGoal', label: 'What You\'re Trying to Achieve', icon: '🏆' },
  ]

  const handleEdit = (key: string, value: string) => {
    setIsEditing(key)
    setEditValue(value || '')
  }

  const handleSave = (key: string) => {
    onUpdate({ [key]: editValue })
    setIsEditing(null)
  }

  const handleCancel = () => {
    setIsEditing(null)
    setEditValue('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#00D9B6] mb-2">
          Verify & Edit
        </h2>
        <p className="text-gray-400">
          Review what we captured and make any adjustments
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field) => {
          const value = data[field.key]
          const isCurrentlyEditing = isEditing === field.key

          if (!value && !isCurrentlyEditing) {
            return null // Skip empty fields unless editing
          }

          return (
            <div key={field.key} className="bg-gray-900 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{field.icon}</span>
                  <span className="font-semibold text-gray-300">{field.label}</span>
                </div>
                {!isCurrentlyEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(field.key, value)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isCurrentlyEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(field.key)}
                      className="bg-[#00D9B6] hover:bg-[#00C4A3] text-black"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">{value}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-[#00D9B6] hover:bg-[#00C4A3] text-black font-semibold"
        >
          Looks Good
        </Button>
      </div>
    </motion.div>
  )
}
