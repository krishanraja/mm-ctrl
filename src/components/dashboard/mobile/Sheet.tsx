/**
 * Sheet Component
 * 
 * Bottom sheet for mobile - native feel with gestures.
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  height?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title, height = 'medium', children }: SheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      haptics.light();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const heightClasses = {
    small: 'h-[40dvh]',
    medium: 'h-[60dvh]',
    large: 'h-[85dvh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 400, mass: 0.8 }}
            className={`fixed bottom-0 left-0 right-0 z-50 ${heightClasses[height]} bg-background rounded-t-2xl border-t border-border shadow-2xl flex flex-col`}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overscroll-contain px-4 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
