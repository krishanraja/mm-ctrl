import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, Zap, MessageSquare, ArrowRight, Sparkles, Download } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PILLARS = [
  {
    icon: Brain,
    title: "Memory Web",
    description: "Every conversation builds a rich map of who you are, what you do, and how you think.",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    icon: Zap,
    title: "10X Skills",
    description: "AI identifies your strengths to amplify and weaknesses to shore up — personalized to you.",
    color: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
  {
    icon: MessageSquare,
    title: "Master Prompts",
    description: "Custom prompts that make any AI instantly understand your context, voice, and goals.",
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
  },
]

const JOURNEY_STEPS = [
  "Talk naturally about your work",
  "We extract facts, skills & patterns",
  "Export to ChatGPT, Claude, or any AI",
  "Every AI conversation gets 10x better",
]

export function HeroSection() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % JOURNEY_STEPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-y-auto flex flex-col bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-transparent to-purple-500/[0.03]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
        <div className="flex items-center gap-2">
          <img
            src="/mindmaker-full-logo.png"
            alt="Mindmaker"
            className="h-5 sm:h-6 w-auto"
          />
        </div>
        <Button
          onClick={() => navigate('/auth')}
          variant="outline"
          size="sm"
          className="text-sm border-border/60 hover:bg-secondary/50"
        >
          Sign In
        </Button>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
              <Sparkles className="h-3 w-3" />
              For leaders building their AI advantage
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-4">
              Talk. We learn.{" "}
              <span className="bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent">
                Every AI gets smarter.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Narrate your world and Mindmaker builds your personal Memory Web, identifies your 10X skills, 
              and generates master prompts — a portable digital clone you take to any AI.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 sm:mb-16"
          >
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground/60">
              2 minutes to your first export. No credit card needed.
            </p>
          </motion.div>

          {/* Three Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-12 sm:mb-16"
          >
            {PILLARS.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                className={cn(
                  "relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5",
                  "hover:border-accent/30 transition-all duration-300",
                  "group"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                  "shadow-lg",
                  pillar.color,
                  pillar.glow,
                )}>
                  <pillar.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{pillar.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How It Works — animated journey */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="max-w-md mx-auto"
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-5">
              How it works
            </h2>
            <div className="space-y-3">
              {JOURNEY_STEPS.map((step, idx) => (
                <motion.div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500",
                    idx === activeStep
                      ? "bg-accent/10 border border-accent/20"
                      : "bg-transparent border border-transparent"
                  )}
                >
                  <span className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                    idx === activeStep
                      ? "bg-accent text-accent-foreground"
                      : idx < activeStep
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {idx + 1}
                  </span>
                  <span className={cn(
                    "text-sm transition-colors duration-500",
                    idx === activeStep ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Export targets */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-10 sm:mt-14 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Download className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium">
                Export to
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
              {["ChatGPT", "Claude", "Gemini", "Cursor", "Any LLM"].map((name) => (
                <span key={name} className="text-xs text-muted-foreground/40 font-medium">
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-5 sm:px-8 py-4 text-center">
        <p className="text-[10px] text-muted-foreground/30">
          Your data is private. Export anytime. Delete anytime.
        </p>
      </footer>
    </div>
  )
}
