/**
 * FactVerificationCard Component
 * Apple-style verification overlay for high-stakes facts
 * Shows 3-5 facts maximum, single-tap confirm or edit
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemoryPill } from './MemoryPill';
import type { PendingVerification } from '@/types/memory';

interface FactVerificationCardProps {
  facts: PendingVerification[];
  onVerify: (factId: string, newValue?: string) => Promise<boolean>;
  onReject: (factId: string) => Promise<boolean>;
  onDismiss: () => void;
  onComplete: () => void;
}

export const FactVerificationCard: React.FC<FactVerificationCardProps> = ({
  facts,
  onVerify,
  onReject,
  onDismiss,
  onComplete,
}) => {
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [remainingFacts, setRemainingFacts] = useState(facts);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerify = async (factId: string, newValue?: string) => {
    setIsProcessing(true);
    const success = await onVerify(factId, newValue);
    if (success) {
      setVerifiedCount(prev => prev + 1);
      setRemainingFacts(prev => prev.filter(f => f.id !== factId));
    }
    setIsProcessing(false);
    
    // Check if all facts are verified
    if (remainingFacts.length === 1) {
      setTimeout(onComplete, 300);
    }
    return success;
  };

  const handleReject = async (factId: string) => {
    setIsProcessing(true);
    const success = await onReject(factId);
    if (success) {
      setRemainingFacts(prev => prev.filter(f => f.id !== factId));
    }
    setIsProcessing(false);
    
    // Check if all facts are handled
    if (remainingFacts.length === 1) {
      setTimeout(onComplete, 300);
    }
    return success;
  };

  const handleSkipAll = () => {
    onDismiss();
  };

  const handleConfirmAll = async () => {
    setIsProcessing(true);
    for (const fact of remainingFacts) {
      await onVerify(fact.id);
    }
    setIsProcessing(false);
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleSkipAll}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative w-full max-w-md mx-4 mb-4 sm:mb-0',
          'bg-gradient-to-b from-gray-900/95 to-gray-950/95',
          'border border-white/10 rounded-3xl',
          'shadow-2xl backdrop-blur-xl',
          'overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Quick Verification
                </h3>
                <p className="text-sm text-white/50">
                  We heard {facts.length} key things about you
                </p>
              </div>
            </div>
            <button
              onClick={handleSkipAll}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(verifiedCount / facts.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
              />
            </div>
            <span className="text-xs text-white/40 tabular-nums">
              {verifiedCount}/{facts.length}
            </span>
          </div>
        </div>

        {/* Facts list */}
        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {remainingFacts.map((fact) => (
              <MemoryPill
                key={fact.id}
                fact={fact}
                onVerify={handleVerify}
                onReject={handleReject}
                isProcessing={isProcessing}
              />
            ))}
          </AnimatePresence>

          {/* All done state */}
          {remainingFacts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-medium">All verified!</p>
              <p className="text-white/50 text-sm">Your profile is now personalized</p>
            </motion.div>
          )}
        </div>

        {/* Footer actions */}
        {remainingFacts.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkipAll}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl',
                'bg-white/5 border border-white/10',
                'text-white/60 font-medium text-sm',
                'hover:bg-white/10 transition-colors'
              )}
            >
              Skip for now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirmAll}
              disabled={isProcessing}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl',
                'bg-gradient-to-r from-green-500 to-emerald-500',
                'text-white font-medium text-sm',
                'hover:from-green-400 hover:to-emerald-400 transition-colors',
                'flex items-center justify-center gap-2',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm All
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FactVerificationCard;
