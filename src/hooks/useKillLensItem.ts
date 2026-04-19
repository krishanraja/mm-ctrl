import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface KillArgs {
  briefingId: string;
  lensItemId: string;
}

interface KillDirectArgs {
  lensItemType: string;
  lensItemText: string;
}

/**
 * Tell the backend "don't show me stories like this". Calls the
 * briefing-kill-lens-item edge function, which writes a -1.0 weight delta
 * against the lens-item signature. The effect is immediate on the next
 * briefing generation.
 */
export function useKillLensItem() {
  const [killing, setKilling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const killByBriefing = useCallback(async ({ briefingId, lensItemId }: KillArgs) => {
    setKilling(lensItemId);
    setError(null);
    try {
      const { error: err } = await supabase.functions.invoke('briefing-kill-lens-item', {
        body: { briefing_id: briefingId, lens_item_id: lensItemId },
      });
      if (err) throw err;
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setKilling(null);
    }
  }, []);

  const killDirect = useCallback(async ({ lensItemType, lensItemText }: KillDirectArgs) => {
    const key = `${lensItemType}:${lensItemText}`;
    setKilling(key);
    setError(null);
    try {
      const { error: err } = await supabase.functions.invoke('briefing-kill-lens-item', {
        body: { lens_item_type: lensItemType, lens_item_text: lensItemText },
      });
      if (err) throw err;
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setKilling(null);
    }
  }, []);

  return { killByBriefing, killDirect, killing, error };
}
