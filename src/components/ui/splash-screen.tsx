import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false)
    }, duration - 400)

    const completeTimer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      clearTimeout(fadeOutTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center"
        >
          {/* Subtle dot pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Centered content */}
          <div className="relative flex flex-col items-center">
            {/* Animated ring container */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              {/* Rotating gradient ring */}
              <div 
                className="absolute inset-0 rounded-full splash-ring"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, hsl(158 64% 45%) 60deg, hsl(158 64% 45% / 0.8) 120deg, transparent 180deg)`,
                  padding: '3px',
                }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0a]" />
              </div>
              
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-40 blur-xl"
                style={{
                  background: `radial-gradient(circle, hsl(158 64% 45% / 0.5) 0%, transparent 70%)`,
                }}
              />

              {/* Inner circle with icon */}
              <div className="absolute inset-2 rounded-full bg-[#121212] flex items-center justify-center">
                <motion.img 
                  src="/mindmaker-favicon.png" 
                  alt="Mindmaker" 
                  className="w-14 h-14 sm:w-18 sm:h-18 splash-icon-pulse"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
