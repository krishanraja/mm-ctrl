import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface ActionQueueSheetProps {
  weeklyAction: any;
  onNavigate: (path: string) => void;
}

export const ActionQueueSheet: React.FC<ActionQueueSheetProps> = ({
  weeklyAction,
  onNavigate,
}) => {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [snoozedActions, setSnoozedActions] = useState<Set<string>>(new Set());

  const actions = [
    weeklyAction && {
      id: 'weekly-action',
      title: "This Week's Focus",
      description: weeklyAction.action_text,
      why: weeklyAction.why_text,
      time: '15 min',
      priority: 'high',
    },
    {
      id: 'voice-decision',
      title: 'Talk through a decision',
      description: '60 seconds → 3 sharp questions',
      time: '2 min',
      priority: 'medium',
      onClick: () => {
        // Voice capture is handled by parent
        onNavigate('voice-capture');
      },
    },
    {
      id: 'weekly-checkin',
      title: 'Weekly check-in',
      description: '30 seconds → one insight',
      time: '1 min',
      priority: 'medium',
      onClick: () => onNavigate('/checkin'),
    },
    {
      id: 'view-baseline',
      title: 'Review your baseline',
      description: 'Scores, tensions, and prompts',
      time: '5 min',
      priority: 'low',
      onClick: () => onNavigate('/baseline'),
    },
  ].filter(Boolean).filter(action => !completedActions.has(action.id) && !snoozedActions.has(action.id));

  const handleSwipeComplete = (actionId: string, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (info.offset.x > threshold || velocity > 500) {
      // Swipe right - complete
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      setCompletedActions(prev => new Set([...prev, actionId]));
    } else if (info.offset.x < -threshold || velocity < -500) {
      // Swipe left - snooze
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
      setSnoozedActions(prev => new Set([...prev, actionId]));
    }
  };

  const completedCount = completedActions.size;
  const totalActions = actions.length + completedCount;

  return (
    <div className="px-6 py-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">This Week</h3>
        <Badge variant="outline" className="text-xs">
          {actions.length} actions
        </Badge>
      </div>

      <AnimatePresence>
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => handleSwipeComplete(action.id, info)}
            whileTap={{ scale: 0.98 }}
          >
          <Card
            className={`border rounded-2xl cursor-pointer transition-all hover:border-primary/50 ${
              action.priority === 'high'
                ? 'border-primary/30 bg-primary/5'
                : 'border-muted'
            }`}
            onClick={action.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      action.priority === 'high'
                        ? 'bg-primary/10'
                        : action.priority === 'medium'
                        ? 'bg-amber-500/10'
                        : 'bg-muted'
                    }`}
                  >
                    {action.priority === 'high' ? (
                      <Target className="h-5 w-5 text-primary" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{action.title}</h4>
                      {action.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Priority
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {action.description}
                    </p>
                    {action.why && (
                      <p className="text-xs text-muted-foreground mb-2">{action.why}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{action.time}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Quick Wins Tracker */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Quick Wins
        </h3>
        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground font-medium">
                {completedCount} of {totalActions} completed
              </p>
              <Badge variant="outline" className="text-xs">
                {totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0}%
              </Badge>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-600"
                initial={{ width: 0 }}
                animate={{ width: `${totalActions > 0 ? (completedCount / totalActions) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Swipe right on actions to complete them
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
