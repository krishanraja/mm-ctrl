import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Mic, ArrowRight, User, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Feature data for carousel
const FEATURES = [
  {
    title: "Remembers You",
    description: "Your context persists across every conversation",
  },
  {
    title: "Voice-First",
    description: "Talk naturally, we extract what matters",
  },
  {
    title: "You Control",
    description: "Verify, edit, or reject anything we learn",
  },
  {
    title: "Always Relevant",
    description: "Advice grounded in who you actually are",
  },
]

export function HeroSection() {
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState(0)
  const [showDrawer, setShowDrawer] = useState(false)
  const dragX = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Swipe handling for mobile carousel
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 50
    const velocity = info.velocity.x
    const offset = info.offset.x

    if (offset < -threshold || velocity < -500) {
      setActiveFeature((prev) => Math.min(prev + 1, FEATURES.length - 1))
    } else if (offset > threshold || velocity > 500) {
      setActiveFeature((prev) => Math.max(prev - 1, 0))
    }
  }

  return (
    <div className="relative h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Video Background - Desktop only, very subtle */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.08] hidden lg:block"
        style={{ filter: 'grayscale(0.5) brightness(0.6)' }}
      >
        <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background" />

      {/* Top Bar - Minimal */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4">
        <motion.img 
          src="/mindmaker-full-logo.png" 
          alt="Mindmaker" 
          className="h-5 sm:h-6 w-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        <motion.button
          onClick={() => navigate('/auth')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
        >
          <User className="h-5 w-5 text-muted-foreground" />
        </motion.button>
      </header>

      {/* Main Content - Centered, No Scroll */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-lg">
          {/* Headline - Clean, Powerful */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center mb-8"
          >
            <h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none mb-4 text-foreground"
              style={{ 
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--accent)) 50%, hsl(var(--foreground)) 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer-text 3s ease-in-out infinite',
              }}
            >
              CTRL
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              The decision making confidante for AI in your life and business.
            </p>
          </motion.div>

          {/* Voice CTA - The Hero Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center mb-8"
          >
            {/* Mic Button with Glow */}
            <motion.button
              onClick={() => navigate('/voice')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full",
                "bg-accent text-accent-foreground",
                "flex items-center justify-center",
                "glow-accent transition-all duration-300"
              )}
            >
              {/* Subtle pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-accent/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
              <Mic className="h-8 w-8 sm:h-9 sm:w-9" />
            </motion.button>
            
            <motion.p 
              className="text-xs text-muted-foreground mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Tap to speak
            </motion.p>
          </motion.div>

          {/* Feature Carousel - Mobile Swipe / Desktop Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            {/* Carousel Container */}
            <div 
              ref={containerRef}
              className="relative overflow-hidden"
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                className="flex cursor-grab active:cursor-grabbing"
                animate={{ x: -activeFeature * 100 + "%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {FEATURES.map((feature, idx) => (
                  <div
                    key={idx}
                    className="w-full flex-shrink-0 px-2"
                  >
                    <div className={cn(
                      "text-center py-4 px-6 rounded-2xl",
                      "bg-secondary/30 border border-border/50",
                      "transition-all duration-300",
                      idx === activeFeature ? "opacity-100" : "opacity-50"
                    )}>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {feature.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {FEATURES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeature(idx)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    idx === activeFeature 
                      ? "w-6 bg-accent" 
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center gap-3"
          >
            <Button
              onClick={() => navigate('/diagnostic')}
              variant="outline"
              className="h-11 px-6 text-sm font-medium border-border/50 hover:bg-secondary/50"
            >
              Prefer to type? Take the 2-min quiz
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Bottom Drawer Trigger - Desktop Only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 hidden lg:flex justify-center pb-6"
      >
        <button
          onClick={() => setShowDrawer(true)}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Why Mindmaker?
        </button>
      </motion.div>

      {/* Footer - Minimal */}
      <footer className="relative z-10 px-4 sm:px-6 pb-4 lg:hidden">
        <p className="text-[10px] text-muted-foreground/40 text-center">
          For leaders who need AI literacy fast
        </p>
      </footer>

      {/* Desktop Feature Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm hidden lg:block"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 hidden lg:block"
            >
              <div className="bg-card border-t border-border rounded-t-3xl p-8 max-w-4xl mx-auto">
                {/* Drawer Handle */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="w-10 h-1 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 transition-colors"
                  />
                </div>

                {/* Drawer Content */}
                <div className="grid grid-cols-4 gap-6">
                  {FEATURES.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Drawer CTA */}
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={() => {
                      setShowDrawer(false)
                      navigate('/voice')
                    }}
                    className="h-11 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start with voice
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
