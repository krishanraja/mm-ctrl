# G25 standard-change owner gate R116

R116 closes the authority gap left deliberately open by R115. A passed candidate still changes nothing by itself. The authenticated subject owner must first receive one immutable review packet containing the complete before and after criteria, exact target diff, evidence references, candidate hashes, consequences and planned active-standard hash. Approval is bound to that packet, the planned bytes and one idempotency key.

An approval executes one database transaction. It retires the previous criterion version, creates the exact reviewed successor, confirms the full post-change criteria snapshot, creates a new active standard artifact and writes application and standard-version receipts. A rejection records the owner's decision and mutates neither the active standard nor current criteria. Neither route authorizes deployment or release.

Reversal is append-only and head-safe. It succeeds only while the applied artifact and applied criteria are still the current head. It restores the complete prior criteria snapshot and creates a new active artifact whose body is byte-identical to the source standard. If any later standard or criteria change exists, reversal refuses to guess.

## Why this shape

The product needs to heal without allowing its model to rewrite the person it is meant to preserve. The review packet makes the proposed change legible before authority is granted. The application receipt proves what changed. The reversal receipt proves what was restored. History remains inspectable, while the active Brain stays singular.

The existing newest-standard-artifact and `criteria.is_current` semantics remain authoritative. A parallel active-pointer model was rejected because it would split old and new readers into two truths before a full migration could be proven.

## Hosted proof

Three synthetic candidates travelled through the live R115 Compile, Build and Check functions and reached passed verdicts. R116 then proved:

- exact prepare replay is idempotent;
- another owner sees the packet as absent;
- direct table insertion is denied;
- rejection changes no active bytes or criteria;
- simultaneous approvals create exactly one winner;
- exact approval replay returns the original receipt;
- a changed replay conflicts;
- a prepared packet becomes stale after another approved change;
- reversal refuses an unrelated later standard head;
- exact reversal restores the source standard bytes and full criteria snapshot;
- reversal replay is idempotent and changed replay conflicts;
- all synthetic users and rows clean to zero.

The first hosted run also exposed a subtle defect: deterministic stale-state conflicts used SQLSTATE `40001`, which PostgreSQL reserves for retryable serialization failures. The stale approval could remain aborted instead of returning. R116 now uses a non-retryable application exception and returns a clean HTTP 409. The entire proof passed after the repair.

A fresh independent rollback review then found that an R116-owned standard head was not sufficient proof that its criteria were still current, and that route deletion happened too early. Rollback now requires the live standard artifact and complete live criteria snapshot to match the same R116 version receipt. Database preflight, transactional rollback and migration-history repair all complete before route removal. A live criteria-only later change was refused without changing the database or route; the exact snapshot was then restored and the full rollback, restore and hosted proof passed.

A second fresh review found the remaining preflight-to-mutation race and three retryable rollback exceptions. The rollback transaction now takes access-exclusive locks over every R116 authority table, `standard_change_requests`, `criteria` and `generated_artifacts` before it derives any snapshot. A concurrent criteria writer therefore cannot commit between validation and restoration. All deterministic rollback refusals now use non-retryable application exceptions.

A third fresh review identified a lock-order inversion between rollback and the live decision and reversal RPCs. The final repair uses receipt-first ordering and `NOWAIT` for the entire access-exclusive lock set. If any owner RPC or administrative writer is already active, rollback aborts immediately, releases any lock acquired by the statement and leaves the route intact. It never waits while holding a conflicting partial lock set, so the inversion cannot become a deadlock.

## Boundary

This is a headless isolated authority proof. It does not yet prove that a leader can understand the packet quickly, feel safe approving it, or reverse it through a world-class interface. Production, merge, release, cutover and legacy retirement remain closed. The next bounded step is the radically minimal human review projection over these receipts, with deeper evidence available on demand and no new authority.
