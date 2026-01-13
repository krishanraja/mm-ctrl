// src/components/diagnostic/DiagnosticFlow.tsx
import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ProgressBar } from "./ProgressBar"
import { QuestionCard } from "./QuestionCard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth/AuthProvider"

// Sample questions - in production, these would come from an API
const questions = [
  {
    id: "1",
    question: "How would you describe your current relationship with AI tools?",
    options: [
      { value: "a", label: "I use AI tools regularly and feel confident" },
      { value: "b", label: "I've tried AI tools but find them confusing" },
      { value: "c", label: "I haven't used AI tools much" },
    ],
  },
  {
    id: "2",
    question: "What's your biggest concern about AI in your role?",
    options: [
      { value: "a", label: "Replacing human judgment" },
      { value: "b", label: "Data privacy and security" },
      { value: "c", label: "Keeping up with rapid changes" },
    ],
  },
  {
    id: "3",
    question: "How do you currently make strategic decisions?",
    options: [
      { value: "a", label: "Primarily based on data and analytics" },
      { value: "b", label: "Mix of intuition and data" },
      { value: "c", label: "Mostly intuition and experience" },
    ],
  },
  {
    id: "4",
    question: "What would help you most with AI?",
    options: [
      { value: "a", label: "Understanding when to use AI vs human judgment" },
      { value: "b", label: "Practical tools I can use immediately" },
      { value: "c", label: "Strategic framework for AI adoption" },
    ],
  },
  {
    id: "5",
    question: "How do you prefer to learn?",
    options: [
      { value: "a", label: "Hands-on experimentation" },
      { value: "b", label: "Structured guidance and frameworks" },
      { value: "c", label: "Learning from others' experiences" },
    ],
  },
]

export function DiagnosticFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const currentQuestion = questions[currentStep]
  const selectedAnswer = answers[currentQuestion.id]

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
  }

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit assessment
      setLoading(true)
      try {
        await api.submitAssessment(answers)
        navigate('/dashboard')
      } catch (error) {
        console.error('Error submitting assessment:', error)
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border/50">
        <ProgressBar current={currentStep + 1} total={questions.length} />
      </div>

      {/* Question Content - Apple-level spacing */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10 md:mb-12 leading-[1.1] tracking-tight">
          {currentQuestion.question}
        </h2>
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {currentQuestion.options.map((option) => (
            <QuestionCard
              key={option.value}
              option={option.value}
              label={option.label}
              selected={selectedAnswer === option.value}
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Footer - Apple-level spacing */}
      <div className="flex-shrink-0 p-6 sm:p-8 md:p-10 border-t border-border/40 flex gap-4 sm:gap-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1 sm:flex-initial"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedAnswer || loading}
          className="flex-1 sm:flex-initial"
        >
          {currentStep === questions.length - 1 ? "Submit" : "Continue"}
          {currentStep < questions.length - 1 && (
            <ArrowRight className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>
    </div>
  )
}
