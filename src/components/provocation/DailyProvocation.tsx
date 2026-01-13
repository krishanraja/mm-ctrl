/**
 * DailyProvocation Component
 * 
 * Daily provocation - one question per day, habit-forming.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Mic, ArrowRight } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import { useNavigate } from 'react-router-dom';

export function DailyProvocation() {
  const navigate = useNavigate();
  const { dailyPrompt } = useDashboard();

  if (!dailyPrompt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Provocation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No question today</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <Brain className="h-6 w-6 text-accent" />
          Daily Provocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-base text-foreground leading-relaxed">{dailyPrompt.question}</p>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/voice')}
            variant="outline"
            className="flex-1 h-12 text-base font-medium rounded-xl"
          >
            <Mic className="mr-2 h-5 w-5" />
            Voice
          </Button>
          <Button
            onClick={() => navigate('/voice')}
            variant="outline"
            className="flex-1 h-12 text-base font-medium rounded-xl"
          >
            Text
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
