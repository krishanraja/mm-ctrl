import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface Mission {
  id: string;
  leader_id: string;
  mission_text: string;
  start_date: string;
  check_in_date: string;
  status: string;
}

export default function MissionCheckIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const missionId = searchParams.get('mission');
  const action = searchParams.get('action');
  
  const [mission, setMission] = useState<Mission | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadMission = async () => {
      if (!missionId) {
        setError('Mission ID not provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('leader_missions')
          .select('*')
          .eq('id', missionId)
          .single();

        if (fetchError) throw fetchError;

        setMission(data as Mission);
        
        // Auto-extend if action is 'extend'
        if (action === 'extend' && data) {
          await handleExtend(data as Mission);
        }
      } catch (err) {
        console.error('Failed to load mission:', err);
        setError('Mission not found or you don\'t have access');
      } finally {
        setIsLoading(false);
      }
    };

    loadMission();
  }, [missionId, action]);

  const handleComplete = async () => {
    if (!mission) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('leader_missions')
        .update({
          status: 'completed',
          completion_notes: notes.trim() || null,
          completed_at: new Date().toISOString()
        })
        .eq('id', mission.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard?mission_completed=true');
      }, 2000);

    } catch (err) {
      console.error('Failed to complete mission:', err);
      setError('Failed to save. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleExtend = async (missionData: Mission = mission!) => {
    if (!missionData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newCheckInDate = new Date();
      newCheckInDate.setDate(newCheckInDate.getDate() + 7);

      const { error: updateError } = await supabase
        .from('leader_missions')
        .update({
          check_in_date: newCheckInDate.toISOString(),
          check_in_email_sent: false // Reset so we send another email
        })
        .eq('id', missionData.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Show success message for extend
      setTimeout(() => {
        navigate('/dashboard?mission_extended=true');
      }, 2000);

    } catch (err) {
      console.error('Failed to extend mission:', err);
      setError('Failed to extend. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00D9B6]"></div>
      </div>
    );
  }

  if (error && !mission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Mission Not Found</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>
                {action === 'extend' ? 'Check-In Extended!' : 'Mission Complete!'}
              </CardTitle>
            </div>
            <CardDescription>
              {action === 'extend' 
                ? 'We\'ll check in with you again in 1 week. You got this!'
                : 'Great work! Redirecting to your dashboard...'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Auto-extend already handled in useEffect
  if (action === 'extend') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-6 w-6 text-blue-500" />
              <CardTitle>Processing...</CardTitle>
            </div>
            <CardDescription>Extending your check-in by 1 week...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <img 
            src="/mindmaker-favicon.png" 
            alt="Mindmaker" 
            className="h-8 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Mission Check-In</h1>
          <p className="text-muted-foreground">How did your first move go?</p>
        </div>

        {/* Mission Card */}
        <Card className="mb-6 border-2 border-[#00D9B6]/30 bg-[#00D9B6]/5">
          <CardHeader>
            <CardTitle className="text-lg">Your Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground font-medium">{mission?.mission_text}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Started: {mission ? new Date(mission.start_date).toLocaleDateString() : ''}
            </p>
          </CardContent>
        </Card>

        {/* Completion Form */}
        <Card>
          <CardHeader>
            <CardTitle>Share Your Experience</CardTitle>
            <CardDescription>
              What happened? What did you learn? (Optional but helpful for tracking progress)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="notes">Reflection</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., 'Had 3 conversations with my team about AI use cases. Found shadow AI in marketing. Need to create governance framework...'"
                rows={6}
                className="resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 bg-[#00D9B6] hover:bg-[#00D9B6]/90 text-black font-medium"
              >
                {isSubmitting ? 'Saving...' : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExtend()}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Clock className="mr-2 h-4 w-4" />
                Need More Time (Extend 1 Week)
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <Button
                variant="link"
                onClick={() => navigate('/booking?source=mission-help')}
                className="text-muted-foreground hover:text-foreground"
              >
                Need help? Book a 1:1 sprint
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
