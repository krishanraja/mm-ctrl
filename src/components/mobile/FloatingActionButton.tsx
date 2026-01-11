import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, X } from 'lucide-react';
import { premiumVariants } from '@/lib/motion';
import { useLongPress } from '@/hooks/useLongPress';

interface FloatingActionButtonProps {
  onVoiceClick: () => void;
  onQuickActionClick?: (action: string) => void;
  isListening?: boolean;
  isProcessing?: boolean;
}

const quickActions = [
  { id: 'status', label: 'My Status' },
  { id: 'actions', label: 'Action Queue' },
  { id: 'intelligence', label: 'Competitive Intel' },
  { id: 'prep', label: 'Decision Prep' },
];

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onVoiceClick,
  onQuickActionClick,
  isListening = false,
  isProcessing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const longPress = useLongPress({
    onLongPress: () => {
      setIsExpanded(true);
    },
    onClick: () => {
      if (!isExpanded) {
        onVoiceClick();
      }
    },
  });

  const handleQuickAction = (actionId: string) => {
    onQuickActionClick?.(actionId);
    setIsExpanded(false);
  };

  return (
    <div className="fixed right-6 z-30" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 flex flex-col gap-2 mb-2"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickAction(action.id)}
                  className="shadow-lg"
                >
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        variants={premiumVariants.micOrbPulse}
        initial="idle"
        animate={isListening ? 'recording' : isExpanded ? 'hover' : 'idle'}
        whileHover="hover"
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl relative touch-none"
          onClick={() => {
            if (isExpanded) {
              setIsExpanded(false);
            }
          }}
          {...longPress}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="h-6 w-6 animate-spin" />
              </motion.div>
            ) : isExpanded ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                <Mic className="h-6 w-6" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Mic className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
};
