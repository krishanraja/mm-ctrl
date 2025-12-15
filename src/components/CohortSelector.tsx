import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Globe } from 'lucide-react';
import { AILearningStyle, getLearningStyleProfile } from '@/utils/aiLearningStyle';
import { getCohortStats } from '@/utils/generateCohortPeers';

interface CohortSelectorProps {
  currentView: 'cohort' | 'all';
  learningStyle: AILearningStyle;
  onToggle: (view: 'cohort' | 'all') => void;
}

export const CohortSelector: React.FC<CohortSelectorProps> = ({
  currentView,
  learningStyle,
  onToggle
}) => {
  const profile = getLearningStyleProfile(learningStyle);
  const stats = getCohortStats(learningStyle);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Your Learning Style</h4>
            <Badge variant="secondary" className="text-xs">
              {profile.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {profile.description}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={currentView === 'cohort' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggle('cohort')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">My Cohort</span>
          <Badge variant="secondary" className="ml-1 bg-background/50">
            {stats.count}
          </Badge>
        </Button>
        <Button
          variant={currentView === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggle('all')}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">All Users</span>
        </Button>
      </div>
    </div>
  );
};
