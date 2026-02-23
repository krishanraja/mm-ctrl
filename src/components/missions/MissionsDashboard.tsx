import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Target, CheckCircle, Clock, Rocket, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Mission {
  id: string;
  mission_text: string;
  start_date: string;
  check_in_date: string;
  status: string;
  completed_at: string | null;
}

interface MissionsDashboardProps {
  leaderId: string;
}

type MomentumStatus = 'accelerating' | 'steady' | 'slowing' | 'new';

export function MissionsDashboard({ leaderId }: MissionsDashboardProps) {
  const navigate = useNavigate();
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [momentum, setMomentum] = useState<MomentumStatus>('new');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMissions = async () => {
      try {
        // Get active mission
        const { data: active } = await supabase
          .from('leader_missions')
          .select('*')
          .eq('leader_id', leaderId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get completed count
        const { count } = await supabase
          .from('leader_missions')
          .select('id', { count: 'exact', head: true })
          .eq('leader_id', leaderId)
          .eq('status', 'completed');

        // Get all missions for momentum calculation
        const { data: allMissions } = await supabase
          .from('leader_missions')
          .select('*')
          .eq('leader_id', leaderId)
          .order('created_at', { ascending: false });

        setActiveMission(active);
        setCompletedCount(count || 0);
        
        // Calculate momentum
        if (allMissions && allMissions.length > 0) {
          const calculated = calculateMomentum(allMissions as Mission[]);
          setMomentum(calculated);
        }
      } catch (error) {
        console.error('Error loading missions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (leaderId) {
      loadMissions();
    }
  }, [leaderId]);

  const calculateMomentum = (missions: Mission[]): MomentumStatus => {
    if (missions.length === 0) return 'new';
    if (missions.length === 1) return 'new';

    const completed = missions.filter(m => m.status === 'completed');
    const overdue = missions.filter(m => 
      m.status === 'active' && new Date(m.check_in_date) < new Date()
    );

    // Overdue mission = slowing
    if (overdue.length > 0) return 'slowing';

    // Calculate completion rate
    const totalMissions = missions.length;
    const completionRate = completed.length / totalMissions;

    // Check time-to-completion for recent completed missions
    const recentCompleted = completed.slice(0, 3);
    if (recentCompleted.length > 0) {
      const onTimeCount = recentCompleted.filter(m => {
        const startDate = new Date(m.start_date);
        const completedDate = new Date(m.completed_at!);
        const checkInDate = new Date(m.check_in_date);
        
        return completedDate <= checkInDate;
      }).length;

      const onTimeRate = onTimeCount / recentCompleted.length;

      if (onTimeRate > 0.8) return 'accelerating';
      if (onTimeRate > 0.5) return 'steady';
    }

    // Fallback based on completion rate
    if (completionRate > 0.7) return 'accelerating';
    if (completionRate > 0.4) return 'steady';
    return 'slowing';
  };

  const getMomentumConfig = (status: MomentumStatus) => {
    const configs = {
      accelerating: {
        icon: Rocket,
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        message: "You're on fire! Your momentum is accelerating.",
        description: "Keep up this pace and you'll see compound results."
      },
      steady: {
        icon: Target,
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        message: "Steady progress. You're building the habit.",
        description: "Consistency beats intensity. Keep going."
      },
      slowing: {
        icon: Clock,
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-200',
        message: "Your momentum slowed. Let's get you back on track.",
        description: "No judgment - just a nudge to refocus."
      },
      new: {
        icon: TrendingUp,
        color: 'text-purple-600',
        bg: 'bg-purple-50 border-purple-200',
        message: "Your AI leadership journey starts here.",
        description: "One action at a time compounds into transformation."
      }
    };

    return configs[status];
  };

  const config = getMomentumConfig(momentum);
  const Icon = config.icon;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00D9B6]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Momentum Card */}
      <Card className={cn("border-2", config.bg)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-lg bg-white", config.color)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{config.message}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Mission Card */}
      {activeMission ? (
        <Card className="border-2 border-[#00D9B6]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Mission</CardTitle>
              <Badge className="bg-[#00D9B6] text-black">In Progress</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground font-medium">{activeMission.mission_text}</p>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Check-in {formatDistanceToNow(new Date(activeMission.check_in_date), { addSuffix: true })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => navigate(`/mission-check-in?mission=${activeMission.id}&action=completed`)}
                className="flex-1 bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Mission
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate(`/mission-check-in?mission=${activeMission.id}`)}
                className="flex-1"
              >
                Update Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Active Mission</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ready to take your next step in AI leadership?
            </p>
            <Button 
              onClick={() => navigate('/diagnostic')}
              className="bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black"
            >
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Missions Stats */}
      {completedCount > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">
                    {completedCount} Mission{completedCount !== 1 ? 's' : ''} Completed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep building momentum
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/missions/history')}
              >
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
