/**
 * PriorityCardStack Component
 * 
 * Stack of priority cards (weekly action, tensions, etc.).
 */

import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriorityCard {
  id: string;
  type: 'action' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: string | null;
}

interface PriorityCardStackProps {
  cards: PriorityCard[];
  onCardTap: (card: PriorityCard) => void;
  onCardDismiss?: (cardId: string) => void;
}

export function PriorityCardStack({ cards, onCardTap, onCardDismiss }: PriorityCardStackProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <Card
          key={card.id}
          onClick={() => onCardTap(card)}
          className="p-6 cursor-pointer hover:bg-muted/30 transition-all duration-200 rounded-2xl relative"
        >
          {onCardDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onCardDismiss(card.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="pr-8">
            <h4 className="text-sm font-semibold text-foreground mb-1">{card.title}</h4>
            <p className="text-sm text-muted-foreground">{card.description}</p>
            {card.metadata && (
              <p className="text-xs text-muted-foreground mt-2 italic">{card.metadata}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
