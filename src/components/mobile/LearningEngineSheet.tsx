import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Mic } from 'lucide-react';
import { DailyProvocation } from '@/components/dashboard/DailyProvocation';

interface LearningEngineSheetProps {
  dailyPrompt: any;
  onNavigate: (path: string) => void;
}

export const LearningEngineSheet: React.FC<LearningEngineSheetProps> = ({
  dailyPrompt,
  onNavigate,
}) => {
  return (
    <div className="px-6 py-4">
      {dailyPrompt ? (
        <DailyProvocation
          prompt={dailyPrompt}
          onResponseSubmitted={() => {
            // Reload prompt
            window.location.reload();
          }}
        />
      ) : (
        <Card className="border rounded-2xl">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No daily provocation available. Check back tomorrow!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
