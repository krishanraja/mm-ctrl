/**
 * MemoryPill Component
 * Individual fact display with verify/edit/reject actions
 * Apple-style minimal design with haptic feedback
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Pencil, User, Building, Target, AlertTriangle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PendingVerification, FactCategory } from '@/types/memory';

interface MemoryPillProps {
  fact: PendingVerification;
  onVerify: (factId: string, newValue?: string) => Promise<boolean>;
  onReject: (factId: string) => Promise<boolean>;
  isProcessing?: boolean;
}

const CATEGORY_ICONS: Record<FactCategory, React.ElementType> = {
  identity: User,
  business: Building,
  objective: Target,
  blocker: AlertTriangle,
  preference: Settings,
};

const CATEGORY_COLORS: Record<FactCategory, string> = {
  identity: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  business: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  objective: 'from-green-500/20 to-green-600/10 border-green-500/30',
  blocker: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  preference: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
};

export const MemoryPill: React.FC<MemoryPillProps> = ({
  fact,
  onVerify,
  onReject,
  isProcessing = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(fact.fact_value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const Icon = CATEGORY_ICONS[fact.fact_category];
  const colorClass = CATEGORY_COLORS[fact.fact_category];

  const handleVerify = async () => {
    setIsSubmitting(true);
    await onVerify(fact.id);
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    await onReject(fact.id);
    setIsSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (editValue.trim() === fact.fact_value) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    await onVerify(fact.id, editValue.trim());
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(fact.fact_value);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'relative rounded-2xl border bg-gradient-to-br p-4',
        'backdrop-blur-sm shadow-lg',
        colorClass,
        isSubmitting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-white/10">
          <Icon className="w-4 h-4 text-foreground/70" />
        </div>
        <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
          {fact.fact_label}
        </span>
      </div>

      {/* Value display or edit input */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-xl',
                'bg-white/10 border border-white/20',
                'text-foreground placeholder:text-foreground/40',
                'focus:outline-none focus:ring-2 focus:ring-white/30',
                'text-base font-medium'
              )}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEdit}
                className={cn(
                  'flex-1 py-2 px-4 rounded-xl',
                  'bg-green-500/20 border border-green-500/30',
                  'text-green-400 font-medium text-sm',
                  'flex items-center justify-center gap-2'
                )}
              >
                <Check className="w-4 h-4" />
                Save
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelEdit}
                className={cn(
                  'py-2 px-4 rounded-xl',
                  'bg-white/10 border border-white/20',
                  'text-foreground/60 font-medium text-sm'
                )}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-lg font-semibold text-foreground mb-3 leading-tight">
              {fact.fact_value}
            </p>

            {/* Context quote if available */}
            {fact.fact_context && (
              <p className="text-xs text-foreground/40 italic mb-3 line-clamp-2">
                "{fact.fact_context}"
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                disabled={isProcessing}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl',
                  'bg-green-500/20 border border-green-500/30',
                  'text-green-400 font-medium text-sm',
                  'flex items-center justify-center gap-2',
                  'hover:bg-green-500/30 transition-colors'
                )}
              >
                <Check className="w-4 h-4" />
                Correct
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                disabled={isProcessing}
                className={cn(
                  'py-2.5 px-4 rounded-xl',
                  'bg-white/10 border border-white/20',
                  'text-foreground/70 font-medium text-sm',
                  'flex items-center justify-center gap-2',
                  'hover:bg-white/20 transition-colors'
                )}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReject}
                disabled={isProcessing}
                className={cn(
                  'py-2.5 px-3 rounded-xl',
                  'bg-red-500/10 border border-red-500/20',
                  'text-red-400/70',
                  'flex items-center justify-center',
                  'hover:bg-red-500/20 transition-colors'
                )}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence indicator */}
      <div className="absolute top-3 right-3">
        <div 
          className={cn(
            'w-2 h-2 rounded-full',
            fact.confidence_score >= 0.8 ? 'bg-green-400' :
            fact.confidence_score >= 0.6 ? 'bg-yellow-400' : 'bg-orange-400'
          )}
          title={`${Math.round(fact.confidence_score * 100)}% confidence`}
        />
      </div>
    </motion.div>
  );
};
