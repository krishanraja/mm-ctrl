import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * useProposals - the decisions the weekly pass found, each answerable yes or no.
 *
 * This is the last surface in the weekly capture chain. `capture-week` reads the
 * owner-configured evidence window and recurrence threshold, then writes
 * proposals with status 'awaiting'. Nothing it writes is applied. This hook is
 * where the owner records a decision on a proposal.
 *
 * ---------------------------------------------------------------------------
 * Acceptance is never automated (4.10.5)
 * ---------------------------------------------------------------------------
 *
 * Automate everything up to the yes, and nothing past it. The finding, the
 * grouping, the recurrence filter, the exact wording of the change, the
 * consequence if it is wrong and the size it costs are all produced without
 * anybody being asked for anything. The yes is not, and there is deliberately
 * no bulk accept, no default, no auto-accept-after-N-days and no "apply all"
 * anywhere in this file. A standard that changes without a decision is a
 * standard nobody owns, and a person who has to defend a rule they never agreed
 * to stops trusting every other rule in the file.
 *
 * `accept` and `reject` both call one narrow decision RPC with the proposal's
 * exact hash and scope. Accepting does not edit `criteria` and there is no code
 * path here that could. An acceptance produces a versioned change request;
 * applying it remains a separate governed act.
 */

// The harness tables post-date the committed generated types, so they are
// reached through an untyped client with the row shapes pinned below. Same
// scoping decision as useReview and useSort.
const db = supabase as unknown as SupabaseClient;

export type ProposalType = 'uncovered' | 'false_positive' | 'drift';

export type ProposalStatus = 'awaiting' | 'accepted' | 'rejected';

export interface ProposalEvidenceLine {
  week: string;
  surface: string;
  criterion: string;
  verdict: string;
  quote: string | null;
  disposition: string;
}

export interface ProposalEvidence {
  key?: string;
  occurrences?: number;
  weeks?: string[];
  lines?: ProposalEvidenceLine[];
  size?: { delta?: number; paired_obligation?: string };
  criterion_name?: string;
  last_fired_week?: string | null;
  question?: string;
  topic?: string;
}

export interface Proposal {
  id: string;
  proposal_hash: string;
  type: ProposalType;
  surface: string;
  headline: string;
  /** Null for a drift question, and only for a drift question. */
  delta_text: string | null;
  if_wrong: string;
  size_delta: number | null;
  evidence: ProposalEvidence;
  governance: Record<string, unknown>;
  status: ProposalStatus;
  created_at: string;
}

interface ProposalRow extends Omit<Proposal, 'evidence'> {
  evidence: ProposalEvidence | null;
}

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Ids currently being written, so a button cannot be pressed twice. */
  const [deciding, setDeciding] = useState<Record<string, boolean>>({});

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProposals([]);
        return;
      }

      const { data, error: readError } = await db
        .from('proposals')
        .select('id, proposal_hash, type, surface, headline, delta_text, if_wrong, size_delta, evidence, governance, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'awaiting')
        .order('created_at', { ascending: true });

      if (readError) {
        setError('I could not load these just now.');
        return;
      }
      setError(null);
      setProposals(((data ?? []) as ProposalRow[]).map((row) => ({ ...row, evidence: row.evidence ?? {} })));
    } catch {
      setError('I could not load these just now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProposals();
  }, [fetchProposals]);

  /**
   * Yes or no, and nothing else.
   *
   * Optimistic: the card leaves the list immediately and a failed write puts it
   * back and says so, because a decision silently not recorded means the same
   * proposal arrives again next week as if it had never been answered.
   *
   * A rejection is recorded and never argued with. The weekly pass reads it and
   * does not re-propose that key; a SECOND disagreement with the same rule comes
   * back as the urgent kind, which is the one thing a repeated no should cause.
   */
  const decide = useCallback(
    async (id: string, status: 'accepted' | 'rejected') => {
      if (deciding[id]) return;
      setDeciding((current) => ({ ...current, [id]: true }));
      const previous = proposals;
      setProposals((current) => current.filter((p) => p.id !== id));

      const proposal = previous.find((item) => item.id === id);
      const scope = proposal?.type === 'drift'
        ? { freshness_decision: status === 'accepted' ? 'revise' : 'retain' }
        : status === 'accepted'
        ? { accepted_surface: proposal?.surface, accepted_delta: proposal?.delta_text, apply_change: false }
        : { rejected_scope: 'entire_proposal', apply_change: false };
      const { error: writeError } = proposal
        ? await db.rpc('decide_capture_proposal', {
            p_proposal_id: proposal.id,
            p_expected_hash: proposal.proposal_hash,
            p_decision: status,
            p_scope: scope,
          })
        : { error: new Error('proposal_not_loaded') };

      setDeciding((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      if (writeError) {
        setProposals(previous);
        setError('I could not record that. Try it again in a moment.');
        return;
      }
      setError(null);
    },
    [deciding, proposals],
  );

  const accept = useCallback((id: string) => decide(id, 'accepted'), [decide]);
  const reject = useCallback((id: string) => decide(id, 'rejected'), [decide]);

  return { proposals, loading, error, deciding, accept, reject, refresh: fetchProposals };
}
