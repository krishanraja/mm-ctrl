import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, Zap, MessageSquare, ArrowRight, Sparkles, Download } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { SwipeableCards } from "@/components/mobile/SwipeableCards"

const PILLARS = [
  {
    icon: Brain,
    title: "Memory Web",
    description: "Your thoughts, organized. A living map of what you know, what you want, and how you think — portable to any AI.",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    icon: Zap,
    title: "Team Instructions",
    description: "Your thinking, delegated. Turn your context into clear instructions for anyone on your team.",
    color: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
  {
    icon: MessageSquare,
    title: "Context Export",
    description: "Your context, everywhere. One click to ChatGPT, Claude, Cursor, or any AI tool.",
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
  },
]

const JOURNEY_STEPS = [
  "Voice a thought",
  "It organizes itself",
  "Export anywhere",
  "Every decision gets clearer",
]

/* ------------------------------------------------------------------ */
/*  Screen 1 — Hero                                                    */
/* ------------------------------------------------------------------ */
function HeroScreen({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-5">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
          <Sparkles className="h-3 w-3" />
          For leaders who think before they decide
        </span>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center mb-5"
      >
        <h1 className="text-3xl font-bold leading-[1.1] text-foreground mb-3">
          Think out loud.{" "}
          <span className="bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent">
            See what emerges.
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Voice your thoughts. Mindmaker organizes them into a Memory Web — your portable context that makes every AI smarter, and instructions that make your team sharper.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center gap-2"
      >
        <Button
          onClick={onGetStarted}
          size="lg"
          className="h-12 px-8 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
        >
          Get Started Free
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground/60">
          2 minutes to clarity
        </p>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Screen 2 — Three Pillars                                           */
/* ------------------------------------------------------------------ */
function PillarsScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-5">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-semibold text-foreground mb-5"
      >
        What you get
      </motion.h2>

      <div className="w-full max-w-sm space-y-3">
        {PILLARS.map((pillar, idx) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className={cn(
              "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4",
              "flex items-start gap-3"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center",
              "shadow-lg",
              pillar.color,
              pillar.glow,
            )}>
              <pillar.icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-0.5">{pillar.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Screen 3 — How It Works + Export                                   */
/* ------------------------------------------------------------------ */
function JourneyScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % JOURNEY_STEPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col items-center justify-center px-5">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-semibold text-foreground mb-5"
      >
        How it works
      </motion.h2>

      {/* Journey steps */}
      <div className="w-full max-w-sm space-y-2 mb-6">
        {JOURNEY_STEPS.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500",
              idx === activeStep
                ? "bg-accent/10 border border-accent/20"
                : "bg-transparent border border-transparent"
            )}
          >
            <span className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
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

      {/* Export targets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-5"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Download className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium">
            Export to
          </span>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {["ChatGPT", "Claude", "Gemini", "Cursor", "Any LLM"].map((name) => (
            <span key={name} className="text-xs text-muted-foreground/40 font-medium">
              {name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onGetStarted}
          size="lg"
          className="h-11 px-7 text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
        >
          Get Started Free
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Desktop Layout — viewport-contained, two-column                    */
/* ------------------------------------------------------------------ */
function DesktopLayout({ onGetStarted }: { onGetStarted: () => void }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % JOURNEY_STEPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 py-6 overflow-hidden">
      <div className="w-full max-w-5xl">
        {/* Badge + Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            For leaders who think before they decide
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-3">
            Think out loud.{" "}
            <span className="bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent">
              See what emerges.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Voice your thoughts. Mindmaker organizes them into a Memory Web — your portable context that makes every AI smarter, and instructions that make your team sharper.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Button
            onClick={onGetStarted}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground/60">
            2 minutes to clarity. No credit card needed.
          </p>
        </motion.div>

        {/* Two-column: Pillars + Journey */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left — Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-3"
          >
            {PILLARS.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                className={cn(
                  "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4",
                  "hover:border-accent/30 transition-all duration-300",
                  "flex items-start gap-3"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  "shadow-lg",
                  pillar.color,
                  pillar.glow,
                )}>
                  <pillar.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right — Journey + Export */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              How it works
            </h2>
            <div className="space-y-2 mb-6">
              {JOURNEY_STEPS.map((step, idx) => (
                <motion.div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500",
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

            {/* Export targets */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Download className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium">
                  Export to
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {["ChatGPT", "Claude", "Gemini", "Cursor", "Any LLM"].map((name) => (
                  <span key={name} className="text-xs text-muted-foreground/40 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/*  HeroSection — entry point                                          */
/* ------------------------------------------------------------------ */
export function HeroSection() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const handleGetStarted = () => navigate('/auth')

  return (
    <div className="relative h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />

      {/* Header — always visible */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 flex-shrink-0">
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

      {/* Main content area */}
      {isMobile ? (
        /* Mobile — swipeable 3-screen experience */
        <SwipeableCards
          className="relative z-10 flex-1 min-h-0"
          dotClassName="pb-1"
        >
          <HeroScreen onGetStarted={handleGetStarted} />
          <PillarsScreen />
          <JourneyScreen onGetStarted={handleGetStarted} />
        </SwipeableCards>
      ) : (
        /* Desktop — single viewport-contained layout */
        <DesktopLayout onGetStarted={handleGetStarted} />
      )}

      {/* Footer — always visible */}
      <footer className="relative z-10 px-5 sm:px-8 py-3 text-center flex-shrink-0">
        <p className="text-[10px] text-muted-foreground/30">
          Private by design. Portable by default.
        </p>
      </footer>
    </div>
  )
}
