import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoiceInput } from '@/components/ui/voice-input';
import { ArrowLeft, Mic, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';

export default function DecisionCapture() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState('');
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [watchout, setWatchout] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setIsGenerating(true);
    setQuestions(null);
    setNextStep(null);
    setWatchout(null);

    // Lightweight baseline context (optional)
    let context: any = null;
    try {
      const { assessmentId } = getPersistedAssessmentId();
      if (assessmentId) {
        const aggregated = await aggregateLeaderResults(assessmentId, false);
        context = {
          benchmarkTier: aggregated.benchmarkTier,
          benchmarkScore: aggregated.benchmarkScore,
          topTension: aggregated.tensions?.[0]?.summary_line ?? null,
          topGap: aggregated.dimensionScores?.find((d: any) => (d.score_numeric ?? 100) < 60)?.dimension_key ?? null,
        };
      }
    } catch {
      // ignore
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-decision-capture', {
        body: {
          transcript: transcript.trim(),
          context,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const three = Array.isArray(data?.three_questions) ? data.three_questions : null;
      setQuestions(three && three.length ? three.slice(0, 3) : [
        'What would have to be true for this to be a good decision in 90 days?',
        'What is the strongest argument against approving this right now?',
        'What is the one question that would expose vendor theatre vs real capability?',
      ]);
      setNextStep(typeof data?.next_step === 'string' ? data.next_step : null);
      setWatchout(typeof data?.watchout === 'string' ? data.watchout : null);
    } catch (e) {
      console.error('Decision capture failed:', e);
      // Deterministic fallback
      setQuestions([
        'What would have to be true for this to be a good decision in 90 days?',
        'What is the strongest argument against approving this right now?',
        'What is the one question that would expose vendor theatre vs real capability?',
      ]);
      setNextStep('Ask these before you commit money, headcount, or reputation.');
      setWatchout('Watch for confident claims without evaluation criteria or ownership.');
    } finally {
      setIsGenerating(false);
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

      <h1 className="text-xl font-semibold text-foreground">Capture a decision</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Speak the situation in under 60 seconds. Get 3 sharp questions.
      </p>

      <Card className="border rounded-xl mt-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2">
              <Mic className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                What’s the decision and what’s making you unsure?
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Example: “I’m about to approve a $200K AI vendor proposal and I’m not sure what to ask.”
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <VoiceInput
              maxDuration={60}
              placeholder="Record 60s"
              onTranscript={(t) => setTranscript((prev) => (prev ? `${prev} ${t}` : t))}
            />
            <Button
              variant="cta"
              disabled={!transcript.trim() || isGenerating}
              onClick={handleGenerate}
              className="h-10"
            >
              {isGenerating ? 'Thinking…' : 'Get questions'}
            </Button>
          </div>

          {transcript ? (
            <div className="mt-4 rounded-lg bg-secondary/30 p-3 text-sm text-foreground">
              {transcript}
            </div>
          ) : null}

          {questions ? (
            <div className="mt-4 rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                Three questions to ask
              </div>
              <ol className="mt-3 space-y-2 text-sm text-foreground list-decimal list-inside">
                {questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ol>
              {nextStep ? (
                <p className="mt-3 text-sm text-foreground">
                  <span className="text-muted-foreground">Next step: </span>
                  {nextStep}
                </p>
              ) : null}
              {watchout ? (
                <p className="mt-2 text-sm text-muted-foreground">{watchout}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => navigate('/timeline')}>
                  Save & view timeline
                </Button>
                <Button variant="ghost" onClick={() => setQuestions(null)}>
                  Capture another
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

