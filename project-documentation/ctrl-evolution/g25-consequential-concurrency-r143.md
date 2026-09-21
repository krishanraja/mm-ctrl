# G25 consequential concurrency, R143

Status: `isolated_concurrency_verified_rolled_back`

R143 closes the material version-standing and authority-revocation concurrency defects found by independent architecture review after the local R142 canary passed.

## What changed

The R142 draft-child guard, answer chronology guard, seal and supersession now acquire every governing decision-version row with `NOWAIT` before reading or changing its standing. A competing writer can no longer validate against an older committed state, and two transactions cannot wait on two versions in reverse order. Contention returns `brain_decision_governing_lock_busy_retry` and rolls the complete attempt back.

Owned-call admission now acquires a compatible `FOR SHARE NOWAIT` lock on its governing version in a before-insert trigger. That placement is deliberate: it runs before a foreign-key check can wait behind a concurrent successor seal. If the call owns the shared lock first, a successor fails fast and can retry after the call commits. If the successor owns the predecessor first, the call fails fast and its clean retry evaluates the predecessor's now-superseded standing. No stale call or receipt can slip through either ordering.

Revocation, sealing and owned-call admission also lock the same authority row with `FOR NO KEY UPDATE NOWAIT`. This remains mutually exclusive for consequential actions while allowing PostgreSQL's foreign-key `KEY SHARE` existence check to proceed. A revocation cannot be inserted later and backdated to or before a committed seal or call; a contender retries rather than blocking before the application guard.

Successor lineage is now causally bound as well. The successor snapshot includes the predecessor's exact sealed snapshot digest, and owner authority recorded before that predecessor seal is refused even when its digest matches every other successor input.

The human prior is now prior in fact, not merely in name or snapshot position. A version cannot seal when its active starting view was recorded after the analysis was generated.

Human-answer provenance is now explicit. A subject can answer only a question marked for the leader, using a non-research answer mode, after the question is marked asked. Research tasks and proposed or suppressed questions cannot create human-answer receipts.

Prior-decision transfer is now exact-version lineage rather than case-level resemblance. The matched version must belong to a different decision, already be sealed or superseded when current analysis begins, and contribute both its ID and immutable snapshot digest to the new snapshot.

Provenance is now exact-byte lineage rather than a mutable assertion lookup. Evidence links, human priors, answers, owned calls and outcomes all resolve the encrypted assertion and its source provenance into an immutable atom while both underlying rows are locked. The decision snapshot, call authority and answer/outcome receipts bind the relevant atom ID and digest; direct atom insertion is denied, and any used source or assertion can only be corrected by a new record. Unreferenced sources and assertions retain normal update behaviour.

That byte lineage is now causally ordered as well. Future-captured sources, future-recorded sources and future-recorded assertions cannot materialise an atom. The atom digest binds materialisation time and the greatest provenance watermark, every consumer must follow that watermark, and both decision-seal and owned-call authority must follow the provenance they authorise.

Atom identity is now stable under concurrency without source-wide exclusive locking. Materialisation takes compatible source and assertion snapshot locks only through `NOWAIT`, while a named unique content identity makes exact concurrent inserts converge after retry. The conflict path is explicitly limited to `READ COMMITTED`, then validates both digests, both full JSON snapshots, the causal watermark and atom hash before reusing the committed winner. Two sessions targeting the same provenance ultimately return one atom, distinct assertions sharing a source can progress together, and the prior cross-assertion update/materialise deadlock is absent.

Materialisation is also bound to the row versions visible before any wait. It captures raw source and assertion `xmin` values, takes the compatible locks, and rejects if either locked version differs. Answer and human-prior admission perform the same non-locking preflight before either waits for the decision version, then supply those exact expected versions to materialisation. An update that commits during any of those waits can no longer be frozen with an older statement timestamp; the entire attempt rolls back and a retry starts from current truth.

