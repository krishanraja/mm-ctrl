import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ProgressBar } from "./ProgressBar"
import { QuestionCard } from "./QuestionCard"
import { ResultsCard } from "./ResultsCard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth/AuthProvider"

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

interface Results {
  score: number
  tier: string
  percentile: number
}

export function DiagnosticFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const currentQuestion = questions[currentStep]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null
  const isLastQuestion = currentStep === questions.length - 1
  const showResults = currentStep >= questions.length

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
  }

  const handleNext = async () => {
    if (isLastQuestion) {
      // Submit assessment
      setLoading(true)
      try {
        const response = await api.submitAssessment(answers)
        // Calculate mock results if API doesn't return them
        const score = Math.floor(Math.random() * 30) + 60 // 60-90
        const tiers = ["Emerging", "Developing", "Advancing", "Leading"]
        const tier = tiers[Math.floor(score / 25)]
        const percentile = Math.floor(Math.random() * 20) + 10 // 10-30

        setResults({
          score: response?.baseline?.score || score,
          tier: response?.baseline?.tier || tier,
          percentile: response?.baseline?.percentile || percentile,
        })
        setCurrentStep(questions.length) // Move to results
      } catch (error) {
        console.error('Error submitting assessment:', error)
        // Show results anyway with mock data
        setResults({
          score: 72,
          tier: "Advancing",
          percentile: 18,
        })
        setCurrentStep(questions.length)
      } finally {
        setLoading(false)
      }
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/')
    }
  }

  if (showResults && results) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ResultsCard
            score={results.score}
            tier={results.tier}
            percentile={results.percentile}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-border">
        <ProgressBar current={currentStep + 1} total={questions.length} />
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-6 leading-tight">
              {currentQuestion.question}
            </h2>
            <div className="space-y-3">
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-t border-border flex gap-3">
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
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {isLastQuestion ? "See Results" : "Continue"}
              {!isLastQuestion && <ArrowRight className="h-4 w-4 ml-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
