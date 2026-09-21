# G25 consequential concurrency, R143 strategy

## Decision

Rehearse the repaired R142 decision spine on the isolated Supabase project with genuinely concurrent PostgreSQL sessions before accepting the architecture.

The local PGlite canary remains useful for deterministic schema and mutation coverage, but one connection cannot prove that a child writer and a sealing transaction serialize correctly.

## Exact risks

The rejected R142 candidate read version standing without locking the version row. A writer could observe `draft`, wait behind a concurrent seal at its foreign key, and commit evidence after the sealed snapshot had been computed. An answer could similarly observe `sealed` and commit after a concurrent successor changed that version to `superseded`.

The first repair still let revocation and authority consumption observe one another without a shared lock. A service-role writer could seal an analysis or record a call, then insert a revocation later while backdating its effective time to before the already committed use. The immutable version, call and receipt would remain while the authority ledger falsely said the authority did not stand at that moment.

The second repair still let a successor carry owner authority recorded before its predecessor had been finalised. The later seal verified the successor's current bytes but could not prove the human had seen the predecessor bytes it claimed to replace.

The fourth repair required exactly one working recommendation. A fifth adversarial review then found a separate causal inversion: a service-role writer could generate the analysis first and record the supposed human starting view later. Digest binding made the bytes consistent, but not genuinely human-first.

A sixth review found that answer admission treated every question as human-answerable. A service-role writer could attach the subject to a Brain/operator research task or a question that had never been asked, then receive an immutable human-answer receipt.

A seventh review found that prior-decision transfer named only a case. Version one could cite its own still-draft decision as precedent, and no immutable record identified which accepted prior analysis supplied the claimed pattern.

An eighth review rewrote a referenced assertion after the analysis sealed. The stored and freshly recomputed decision snapshot still matched because the evidence link bound only an assertion ID while the assertion content and source provenance remained mutable.

A ninth review found the same weakness outside evidence links: the human prior, leader answer, owned call and observed outcome still carried a bare mutable assertion ID. That could silently rewrite the provenance of what the leader knew, said, decided or observed while every seal and receipt continued to validate.

A tenth review then supplied an otherwise valid source whose capture time was one hour in the future. The atom froze those bytes and the later records appeared internally consistent, but the chronology was false: a decision could claim to have used provenance that did not yet exist.

An eleventh review found that compatible shared locks let two sessions miss one another's uncommitted atom and insert different IDs for the same source/assertion state. A later lookup could choose the older atom rather than the one bound into a valid call authority, making that authority unusable solely because a concurrent transaction committed.

A twelfth review found that the first repair's fixed source-then-assertion exclusive lock order was not globally safe. One supported service transaction could legitimately update an unreferenced assertion B, then materialise B, while another transaction held the shared source after materialising A and later attempted B. Each then waited for the other's row lock and PostgreSQL had to abort one transaction.

A thirteenth review found false chronology after replacing those exclusive locks. `statement_timestamp()` was fixed when materialisation began, but a caller could wait behind an unreferenced provenance update, read the newly committed bytes afterward and stamp them with the older statement time. Answers carried a second supported path: their chronology trigger could wait on the governing version before the later atom trigger first inspected provenance, so even an immediate materializer preflight was too late.

A fourteenth review found the same pre-wait chronology hole in human-prior admission. Its generic draft guard acquired the version lock before the later atom trigger first inspected provenance. A writer could therefore hold the draft version, change an otherwise-unreferenced assertion and let the waiting prior preserve those newer bytes under its older statement time.

A fifteenth review reversed that schedule and found a valid product-shaped deadlock: one transaction could update provenance then add evidence to draft version V, while a prior held V and waited for that provenance. Each then waited for the other's row lock. The forward stale-wait schedule passed but did not exercise this inverse lock order.

A sixteenth review found the same cycle one layer later. An ordinary caller could own an uncommitted atom identity without holding an incompatible source/assertion row lock. A prior could therefore lock V, pass both provenance `NOWAIT` checks, then block on the unique atom identity while the atom owner later needed V for a valid evidence link. Row-lock fail-fast alone was insufficient.

A seventeenth review tested the apparent repair across more than one atom. Two ordinary transactions could materialise X then Y and Y then X. Because each transaction retained its first blocking advisory identity lock, each could wait forever for the other's second identity. Blocking at the content-identity layer had not removed deadlock; it had only moved the cycle.

An eighteenth review removed atom-identity overlap entirely and exposed the same cycle at the governing-version layer. With four distinct assertions, transaction A could lock V1 then request V2 while transaction B locked V2 then requested V1. Every provenance and identity check succeeded, so the blocking version locks could still produce `40P01`.

