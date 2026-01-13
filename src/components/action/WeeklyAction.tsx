/**
 * WeeklyAction Component
 * 
 * Weekly action display - the one clear thing to do this week.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import { useNavigate } from 'react-router-dom';

export function WeeklyAction() {
  const navigate = useNavigate();
  const { weeklyAction } = useDashboard();

  if (!weeklyAction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week's Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No action this week</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-accent/5 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <Circle className="h-6 w-6 text-accent" />
          This Week's Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-base font-medium text-foreground mb-3 leading-relaxed">{weeklyAction.action_text}</p>
          {weeklyAction.why_text && (
            <p className="text-sm text-muted-foreground leading-relaxed">{weeklyAction.why_text}</p>
          )}
        </div>
        <Button
          onClick={() => navigate('/voice')}
          variant="outline"
          className="w-full h-12 text-base font-medium rounded-xl"
        >
          Record Progress
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
