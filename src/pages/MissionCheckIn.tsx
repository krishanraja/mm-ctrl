import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceInput } from '@/components/ui/voice-input';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowLeft,
  Target,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Mission } from '@/types/missions';

export default function MissionCheckIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const missionId = searchParams.get('missionId');
  const action = searchParams.get('action') || 'complete';

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  useEffect(() => {
    if (!missionId) {
      setLoading(false);
      return;
    }

    const fetchMission = async () => {
      try {
        const { data, error } = await supabase
          .from('leader_missions')
          .select('*')
          .eq('id', missionId)
          .single();

        if (error) throw error;
        setMission(data as Mission);
      } catch (err) {
        console.error('Failed to fetch mission:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMission();
  }, [missionId]);

  const handleComplete = async () => {
    if (!mission) return;
    setSubmitting(true);

    try {
      const combinedNotes = [notes, voiceTranscript].filter(Boolean).join('\n\n');
      const { error } = await supabase
        .from('leader_missions')
        .update({
          status: 'completed' as string,
          completion_notes: combinedNotes || null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', mission.id);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to complete mission:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtend = async () => {
    if (!mission) return;
    setSubmitting(true);

    try {
      const newDate = new Date(mission.check_in_date);
      newDate.setDate(newDate.getDate() + 7);
      const { error } = await supabase
        .from('leader_missions')
        .update({
          status: 'extended' as string,
          check_in_date: newDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', mission.id);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to extend mission:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNeedHelp = () => {
    const email = '';
    navigate(`/booking?source=mission-help&missionId=${missionId}&email=${email}`);
  };

  if (loading) {
    return (
      <div className="h-screen-safe bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="h-screen-safe overflow-hidden flex flex-col items-center justify-center bg-background px-4">
        <Card className="border rounded-xl">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Mission not found. It may have been completed or removed.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="h-screen-safe overflow-hidden flex flex-col items-center justify-center bg-background px-4">
        <Card className="border rounded-xl">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {action === 'extend' ? 'Mission Extended' : 'Mission Complete!'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {action === 'extend'
                ? 'We\'ll check in again next week.'
                : 'Great work. Your progress has been recorded.'}
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Mission Check-in</h1>
          <p className="text-xs text-muted-foreground">
            How did your mission go?
          </p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
        <div className="max-w-2xl mx-auto">

      {/* Mission card */}
      <Card className="border rounded-xl mt-4 border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-emerald-500/10 rounded-lg">
              <Target className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {mission.mission_text}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {mission.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Due {new Date(mission.check_in_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action-specific content */}
      {(action === 'complete' || action === 'help') && (
        <Card className="border rounded-xl mt-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                How did it go?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share what happened, what you learned, any obstacles..."
                className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <VoiceInput
                maxDuration={60}
                placeholder="Or record"
                onTranscript={(t) =>
                  setVoiceTranscript((prev) => (prev ? `${prev} ${t}` : t))
                }
              />
              {voiceTranscript && (
                <p className="text-xs text-muted-foreground flex-1 truncate">
                  {voiceTranscript}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleComplete}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark Complete
              </Button>
              <Button variant="outline" onClick={handleExtend} disabled={submitting}>
                <Clock className="h-4 w-4 mr-2" />
                Extend 1 Week
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {action === 'extend' && (
        <Card className="border rounded-xl mt-4">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-foreground mb-4">
              Need more time? We'll extend your check-in by 1 week.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleExtend} disabled={submitting}>
                {submitting ? 'Extending...' : 'Extend 1 Week'}
              </Button>
              <Button variant="outline" onClick={handleNeedHelp}>
                <MessageSquare className="h-4 w-4 mr-2" />
                I Need Help
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Need help CTA */}
      <Card className="border rounded-xl mt-4 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Stuck?</p>
              <p className="text-xs text-muted-foreground">
                Book a 15-minute strategy call
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleNeedHelp}>
              Book
            </Button>
          </div>
        </CardContent>
      </Card>

        </div>
      </main>
    </div>
  );
}
