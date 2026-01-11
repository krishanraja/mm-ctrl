import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface PriorityCard {
  id: string;
  type: 'alert' | 'action' | 'insight';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: string;
}

interface PriorityCardStackProps {
  cards: PriorityCard[];
  onCardTap?: (card: PriorityCard) => void;
  onCardDismiss?: (cardId: string) => void;
  onCardSnooze?: (cardId: string) => void;
}

const getCardIcon = (type: string) => {
  switch (type) {
    case 'alert':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'action':
      return <Clock className="h-5 w-5 text-primary" />;
    case 'insight':
      return <TrendingUp className="h-5 w-5 text-emerald-600" />;
    default:
      return null;
  }
};

const getCardColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-red-500/30 bg-red-500/5';
    case 'medium':
      return 'border-amber-500/30 bg-amber-500/5';
    case 'low':
      return 'border-blue-500/30 bg-blue-500/5';
    default:
      return 'border-muted';
  }
};

export const PriorityCardStack: React.FC<PriorityCardStackProps> = ({
  cards,
  onCardTap,
  onCardDismiss,
  onCardSnooze,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    // Haptic feedback
    const vibrate = (pattern: number | number[]) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    };

    // Swipe right (dismiss)
    if (info.offset.x > threshold || velocity > 500) {
      vibrate(20);
      onCardDismiss?.(currentCard.id);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setDirection(1);
    }
    // Swipe left (snooze)
    else if (info.offset.x < -threshold || velocity < -500) {
      vibrate([10, 50, 10]);
      onCardSnooze?.(currentCard.id);
      setDirection(-1);
    }
  };

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
      zIndex: 0,
    }),
  };

  return (
    <div className="relative h-40 sm:h-48 w-full">
      <AnimatePresence mode="wait" custom={direction}>
        {/* Current Card */}
        <motion.div
          key={currentCard.id}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.02, zIndex: 10 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
          className="absolute inset-0 touch-none"
        >
          <Card
            className={`border rounded-2xl cursor-pointer transition-all ${getCardColor(currentCard.priority)} active:scale-[0.98]`}
            onClick={() => onCardTap?.(currentCard)}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3 mb-3">
                {getCardIcon(currentCard.type)}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {currentCard.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                    {currentCard.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
              {currentCard.metadata && (
                <p className="text-xs text-muted-foreground">
                  {currentCard.metadata}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Card (Peek) */}
        {nextCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 0.3, scale: 0.95, y: 5 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <Card className={`border rounded-2xl ${getCardColor(nextCard.priority)}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {getCardIcon(nextCard.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {nextCard.title}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Indicator */}
      {cards.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
