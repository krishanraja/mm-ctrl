# G25 consequential-work spine, R142 strategy

## Decision

Build the smallest canonical database spine that can hold one consequential decision without inventing what the leader believes, hiding weak evidence or confusing a draft with an approved analysis.

This is the missing bridge between the Brain and the operator decision experience. It is deliberately a storage candidate, not a new screen and not a hosted migration.

## Product job

For one Crossing, the system must be able to preserve:

1. the leader's own starting view;
2. one immutable version of the analysis;
3. exactly three meaningfully different routes;
4. the most decision-changing question for every route;
5. evidence that both supports and challenges every route;
6. the leader's owned call, its conditions and the later outcome; and
7. who authorised each consequential transition, against which exact bytes.

That structure serves the agreed product promise: AI does the movement, synthesis and challenge work, while the human keeps the first and last gate: clear intent at the start and accountable judgement before anything consequential ships.

## Admission rules

- A version can only be inserted as a draft. It cannot arrive already sealed.
- A draft can only seal through the narrow sealing function with live owner authority.
- Authority is bound to the computed snapshot, not merely to the decision ID.
- The active human prior must be recorded no later than analysis generation; it is only a starting view if it existed before the system produced the analysis.
- Seal authority must occur after the analysis, routes, questions and evidence links that make up that exact snapshot.
- Snapshot and owned-call timestamps use timezone-independent epoch microseconds, so connection locale cannot change authority identity.
- Seal retries are only idempotent when authority, source watermark and idempotency key all match.
- Receipt idempotency is namespaced by event type, so a valid caller key cannot occupy a future internal transition receipt.
- An exact successful seal retry remains successful even after a later version supersedes it.
- A later version cannot borrow a predecessor from another decision, workspace or subject.
- A successor must name the currently sealed predecessor at exactly the previous sequence number; sealing it supersedes that predecessor and emits the replacement receipt in the same transaction.
- A successor snapshot binds both the predecessor ID and the predecessor's exact sealed snapshot digest. Re-sealing different predecessor bytes therefore cannot leave an apparently identical successor authority input.
- Successor authority must be recorded at or after the predecessor was sealed. A leader cannot authorise replacing analysis that did not yet exist in final form.
- Every route needs a question, support and refutation before sealing.
- Every evidence link and every human prior, answer, owned call and outcome resolves to an immutable atom containing the exact encrypted assertion bytes and source provenance seen at admission. An atom cannot materialise from a future-captured source, future-recorded source or future-recorded assertion. Its digest binds both materialisation time and the greatest causal watermark across source capture, source recording, assertion recording and materialisation. Materialisation first records the raw source and assertion row versions, then attempts compatible `FOR SHARE NOWAIT` snapshot locks on those exact rows and refuses the attempt if either version changed while the caller waited. A unique content-identity boundary makes concurrent callers converge on one atom without serialising unrelated assertions that share a source. Every caller then uses `pg_try_advisory_xact_lock` on the exact scoped identity before lookup/insert; contention returns the explicit `brain_decision_evidence_provenance_busy_retry` signal instead of waiting while the transaction may already hold a version or another atom identity. Conflict reuse is explicitly scoped to `READ COMMITTED` and validates both digests and the exact JSON snapshots before returning the committed winner. Identical source state reuses the same atom after a clean retry; callers cannot forge atom contents directly.
- An evidence link, human prior, answer, owned call or outcome cannot claim to occur before its source atom's causal watermark. Seal authority must follow the latest evidence and active-prior watermark, and call authority must follow the call atom's watermark. Exact bytes therefore cannot be paired with impossible chronology.
- The human-prior snapshot, call authority digest, answer receipt and outcome receipt each bind both the atom identity and digest. Later Brain edits therefore cannot rewrite what the leader knew, answered, decided or observed.
- Once an assertion or source participates in decision evidence or any of those four consequential human records, in-place update and deletion are refused. Corrections must arrive as new source and assertion records, preserving what the leader actually authorised. Unreferenced Brain material retains normal update behaviour.
- A prior-decision-match question must name an exact accepted version from a different decision in the same subject scope. That version must already be sealed or superseded before the current analysis was generated, and both its ID and sealed snapshot digest are bound into the current snapshot.
- Exactly one of the three routes must be the working recommendation; a partial uniqueness index alone is not allowed to make zero recommendations look valid.
- The leader's prior and owned call are version-bound and cannot be silently rewritten.
- A case cannot claim to open in the future.
- An answer must follow both its question and the exact analysis seal, belong to the currently sealed analysis and be recorded no later than now. Because answer admission can wait for the version row, it records the source and assertion row versions before that wait and requires the same versions when it materialises the atom afterward; a concurrent provenance change rejects the entire answer and requires a clean retry.
- A subject answer is admissible only for a `leader_can_answer` question, never for `operator_research`, and only after that exact question is in `asked` state. Proposed, suppressed, Brain-research and prior-decision tasks cannot be receipted as human answers.
- Owned-call authority and the owned call itself must follow the exact analysis seal; a backdated call cannot consume later authority or masquerade as a post-analysis judgement.
- An outcome must follow the owned call, be observed before it is recorded and be recorded no later than now; the recorded actor must be the subject who owns the call.
- Authority may be revoked only by its actor, governing owner or subject, never before the authority exists and never from the future; consumers apply only revocations effective by now.
- Revocation and authority consumption take the same fail-fast `FOR NO KEY UPDATE NOWAIT` authority-row lock. `NO KEY UPDATE` still excludes a competing revocation, seal or call but remains compatible with PostgreSQL's foreign-key `KEY SHARE` existence check. A later revocation may end future use, but it cannot be backdated to or before an already committed analysis seal or owned call and thereby make the immutable ledger contradict itself.
- Private fields require a context-bound ciphertext envelope; plain text is rejected.
- Raw authenticated-table access remains closed.
- Case opening, leader answers, owned calls and outcomes append deterministic receipts internally; the application role cannot fabricate or backfill those events directly.
- Every child write, answer, seal and successor transition takes its governing version lock with `NOWAIT` before testing standing. A transaction never waits while retaining another governing version, provenance row or atom identity; contention rolls the complete attempt back with `brain_decision_governing_lock_busy_retry`, and a clean retry reads current truth.
- Sealing, owned-call admission and revocation use the same foreign-key-compatible fail-fast authority lock. The transaction that wins determines one coherent history; the loser receives the same stable retry signal rather than waiting behind a database constraint or forming a reverse-order cycle.

## Deliberate boundaries

The database validates the encryption envelope and its context-bound AAD digest. The application producer is still responsible for real AES-256-GCM encryption, key custody, tag verification and decryption.

Service-role staging proves storage invariants; it does not prove a human actually performed an action. Authenticated owner/subject writer functions and read projections remain separate future gates. Legacy decision, news, audio and Brain-control machinery stays intact and gains no authority from this candidate.

No hosted database write, route connection, production action, merge, cutover or legacy retirement is authorised by R142.
