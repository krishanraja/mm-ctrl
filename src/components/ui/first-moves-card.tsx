import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Lock } from 'lucide-react';

interface Move {
  moveNumber: number;
  content: string;
}

interface FirstMovesCardProps {
  moves: Move[];
  showAll?: boolean;
}

export const FirstMovesCard = React.memo<FirstMovesCardProps>(({ 
  moves, 
  showAll = false,
}) => {
  const displayMoves = showAll ? moves : moves.slice(0, 1);
  const lockedMoves = showAll ? [] : moves.slice(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Your First 3 Moves</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayMoves.map((move) => (
          <div key={move.moveNumber} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {move.moveNumber}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                {move.content}
              </p>
            </div>
          </div>
        ))}

        {lockedMoves.length > 0 && (
          <div className="space-y-4 mt-4">
            {lockedMoves.map((move) => (
              <div key={move.moveNumber} className="relative">
                <div className="flex gap-4 blur-sm select-none">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                      {move.moveNumber}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {move.content.substring(0, 50)}...
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Unlock Move {move.moveNumber}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showAll && lockedMoves.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Unlock your complete 3-move action plan with the Full Leadership Diagnostic
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FirstMovesCard.displayName = 'FirstMovesCard';