A nineteenth review exposed a different version-standing race at owned-call admission. The call guard checked standing only after insertion, so PostgreSQL's foreign-key trigger could wait for a concurrent successor and then complete without forcing the call's statement snapshot to re-evaluate the predecessor. Owned calls therefore need their own before-insert, fail-fast shared version gate; the after-insert authority guard remains the exact authority and chronology boundary.

The first hosted run of that repair exposed a separate PostgreSQL constraint interaction. `FOR UPDATE NOWAIT` on an authority row blocked the foreign-key trigger's `KEY SHARE` existence check before the after-insert authority guard could return the stable retry signal. Authority locks therefore need the weaker but still mutually exclusive `FOR NO KEY UPDATE NOWAIT` mode.

## Repair rule

- Every route, question, evidence-link and human-prior write takes its governing version row with `NOWAIT` before testing `draft`.
- Every answer takes its governing version row with `NOWAIT` before testing `sealed`.
- Seal and supersession use the same fail-fast version rule for both current and predecessor rows.
- Contention returns `brain_decision_governing_lock_busy_retry` and rolls back the whole attempt. No transaction waits while retaining another governing version, provenance row or atom identity.
- Revocation, sealing and owned-call admission take the same `FOR NO KEY UPDATE NOWAIT` authority-row lock. This still excludes one another but remains compatible with PostgreSQL's foreign-key `KEY SHARE` validation.
- A revocation effective at or before an existing seal or call is rejected. A revocation that wins the row lock first remains effective and the waiting seal or call must reject itself.
- A successor snapshot includes the predecessor's exact sealed snapshot digest, and successor seal authority must occur at or after that predecessor seal.
- The active human prior must be recorded no later than the version's analysis-generation time. Authority still follows generation, so the former separate authority-after-prior check is redundant.
- Subject answers require the exact question to be `leader_can_answer`, not use `operator_research`, and be in `asked` state. Each condition is enforced and mutation-tested independently.
- Prior-decision matches require an exact accepted version of another decision in the same subject scope. Its ID and sealed snapshot digest enter the current snapshot, and it must have been accepted before current analysis generation.
- Every evidence link, human prior, answer, owned call and outcome resolves exact assertion and source bytes into an immutable evidence atom while holding both source and assertion row locks. Atom identity and digest enter the relevant snapshot, authority digest or receipt. Direct atom insertion is denied, and any referenced source or assertion must be corrected by a new record rather than rewritten or deleted. The shared guards return the proposed row for unreferenced updates, so protecting consequential provenance does not silently freeze unrelated Brain material.
- Atom admission rejects a source captured or recorded in the future and an assertion recorded in the future. The atom hash binds materialisation time and a causal watermark derived from all four timestamps. Every consuming record must occur at or after that watermark; seal authority must follow all evidence and active-prior atom watermarks, and call authority must follow the call atom watermark.
- Atom materialisation attempts compatible `FOR SHARE NOWAIT` snapshot locks on source and assertion. A named unique constraint defines stable identity from scope, source/assertion identity and both snapshot digests. Concurrent insertion uses `ON CONFLICT DO NOTHING RETURNING`; under the explicitly supported `READ COMMITTED` isolation level, the conflict path reads the committed winner, compares both full JSON snapshots as well as their digests, revalidates its causal watermark and atom hash, and only then returns its ID. This converges exact duplicates after retry without source-wide exclusive serialisation or the cross-assertion lock inversion.
- Atom admission records the raw source and assertion `xmin` values in one non-locking preflight before it can wait, then compares them with the versions obtained under the two `FOR SHARE` locks. Any change rejects the whole attempt and requires a retry; raw equality is safe across wraparound and subtransactions because it compares exact row versions rather than ordering transaction IDs.
- Answer chronology performs that non-locking provenance preflight before acquiring the governing version lock. After the version wait and all answer checks, it materialises only against the expected row versions. A concurrent provenance update therefore leaves no answer, atom or receipt and a clean retry captures the new bytes.
- Human-prior admission now owns its draft-version gate. On insert it captures source/assertion row versions before acquiring the version lock, then materialises only against those expected versions after the wait. Updates and deletion retain the same draft-only transition boundary without re-materialising provenance. A stale attempt leaves no prior or atom and a clean retry captures current truth.
- Each exact content identity is protected by a transaction-scoped advisory lock derived from its scoped IDs and both content digests. Every materialisation path uses `pg_try_advisory_xact_lock`; no caller blocks while it may already retain another identity, provenance or governing-version lock. If either provenance row or the identity is busy, the complete attempt returns `brain_decision_evidence_provenance_busy_retry`, rolls back and retries from current truth. This makes the lock order safe for both version-holding consumers and ordinary multi-atom batches.

## Rehearsal

