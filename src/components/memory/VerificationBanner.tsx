/**
 * VerificationBanner Component
 * Compact pill nudging users to verify their inferred memories.
 * Appears above the memory list tabs when unverified memories exist.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

interface VerificationBannerProps {
  unverifiedCount: number;
  verifiedRate: number;
  onStartVerification: () => void;
}

const DISMISS_KEY = 'verification-banner-dismissed-at';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const VerificationBanner: React.FC<VerificationBannerProps> = ({
  unverifiedCount,
  verifiedRate,
  onStartVerification,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_KEY);
      }
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsDismissed(true);
  };

  if (isDismissed || unverifiedCount === 0 || verifiedRate >= 100) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, height: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptics.light();
          onStartVerification();
        }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-xl',
          'bg-emerald-500/5 border border-emerald-500/20',
          'text-left transition-colors hover:bg-emerald-500/10',
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />

        <p className="flex-1 min-w-0 text-xs font-medium text-foreground">
          {unverifiedCount} {unverifiedCount === 1 ? 'memory' : 'memories'} to verify
        </p>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-secondary/50 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
      </motion.button>
    </AnimatePresence>
  );
};

export default VerificationBanner;
