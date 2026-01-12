import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // Duration in milliseconds
}

export function SplashScreen({ onComplete, duration = 4000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out slightly before unmounting for smooth transition
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration - 300); // Start fade out 300ms before completion

    // Complete after full duration
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        >
          {/* Dark background with subtle pattern */}
          <div className="absolute inset-0 bg-black/90" />
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--soft-white)) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Centered content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Icon with shimmering circle */}
            <div className="relative flex items-center justify-center">
              {/* Shimmering mint green circle */}
              <div className="splash-circle-shimmer w-32 h-32 sm:w-40 sm:h-40">
                {/* Inner circle with icon */}
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <motion.img 
                    src="/mindmaker-favicon.png" 
                    alt="Mindmaker" 
                    className="w-12 h-12 sm:w-16 sm:h-16 brightness-0 invert splash-icon-pulse"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* "Level Up with AI" text - matching CTRL formatting */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <span 
                className="brand-typography-ctrl flex items-center justify-center font-bold shimmer-mint" 
                style={{ transform: 'translateY(-0.5px)', letterSpacing: '0.06em' }}
              >
                Level Up with AI
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
