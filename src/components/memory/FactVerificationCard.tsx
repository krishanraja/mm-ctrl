/**
 * FactVerificationCard Component
 * Premium verification overlay for high-stakes facts
 * No scroll, swipe-to-dismiss on mobile
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Check, X, Pencil, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentFact = facts[currentIndex];
  const progress = ((currentIndex + 1) / facts.length) * 100;

  const handleVerify = async () => {
    if (!currentFact) return;
    setIsProcessing(true);
    await onVerify(currentFact.id);
    setIsProcessing(false);
    advanceOrComplete();
  };

  const handleReject = async () => {
    if (!currentFact) return;
    setIsProcessing(true);
    await onReject(currentFact.id);
    setIsProcessing(false);
    advanceOrComplete();
  };

  const handleSaveEdit = async () => {
    if (!currentFact || !editValue.trim()) return;
    setIsProcessing(true);
    await onVerify(currentFact.id, editValue.trim());
    setIsProcessing(false);
    setEditingId(null);
    setEditValue('');
    advanceOrComplete();
  };

  const advanceOrComplete = () => {
    if (currentIndex < facts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const startEdit = () => {
    if (!currentFact) return;
    setEditingId(currentFact.id);
    setEditValue(currentFact.fact_value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Swipe down to dismiss
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onDismiss();
    }
  };

  if (!currentFact) return null;

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
        onClick={onDismiss}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-md mx-4 mb-0 sm:mb-4",
          "bg-card border border-border",
          "rounded-t-3xl sm:rounded-3xl",
          "shadow-2xl overflow-hidden"
        )}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-muted mx-6 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent rounded-full"
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} of {facts.length}
            </p>
            <button
              onClick={onDismiss}
              className="p-1 rounded-full hover:bg-secondary transition-colors sm:hidden"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <h3 className="text-sm font-medium text-foreground mt-1">
            Quick verification
          </h3>
        </div>

        {/* Fact Display */}
        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            {editingId === currentFact.id ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    {currentFact.fact_label}
                  </label>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className={cn(
                      "w-full px-4 py-3 rounded-xl",
                      "bg-secondary/50 border border-border",
                      "text-foreground text-base",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={cancelEdit}
                    className={cn(
                      "flex-1 py-3 rounded-xl",
                      "bg-secondary/50 text-muted-foreground text-sm font-medium",
                      "hover:bg-secondary transition-colors"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editValue.trim() || isProcessing}
                    className={cn(
                      "flex-1 py-3 rounded-xl",
                      "bg-accent text-accent-foreground text-sm font-medium",
                      "hover:bg-accent/90 transition-colors",
                      "flex items-center justify-center gap-2",
                      (!editValue.trim() || isProcessing) && "opacity-50"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {currentFact.fact_label}
                </p>
                <p className="text-xl font-medium text-foreground mb-2">
                  {currentFact.fact_value}
                </p>
                {currentFact.fact_context && (
                  <p className="text-xs text-muted-foreground/60 italic line-clamp-2">
                    "{currentFact.fact_context}"
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        {editingId !== currentFact.id && (
          <div className="px-6 pb-6 pt-2">
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                disabled={isProcessing}
                className={cn(
                  "flex-1 py-3.5 rounded-xl",
                  "bg-accent text-accent-foreground",
                  "text-sm font-medium",
                  "flex items-center justify-center gap-2",
                  "hover:bg-accent/90 transition-colors",
                  isProcessing && "opacity-50"
                )}
              >
                <Check className="w-4 h-4" />
                Correct
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={startEdit}
                disabled={isProcessing}
                className={cn(
                  "py-3.5 px-4 rounded-xl",
                  "bg-secondary/50 border border-border",
                  "text-muted-foreground text-sm font-medium",
                  "hover:bg-secondary transition-colors"
                )}
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleReject}
                disabled={isProcessing}
                className={cn(
                  "py-3.5 px-4 rounded-xl",
                  "bg-destructive/10 border border-destructive/20",
                  "text-destructive/70 text-sm font-medium",
                  "hover:bg-destructive/20 transition-colors"
                )}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Skip option */}
            <button
              onClick={onDismiss}
              className="w-full mt-4 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Safe area padding for mobile */}
        <div className="h-safe pb-safe sm:hidden" />
      </motion.div>
    </motion.div>
  );
};

export default FactVerificationCard;
