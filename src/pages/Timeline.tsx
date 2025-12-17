import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Timeline() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Array<{ type: 'checkin' | 'capture'; created_at: string; summary: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        // Note: these tables are added via migration; until deployed, this will fail gracefully.
        const [checkinsRes, capturesRes] = await Promise.all([
          supabase
            .from('leader_checkins' as any)
            .select('created_at, transcript')
            .order('created_at', { ascending: false })
            .limit(25),
          supabase
            .from('leader_decision_captures' as any)
            .select('created_at, transcript')
            .order('created_at', { ascending: false })
            .limit(25),
        ]);

        const checkins = (checkinsRes.data || []).map((r: any) => ({
          type: 'checkin' as const,
          created_at: r.created_at,
          summary: String(r.transcript || '').slice(0, 140),
        }));
        const captures = (capturesRes.data || []).map((r: any) => ({
          type: 'capture' as const,
          created_at: r.created_at,
          summary: String(r.transcript || '').slice(0, 140),
        }));

        const merged = [...checkins, ...captures].sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at))
        );

        if (isMounted) setItems(merged);
      } catch (e) {
        console.warn('Timeline fetch failed (likely tables not deployed yet):', e);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your check-ins and decision captures will show up here (compounding over time).
        </p>
      </div>

      {isLoading ? (
        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Nothing yet. Start with a 30-second check-in or capture a decision.
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => navigate('/checkin')}>
                Weekly check-in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/capture')}>
                Capture a decision
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((it, idx) => (
            <Card key={idx} className="border rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {it.type === 'checkin' ? 'Weekly check-in' : 'Decision capture'} •{' '}
                    {new Date(it.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground">{it.summary}{String(it.summary).length >= 140 ? '…' : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

