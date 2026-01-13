import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mic, ArrowRight, User } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HeroSection() {
  const navigate = useNavigate()
  const [isHoveringMic, setIsHoveringMic] = useState(false)

  return (
    <div className="relative h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Video Background - Desktop only */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20 hidden lg:block"
        style={{
          filter: 'grayscale(0.3) brightness(0.8)',
        }}
      >
        <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background lg:from-background/80 lg:via-background/70 lg:to-background/90" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="hidden sm:inline">View Examples</span>
        </button>
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <User className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="/mindmaker-full-logo.png" 
                alt="Mindmaker" 
                className="h-7 sm:h-9 w-auto"
              />
            </div>

            {/* Headline */}
            <h1 className="text-xl sm:text-2xl font-bold text-center leading-tight mb-3">
              What's your biggest AI uncertainty right now?
            </h1>

            {/* Subtext */}
            <p className="text-sm text-muted-foreground text-center mb-6">
              30 seconds. Get one insight + one thing to do this week.
            </p>

            {/* Mic Button */}
            <div className="flex justify-center mb-4">
              <motion.button
                onClick={() => navigate('/voice')}
                onMouseEnter={() => setIsHoveringMic(true)}
                onMouseLeave={() => setIsHoveringMic(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center",
                  "bg-accent text-accent-foreground",
                  "transition-all duration-300",
                  "glow-accent-sm hover:glow-accent"
                )}
              >
                <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
              </motion.button>
            </div>

            {/* Type instead link */}
            <button
              onClick={() => navigate('/diagnostic')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 mb-6 transition-colors"
            >
              Or type your answer instead
            </button>

            {/* Primary CTA */}
            <Button
              onClick={() => navigate('/diagnostic')}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              See what AI sees
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {/* Secondary link */}
            <button
              onClick={() => navigate('/diagnostic')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              Prefer a structured assessment? <span className="underline underline-offset-4">Take the 2-min quiz →</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 pb-6 pt-2">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          For senior leaders who need AI literacy fast, not depth.
        </p>
      </footer>
    </div>
  )
}