1. Refuse any linked project except isolated project `cgkcplcamsijghalintq`.
2. Require zero R142 tables, functions and shared indexes before setup.
3. Apply the exact R142 candidate and commit the complete canary fixture, including self and draft prior-decision refusals, false human-answer refusals, post-generation-prior refusal, zero-recommendation refusal, post-seal source/assertion rewrite and deletion refusals, future source/assertion refusals, independent causal-watermark checks for all five consumer families and both seal paths, and the causal control that creates successor authority while its predecessor is draft and then requires both that authority and a valid-digest backdated authority to fail after the predecessor seals.
4. Start a seal in one session, pause after the sealed transition while holding the transaction open, and attempt a new evidence link in another session; require an immediate governing-lock retry and no partial evidence.
5. Start a successor seal in one session, pause after superseding the predecessor, and attempt an answer against that predecessor in another session; require an immediate governing-lock retry and no answer or receipt.
6. Seal a new version while holding its authority lock, then attempt a backdated revocation; require an immediate governing-lock retry.
7. Revoke a fresh seal authority while holding its lock, then attempt the seal; require an immediate governing-lock retry and no seal.
8. Record a leader-owned call while holding its authority lock, then attempt a backdated revocation; require an immediate governing-lock retry.
9. Revoke a fresh call authority while holding its lock, then attempt the call; require an immediate governing-lock retry without a receipt.
10. Race human-prior, answer, owned-call and outcome insertion against a concurrent rewrite of each record's otherwise-unreferenced source assertion. Require the insert to commit and the waiting rewrite to reject.
11. Materialise one untouched assertion while holding the transaction open, start a second materialisation for that exact assertion, require the second caller to fail fast, then retry and reuse the single atom; prove the first session's call authority remains usable throughout.
12. Materialise two distinct assertions sharing one source in overlapping transactions and require the second to complete before the first releases, proving the source is not exclusively serialised.
13. Recreate the former lock inversion with two sessions: session one materialises A, session two updates and materialises B, then session one reaches B while session two still holds it. Require session one's stale partial attempt to reject and roll back A, require B's updated atom to remain, then retry session one and require exactly the valid A and updated-B atom states.
14. Hold an unreferenced assertion update open, start a materializer whose preflight sees the older row version, then commit the update. Require the waiter to reject with zero atom and a clean retry to freeze the updated bytes.
15. Hold a sealed version through one answer while updating a second answer's unreferenced assertion, then let the waiting second answer continue. Require its pre-wait provenance binding to reject with zero answer, atom or receipt, and require one clean retry to freeze and receipt the updated bytes.
16. Hold a draft version through one route while updating a waiting human prior's unreferenced assertion, then let the prior continue. Require its pre-wait provenance binding to reject with zero prior or atom, and require one clean retry to freeze the updated bytes.
17. Reverse that order: hold an assertion update, start a human prior that acquires the draft version, then add valid evidence for the same assertion and version from the updating transaction. Require the prior to fail fast with the retry signal, require the evidence transaction to commit without `40P01`, require zero partial prior, and require a clean prior retry to reuse the updated atom.
18. Hold a newly materialised exact atom identity uncommitted, start a human prior that acquires the draft version, then add valid evidence for the same assertion and version from the atom-owning transaction. Require the prior to fail fast at the identity boundary, require the evidence transaction to commit without `40P01`, require exactly one atom and zero partial prior, and require a clean prior retry to reuse that atom.
19. Run two ordinary evidence batches in inverse content-identity order, X→Y against Y→X. Require one complete batch to fail fast and roll back, the other to commit both atoms and links without `40P01`, then require a clean retry to reuse both exact atoms.
20. Run four distinct assertions across two draft versions in reverse governing-version order, X→V1 then Z→V2 against Y→V2 then W→V1. Require the loser to fail fast and roll back both its first link and atom, the winner to commit one link in each version without `40P01`, then require a clean retry to produce exactly four identity-matched atoms and two links per version.
21. Start a successor seal and hold the predecessor version after it has been superseded in the uncommitted transaction. Attempt a pre-authorised, later-timestamped call against that predecessor. Require an immediate governing retry before foreign-key waiting, no call or receipt, committed successor and semantic rejection on clean retry.
22. Record a pre-authorised call while holding the governing version's shared admission lock, then attempt the successor seal. Require an immediate governing retry for the successor, committed call and receipt, and successful clean successor retry.
23. Independently recompute the sealed snapshot, require no forbidden row or receipt, remove all candidate objects and fixtures, and prove zero residue.

## Boundary

This is an isolated, reversible database rehearsal. It does not create a persistent migration, connect a product route, contact production, merge, release, cut over or retire any legacy mechanism.
