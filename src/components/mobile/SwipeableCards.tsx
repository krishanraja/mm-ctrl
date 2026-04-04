/**
 * SwipeableCards
 *
 * Horizontal swipeable card carousel for no-scroll mobile layouts.
 * Uses framer-motion drag gestures with dot indicators.
 */

import { useState, useCallback, Children, type ReactNode } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwipeableCardsProps {
  children: ReactNode;
  className?: string;
  cardClassName?: string;
  showDots?: boolean;
  dotClassName?: string;
  onPageChange?: (index: number) => void;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 500;

export function SwipeableCards({
  children,
  className,
  cardClassName,
  showDots = true,
  dotClassName,
  onPageChange,
}: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const pages = Children.toArray(children);
  const totalPages = pages.length;

  const paginate = useCallback(
    (newDirection: number) => {
      const newIndex = currentIndex + newDirection;
      if (newIndex < 0 || newIndex >= totalPages) return;
      setDirection(newDirection);
      setCurrentIndex(newIndex);
      onPageChange?.(newIndex);
    },
    [currentIndex, totalPages, onPageChange],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
        paginate(1);
      } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
        paginate(-1);
      }
    },
    [paginate],
  );

  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className={cn('relative flex-1 overflow-hidden', cardClassName)}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            {pages[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {showDots && totalPages > 1 && (
        <div className={cn('flex items-center justify-center gap-1.5 py-2', dotClassName)}>
          {pages.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1} of ${totalPages}`}
              aria-current={idx === currentIndex ? 'step' : undefined}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
                onPageChange?.(idx);
              }}
              className={cn(
                'rounded-full transition-all duration-300',
                idx === currentIndex
                  ? 'w-5 h-1.5 bg-accent'
                  : 'w-1.5 h-1.5 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
