/**
 * VerificationBanner Component
 * Nudge banner encouraging users to verify their inferred memories.
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

function MiniProgressRing({ rate }: { rate: number }) {
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-emerald-500/20"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="text-emerald-500"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      />
    </svg>
  );
}

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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptics.light();
          onStartVerification();
        }}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl',
          'bg-emerald-500/5 border border-emerald-500/20',
          'text-left transition-colors hover:bg-emerald-500/10',
          'mb-3',
        )}
      >
        <MiniProgressRing rate={verifiedRate} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {unverifiedCount} {unverifiedCount === 1 ? 'memory' : 'memories'} to verify
          </p>
          <p className="text-xs text-muted-foreground">
            Tap to review and confirm
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      </motion.button>
    </AnimatePresence>
  );
};

export default VerificationBanner;
