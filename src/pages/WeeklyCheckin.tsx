import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoiceInput } from '@/components/ui/voice-input';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';

export default function WeeklyCheckin() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverInsight, setServerInsight] = useState<string | null>(null);
  const [serverAction, setServerAction] = useState<string | null>(null);
  const [serverWhy, setServerWhy] = useState<string | null>(null);

  const question = useMemo(() => {
    // MVP: deterministic weekly question. Next step: vary by baseline + recent history.
    return "What AI decision did you face this week?";
  }, []);

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    setIsSubmitting(true);
    setIsSubmitted(false);
    setServerInsight(null);
    setServerAction(null);
    setServerWhy(null);

    // Lightweight baseline context (optional) to improve specificity
    let baselineContext: any = null;
    try {
      const { assessmentId } = getPersistedAssessmentId();
      if (assessmentId) {
        const aggregated = await aggregateLeaderResults(assessmentId, false);
        baselineContext = {
          benchmarkTier: aggregated.benchmarkTier,
          benchmarkScore: aggregated.benchmarkScore,
          topTension: aggregated.tensions?.[0]?.summary_line ?? null,
          topRisk: aggregated.riskSignals?.[0]?.description ?? null,
        };
      }
    } catch {
      // ignore
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-weekly-checkin', {
        body: {
          transcript: transcript.trim(),
          asked_prompt_key: 'weekly_default',
          baseline_context: baselineContext,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setServerInsight(data?.insight ?? null);
      setServerAction(data?.action_text ?? null);
      setServerWhy(data?.why_text ?? null);
      setIsSubmitted(true);
    } catch (e) {
      console.error('Weekly check-in submit failed:', e);
      // Fallback: still mark captured; user can continue.
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/today')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <h1 className="text-xl font-semibold text-foreground">Weekly check-in</h1>
      <p className="text-sm text-muted-foreground mt-1">
        30 seconds max. One real decision, not theory.
      </p>

      <Card className="border rounded-xl mt-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{question}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Speak it. We’ll turn it into one insight + one action.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <VoiceInput
              maxDuration={30}
              placeholder="Record 30s"
              onTranscript={(t) => setTranscript((prev) => (prev ? `${prev} ${t}` : t))}
            />
            <Button
              variant="cta"
              disabled={!transcript.trim() || isSubmitting}
              onClick={handleSubmit}
              className="h-10"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>

          {transcript ? (
            <div className="mt-4 rounded-lg bg-secondary/30 p-3 text-sm text-foreground">
              {transcript}
            </div>
          ) : null}

          {isSubmitted ? (
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="text-sm font-medium text-foreground">Captured.</div>
              {serverInsight || serverAction ? (
                <div className="mt-2 space-y-2">
                  {serverInsight ? (
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">Insight: </span>
                      {serverInsight}
                    </p>
                  ) : null}
                  {serverAction ? (
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">This week: </span>
                      {serverAction}
                    </p>
                  ) : null}
                  {serverWhy ? (
                    <p className="text-sm text-muted-foreground">{serverWhy}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Saved. Your weekly action will appear on Today.
                </p>
              )}
              <div className="mt-3">
                <Button variant="outline" onClick={() => navigate('/today')}>
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