Materialisation now refuses to wait at either provenance or content-identity boundaries on every path. Source and assertion snapshot locks use `NOWAIT`, and exact identity uses a transaction-scoped advisory try-lock. Contention becomes the explicit `brain_decision_evidence_provenance_busy_retry` result, which rolls back the whole attempted record or batch and releases any earlier version or atom lock. A clean retry reuses the committed identity. Universal fail-fast locking prevents the inverse assertion-update → prior-version → evidence-version cycle, the atom-identity → prior-version → evidence-version cycle and reverse ordinary X→Y/Y→X atom batches from becoming PostgreSQL deadlocks.

## What the real database proved

On isolated Supabase PostgreSQL 17.6:

- a seal completed while holding its transaction open;
- a concurrent evidence writer failed fast with `brain_decision_governing_lock_busy_retry`, then the seal committed;
- the version remained sealed and its stored snapshot exactly matched a fresh recomputation;
- a successor seal superseded the current version while holding its transaction open;
- a concurrent answer writer failed fast with `brain_decision_governing_lock_busy_retry`, then the successor committed;
- no forbidden evidence, answer or answer receipt committed; and
- both orderings of revocation versus analysis seal produced one coherent history;
- both orderings of revocation versus owned-call admission produced one coherent history, with no rejected call receipt; and
- concurrent assertion rewrites lost to committed human-prior, answer, owned-call and outcome inserts, with every authoritative record retained and every rewrite rejected; and
- two concurrent materializers for one untouched assertion made the loser fail fast; its clean retry reused the single atom, and the authority created by the first session still admitted its owned call; and
- two distinct assertions sharing one source materialised concurrently without source-wide serialisation; and
- the formerly deadlocking schedule—materialise A, update and materialise B in another transaction, then reach B again—rejected and fully rolled back the stale partial attempt rather than deadlocking, preserved the updated-B winner, then completed a clean retry with exactly the correct A and updated-B atom states; and
- an update-only transaction followed by a waiting materializer rejected the stale waiter with zero atom, while a clean retry froze the updated bytes; and
- an answer that preflighted provenance and then waited behind a version-holding answer rejected after that provenance changed, leaving zero answer, atom or receipt, while a clean retry froze and receipted the updated bytes; and
- a human prior that preflighted provenance and then waited behind a draft-version route rejected after that provenance changed, leaving zero prior or atom, while a clean retry froze the updated bytes; and
- the reverse ordering—an assertion update followed by valid evidence while a human prior held the draft version—made the prior fail fast, allowed evidence to commit without `40P01`, left no partial prior, and let a clean retry reuse the updated atom; and
- an ordinary caller holding a new atom identity followed by a prior and a valid evidence link produced the same fail-fast prior, one committed atom, no `40P01`, no partial prior and exact atom reuse on retry; and
- inverse ordinary evidence batches, X→Y against Y→X, made the loser fail fast and roll back completely, allowed the winner to commit both atoms and links without `40P01`, and let a clean retry reuse both identities; and
- four distinct assertions across two versions, X→V1 then Z→V2 against Y→V2 then W→V1, made the loser fail fast at the second governing version, rolled back its first link and atom, allowed the winner to commit without `40P01`, and produced exactly four identity-matched atoms after retry; and
- the committed canary rejected a self-referential prior-decision match and a draft external precedent, rejected false human answers to Brain research, operator research, proposed and suppressed questions, rejected a human prior recorded after analysis generation, rejected a complete three-route analysis with no working recommendation, rejected all post-seal rewrites or deletion of used source/assertion evidence, rejected successor authority created before predecessor finality and proved predecessor-seal bytes change the successor digest; and
- cleanup removed all fourteen candidate tables, candidate functions, shared guards, shared indexes, fixture users and fixture data.

The final independent readback returned zero candidate tables, zero fixture users, both candidate shared indexes absent and both shared source/assertion guards absent.

## Why this matters

The Brain cannot preserve judgement if its evidence, starting view, answers, calls or outcomes can silently arrive on the wrong side of a consequential transition, or if authority history can later be rewritten to contradict an immutable use. This lock and stable-identity discipline makes “the exact analysis, provenance and authority the leader acted on” a database fact under concurrency, not a single-session assumption.

## What remains closed

The rehearsal used no production project and left no persistent R142 schema in the isolated project. Persistent migration packaging, authenticated writers, operator projections, customer surfaces, merge, release and legacy retirement remain separate gates.
