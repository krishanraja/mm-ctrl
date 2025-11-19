import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TeamsCrossSellCardProps {
  companyName?: string;
}

export const TeamsCrossSellCard = React.memo<TeamsCrossSellCardProps>(({ 
  companyName 
}) => {
  const handleExploreTeams = () => {
    window.open('https://teams.themindmaker.ai', '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <Badge variant="default" className="mb-2">Team Solution</Badge>
              <CardTitle className="text-xl">Ready to Scale Beyond Individual Leadership?</CardTitle>
              <CardDescription className="mt-2">
                MindMaker Teams helps organizations deploy AI at scale with guided workshops, team assessments, and implementation tracking
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Executive AI Bootcamps</h4>
              <p className="text-sm text-muted-foreground">Hands-on workshops for leadership teams to align AI strategy and build momentum</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Team-Wide Assessments</h4>
              <p className="text-sm text-muted-foreground">Benchmark your entire organization's AI readiness and track progress over time</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Implementation Sprints</h4>
              <p className="text-sm text-muted-foreground">Guided 90-day sprints to identify bottlenecks, pilot solutions, and measure ROI</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Adoption Tracking Dashboard</h4>
              <p className="text-sm text-muted-foreground">Real-time visibility into team momentum, engagement patterns, and skill development</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleExploreTeams}
            className="w-full gap-2"
            size="lg"
          >
            Explore MindMaker Teams
            <ArrowRight className="h-4 w-4" />
          </Button>
          {companyName && (
            <p className="text-xs text-center text-muted-foreground mt-3">
              Perfect for organizations like {companyName} scaling AI adoption
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TeamsCrossSellCard.displayName = 'TeamsCrossSellCard';
