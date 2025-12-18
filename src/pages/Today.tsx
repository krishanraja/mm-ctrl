import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, ArrowRight, Sparkles, AlertTriangle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';
import { supabase } from '@/integrations/supabase/client';

interface DriftStatus {
  status: 'ok' | 'drifting' | 'stale';
  message: string;
}

interface PeerSnippet {
  snippet_text: string;
  source_type: string;
}

export default function Today() {
  const navigate = useNavigate();
  const [topLine, setTopLine] = useState<string>('One decision. One week.');
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'saving' | 'saved' | 'sending' | 'sent' | 'error'>('idle');
  const [weeklyAction, setWeeklyAction] = useState<{ action_text: string; why_text: string | null } | null>(null);
  const [recentNote, setRecentNote] = useState<string | null>(null);
  const [driftStatus, setDriftStatus] = useState<DriftStatus | null>(null);
  const [peerSnippets, setPeerSnippets] = useState<PeerSnippet[]>([]);
  const [topTensionKey, setTopTensionKey] = useState<string | null>(null);

  const isoWeekKey = (d = new Date()): string => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { assessmentId } = getPersistedAssessmentId();
      if (!assessmentId) return;

      setIsLoading(true);
      try {
        const aggregated = await aggregateLeaderResults(assessmentId, false);
        if (!isMounted) return;
        const tension = aggregated.tensions?.[0];
        if (tension?.summary_line) setTopLine(tension.summary_line);
        if (tension?.dimension_key) setTopTensionKey(tension.dimension_key);
      } catch {
        // Non-blocking: Today screen still works without baseline context
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Pull “one action this week” (if tables exist); fail gracefully if migrations not applied yet.
      try {
        // Get baseline context for better action generation
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
          // ignore baseline context errors
        }

        const { data, error } = await supabase.functions.invoke('get-or-generate-weekly-action', {
          body: { baseline_context: baselineContext },
        });

        if (isMounted && !error && data?.action_text) {
          setWeeklyAction({ action_text: data.action_text, why_text: data.why_text ?? null });
        }
      } catch {
        // ignore
      }

      try {
        const [checkinsRes, capturesRes] = await Promise.all([
          supabase
            .from('leader_checkins' as any)
            .select('created_at, transcript')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('leader_decision_captures' as any)
            .select('created_at, transcript')
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        const latestCheckin = checkinsRes.data?.[0];
        const latestCapture = capturesRes.data?.[0];

        const pick = (() => {
          if (latestCheckin?.created_at && latestCapture?.created_at) {
            return String(latestCheckin.created_at) > String(latestCapture.created_at)
              ? { type: 'checkin', row: latestCheckin }
              : { type: 'capture', row: latestCapture };
          }
          if (latestCheckin) return { type: 'checkin', row: latestCheckin };
          if (latestCapture) return { type: 'capture', row: latestCapture };
          return null;
        })();

        if (isMounted && pick?.row?.transcript) {
          const when = pick.row.created_at ? new Date(pick.row.created_at).toLocaleDateString() : '';
          setRecentNote(`${pick.type === 'checkin' ? 'Last check-in' : 'Last capture'} (${when}): ${String(pick.row.transcript).slice(0, 120)}…`);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Check drift status
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('compute-drift', { body: {} });
        if (isMounted && !error && data?.status) {
          setDriftStatus({
            status: data.status,
            message: data.message,
          });
        }
      } catch {
        // ignore drift check errors
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch peer snippets for top tension
  useEffect(() => {
    if (!topTensionKey) return;
    
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-peer-snippets', {
          body: {
            tension_key: topTensionKey,
            dimension_key: topTensionKey, // Use same key for now
          },
        });
        if (isMounted && !error && data?.snippets?.length > 0) {
          setPeerSnippets(data.snippets.slice(0, 2)); // Show max 2 snippets
        }
      } catch {
        // ignore peer snippets errors
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [topTensionKey]);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">Today</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? 'Loading your baseline context…' : topLine}
        </p>

        {/* Drift Warning */}
        {driftStatus && driftStatus.status !== 'ok' && (
          <Card className="mt-3 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {driftStatus.status === 'stale' ? "You've gone quiet" : "You're drifting"}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {driftStatus.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {weeklyAction ? (
          <div className="mt-3 rounded-xl border border-border bg-secondary/20 p-3">
            <div className="text-sm font-medium text-foreground">This week’s one thing</div>
            <p className="mt-1 text-sm text-foreground">{weeklyAction.action_text}</p>
            {weeklyAction.why_text ? (
              <p className="mt-1 text-sm text-muted-foreground">{weeklyAction.why_text}</p>
            ) : null}
          </div>
        ) : null}
        {recentNote ? (
          <p className="text-xs text-muted-foreground mt-2">{recentNote}</p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Weekly check-in (30 seconds)
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  One voice question. One insight. One thing to do this week.
                </p>
              </div>
              <Button onClick={() => navigate('/checkin')} className="shrink-0">
                Start
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  Capture a decision (60 seconds)
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Speak the situation. Get 3 sharp questions to ask.
                </p>
              </div>
              <Button variant="cta" onClick={() => navigate('/capture')} className="shrink-0">
                Capture
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-foreground">Baseline snapshot</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your diagnostic score, tensions, risks, and (optional) prompt library.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/baseline')} className="shrink-0">
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-foreground">Weekly reminder (email)</div>
            <p className="text-sm text-muted-foreground mt-1">
              Minimal MVP: save your preference, and send yourself a reminder now. Scheduling can come next.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  setEmailStatus('saving');
                  try {
                    const { data, error } = await supabase.functions.invoke('upsert-notification-prefs', {
                      body: { weekly_checkin_enabled: true },
                    });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    setEmailStatus('saved');
                  } catch (e) {
                    console.error('Saving notification prefs failed:', e);
                    setEmailStatus('error');
                  }
                }}
                disabled={emailStatus === 'saving' || emailStatus === 'sending'}
              >
                {emailStatus === 'saving' ? 'Saving…' : 'Enable weekly email'}
              </Button>
              <Button
                onClick={async () => {
                  setEmailStatus('sending');
                  try {
                    const { data, error } = await supabase.functions.invoke('send-weekly-checkin-reminder', { body: {} });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    setEmailStatus('sent');
                  } catch (e) {
                    console.error('Send reminder failed:', e);
                    setEmailStatus('error');
                  }
                }}
                disabled={emailStatus === 'saving' || emailStatus === 'sending'}
              >
                {emailStatus === 'sending' ? 'Sending…' : 'Send me one now'}
              </Button>
            </div>
            {emailStatus === 'sent' ? (
              <p className="mt-2 text-sm text-muted-foreground">Sent.</p>
            ) : null}
            {emailStatus === 'error' ? (
              <p className="mt-2 text-sm text-destructive">
                Couldn’t send. (Most common: no email on account yet, or Resend domain not verified.)
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Peer Tension Matching - Anonymous snippets */}
        {peerSnippets.length > 0 && (
          <Card className="border rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-foreground">Leaders like you are wrestling with this</div>
              </div>
              <div className="space-y-2">
                {peerSnippets.map((snippet, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                    <p className="italic">"{snippet.snippet_text}"</p>
                    <p className="text-xs mt-1 text-muted-foreground/60">
                      — Anonymous peer, {snippet.source_type === 'checkin' ? 'weekly check-in' : 'decision capture'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                No networking. No community. Just what your peers actually do.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

