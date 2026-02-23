import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { CheckCircle, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Mission {
  id: string;
  mission_text: string;
  start_date: string;
  completed_at: string;
  completion_notes: string | null;
}

export default function MissionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMissions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('leader_missions')
          .select('*')
          .eq('leader_id', user.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });

        if (error) throw error;

        setMissions(data as Mission[]);
      } catch (error) {
        console.error('Error loading mission history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMissions();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00D9B6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">Mission History</h1>
          </div>
          <p className="text-muted-foreground">
            {missions.length} mission{missions.length !== 1 ? 's' : ''} completed
          </p>
        </div>

        {/* Missions List */}
        {missions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Completed Missions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete your first mission to see it here
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => (
              <Card key={mission.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {mission.mission_text}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Started: {format(new Date(mission.start_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            Completed: {format(new Date(mission.completed_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                
                {mission.completion_notes && (
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Your Reflection:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {mission.completion_notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
