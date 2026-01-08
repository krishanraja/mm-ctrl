/**
 * Mindmaker Control - Executive Control Surface
 * 
 * The home screen. Nothing else competes with it.
 * 
 * User intent: "I've got 30 seconds. Tell me what matters."
 * 
 * Rules:
 * - One thumb
 * - One breath
 * - One decision
 * - If it takes more than 30 seconds to get value, it's wrong.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTodaysTension } from '@/hooks/useTodaysTension';
import { ExecutiveVoiceCapture } from '@/components/voice/ExecutiveVoiceCapture';
import { transitions, variants, fadeInProps, premiumVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { ensureAnonSession } from '@/utils/ensureAnonSession';
import { FaviconMark } from '@/components/ui/FaviconMark';

interface ExecutiveControlSurfaceProps {
  onNavigateToBaseline?: () => void;
}

export const ExecutiveControlSurface: React.FC<ExecutiveControlSurfaceProps> = ({
  onNavigateToBaseline,
}) => {
  const navigate = useNavigate();
  const { content, isLoading } = useTodaysTension();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [hasInitAuth, setHasInitAuth] = useState(false);
  
  // Detect if user is new (no baseline assessment)
  const { assessmentId } = getPersistedAssessmentId();
  const isNewUser = !assessmentId;

  // Use ref for timer to prevent memory leaks
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  // Initialize auth on first interaction (friction-free start)
  const initAuthOnFirstInteraction = useCallback(async () => {
    if (hasInitAuth) return;
    try {
      const { userId } = await ensureAnonSession();
      if (userId) setHasInitAuth(true);
    } catch (err) {
      console.warn('Auth initialization failed:', err);
    }
  }, [hasInitAuth]);

  const handleMicPress = useCallback(() => {
    initAuthOnFirstInteraction();
    setIsVoiceActive(true);
  }, [initAuthOnFirstInteraction]);

  const handleVoiceClose = useCallback(() => {
    setIsVoiceActive(false);
  }, []);

  const handleLongPress = useCallback(() => {
    // Long-press anywhere triggers voice
    initAuthOnFirstInteraction();
    setIsVoiceActive(true);
  }, [initAuthOnFirstInteraction]);

  const handlePressStart = useCallback(() => {
    const timer = setTimeout(() => {
      handleLongPress();
    }, 500); // 500ms for long press
    pressTimerRef.current = timer;
  }, [handleLongPress]);

  const handlePressEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);
  
  const handleStartBaseline = useCallback(() => {
    initAuthOnFirstInteraction();
    navigate('/diagnostic');
  }, [navigate, initAuthOnFirstInteraction]);

  return (
    <div 
      className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 py-12"
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
    >
      {/* Favicon mark in top-left */}
      {!isVoiceActive && <FaviconMark />}
      
      <AnimatePresence mode="wait">
        {isVoiceActive ? (
          <ExecutiveVoiceCapture 
            key="voice"
            onClose={handleVoiceClose}
            tensionContext={content?.summary}
          />
        ) : (
          <motion.div
            key="surface"
            className="w-full max-w-md"
            {...fadeInProps}
            transition={transitions.default}
          >
            {/* Main Tension Card - Premium styling with animated border */}
            <motion.div
              className="card-premium rounded-2xl p-8 mb-8 border-glow"
              variants={premiumVariants.cardGlow}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              transition={transitions.card}
            >
              {/* Top line - always visible */}
              <div className="mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {content?.title || "Today's tension"}
                </h2>
              </div>

              {/* One sentence - the core value */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={content?.summary}
                  className="text-xl text-foreground leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.fast}
                >
                  {isLoading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    content?.summary
                  )}
                </motion.p>
              </AnimatePresence>

              {/* "See why" expandable */}
              {content?.dimension && (
                <motion.div className="mt-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWhy(!showWhy);
                    }}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>See why</span>
                    <motion.div
                      animate={{ rotate: showWhy ? 90 : 0 }}
                      transition={transitions.fast}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {showWhy && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={transitions.default}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                          Based on your {content.type === 'tension' ? 'diagnostic tensions' : 
                            content.type === 'risk' ? 'risk signals' : 'scenario analysis'} 
                          {content.dimension && ` in ${content.dimension.replace(/_/g, ' ')}`}.
                        </p>
                        {onNavigateToBaseline && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToBaseline();
                            }}
                            className="text-sm text-primary mt-2 hover:underline"
                          >
                            View full baseline
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>

            {/* Primary Actions */}
            {isNewUser ? (
              <>
                {/* New User: Start Baseline CTA - Premium button with slide effect */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartBaseline();
                  }}
                  className={cn(
                    "w-full py-5 rounded-2xl mb-3",
                    "btn-primary-glow",
                    "flex items-center justify-center gap-3",
                    "text-lg font-medium"
                  )}
                  variants={premiumVariants.cardGlow}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={transitions.fast}
                >
                  <span>Start Your Baseline</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                
                {/* Secondary: Voice capture for new users - Premium outline button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMicPress();
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl",
                    "btn-premium",
                    "flex items-center justify-center gap-3",
                    "text-base font-medium"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={transitions.fast}
                >
                  <Mic className="w-5 h-5" />
                  <span>Or talk through a decision now</span>
                </motion.button>
                
                <p className="text-center text-xs text-muted-foreground mt-3">
                  2 minutes to personalized insights
                </p>
              </>
            ) : (
              <>
                {/* Returning User: Mic Button - Premium with glow */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMicPress();
                  }}
                  className={cn(
                    "w-full py-5 rounded-2xl",
                    "btn-primary-glow",
                    "flex items-center justify-center gap-3",
                    "text-lg font-medium"
                  )}
                  variants={premiumVariants.cardGlow}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  transition={transitions.mic}
                >
                  <Mic className="w-6 h-6" />
                  <span>Talk this through</span>
                </motion.button>

                {/* Hint text */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Or long-press anywhere to speak
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutiveControlSurface;
