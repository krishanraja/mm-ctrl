import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';
import { motion } from 'framer-motion';
import type { MissionStatus } from '@/types/missions';

const statusConfig: Record<
  MissionStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: 'Active',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: Target,
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: CheckCircle2,
  },
  skipped: {
    label: 'Skipped',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
    icon: XCircle,
  },
  extended: {
    label: 'Extended',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    icon: Clock,
  },
};

export default function MissionHistory() {
  const navigate = useNavigate();
  const { missions, loading } = useMissions();

  // Group missions by month
  const grouped = missions.reduce<Record<string, typeof missions>>((acc, mission) => {
    const date = new Date(mission.created_at || '');
    const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(mission);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <h1 className="text-xl font-semibold text-foreground">Mission History</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {missions.length} mission{missions.length !== 1 ? 's' : ''} total
      </p>

      {loading ? (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <Card className="border rounded-xl mt-4">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No missions yet. Complete your assessment to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 space-y-6">
          {Object.entries(grouped).map(([month, monthMissions]) => (
            <div key={month}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {month}
              </h3>
              <div className="space-y-3">
                {monthMissions.map((mission, idx) => {
                  const status = statusConfig[mission.status as MissionStatus] || statusConfig.active;
                  const StatusIcon = status.icon;
                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              <StatusIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-relaxed">
                                {mission.mission_text}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className={status.color} variant="outline">
                                  {status.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(mission.created_at || '').toLocaleDateString()}
                                </span>
                                {mission.completed_at && (
                                  <span className="text-xs text-muted-foreground">
                                    Completed{' '}
                                    {new Date(mission.completed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {mission.completion_notes && (
                                <p className="text-xs text-muted-foreground mt-2 bg-secondary/30 p-2 rounded-lg">
                                  {mission.completion_notes}
                                </p>
                              )}
                            </div>
                            {mission.status === 'active' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  navigate(
                                    `/mission-check-in?missionId=${mission.id}&action=complete`
                                  )
                                }
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
