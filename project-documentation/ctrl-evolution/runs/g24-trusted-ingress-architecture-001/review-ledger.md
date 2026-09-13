# G24 trusted canonical ingress architecture review ledger

**Scope:** local contract only

**External actions:** none authorised or performed

## Review round 1

**Frozen commit:** `491ba15e19865a1522006ed42c0ccc4527460e9b`

**Frozen tree:** `c7d83f221fccb2d16b0c38d897910962cb0ecba9`

**Human contract blob:** `3388e1847e8cbecf57a154e48811bdfc186f2299`

**Machine contract blob:** `40f8b8e9edba778e796eabfd7b3f00b119cb7816`

**Checker blob:** `6137671239584114201b4e4501787fa7d34879ab`

**Adjudication:** `VETO`

Both technical reviewers verified the exact candidate and rejected it. The non-voting founder calibration found the backstage direction aligned and identified no decision that requires Krish before repair. The stricter technical verdict governs.

### Why R1 failed

1. The command allowed an unconstrained operation class but no exact operation-specific human intent. An implementer would have to invent a hidden payload channel, treat an opaque ID as an unspecified pointer or derive content that belongs to the human.
2. The selector could receive an incomplete candidate set. The contract did not require one canonical candidate for each route or prove that burdens and registered capabilities were complete.
3. Transactional consistency was asserted without an isolation level, predicate protection, complete read-set fingerprint, row lock, compare-and-swap keys or serialization retry contract.
4. Durable provenance was circular. There was no canonical owner and write-path map, no direct-DML denial and no private per-type bridge from authoritative rows to fresh in-process proofs after restart.
5. The public operation lacked a registry binding identity, actor, live session, case-derived workspace, operation class, intent fingerprint and original result. Confused-deputy and changed-payload replay remained ambiguous.
6. Applicable-control completeness lacked a closed control universe, applicability-policy version, cardinality and set seal. The no-second-Brain rule was prose rather than an enforceable owner and persistence rule.
7. External side effects had no transactional outbox, provider idempotency or unknown-outcome rule.
8. Numeric bounds and named limit outcomes were absent, so an implementation would have to invent policy.
9. The checker validated only selected booleans and array lengths. The defense changed core machine invariants to their opposites and the complete documentation suite still passed.

### Preserved strengths

The single canonical Brain, model non-authority, privacy intent, audience isolation, database-owned durability, terminal-finality goal, local-only claim and closed external actions remain sound. R2 must repair the executable seams without redesigning those choices.

## Review round 2

**Frozen commit:** `3f94599065528c52f59135a48f5d6c93494699f9`

**Frozen tree:** `e700a88e0959f009ad67e6b41766e9885f20ecb6`

**Human contract blob:** `654e98ab90f34f99b908f9eb76adb83fc8775794`

**Machine contract blob:** `61efcc194339205ac2989703e236216af0f3a9ac`

**Checker blob:** `7f3cc5ad5ccf9042132185ac5384b8a38a3814d4`

**QA blob:** `46a610f38219b7105ab1edc226bf9d87db587f58`

**Adjudication:** `VETO`

Both reviewers confirmed that R2 repaired the R1 checker bypass, candidate completeness, explicit limits, session transport, serializable transaction intent, write-role ownership and broad restart-proof responsibility. The founder calibration again found the backstage direction aligned and no product choice requiring Krish. Six implementation blockers remained:

1. The operation entries named fields but did not define their types, enums, identifier grammar, optional-versus-null semantics, canonical bytes or exact result envelopes.
2. Exact replay promised original bytes while the registry stored only a fingerprint. Binding session-instance hash as operation identity also conflicted with safe replay by the same actor after legitimate session rotation. Read-only replay did not explicitly recheck current access.
3. The snapshot and compare-and-swap sets used different and partly undefined seal names. Domain-separated canonical set encoding, duplicate rejection and invalid sentinels were absent.
4. The proof bridge listed families without exact inputs or outputs. More critically, the frozen kernel mutates process-global proof and collision registries before database commit, so an aborted or serialization-failed transaction could leak uncommitted issuance or terminal state into later work.
5. The outbox had no atomic worker claim, lease, fencing token, compare-and-swap state transitions or crash-after-provider-success rule.
6. Numeric limits existed, but their byte-counting grammar and hold-code mapping were not machine-readable.

Two human-agency clarifications also carry into R3. Every replay returning protected bytes must recheck current authentication and case/audience eligibility. Only the named leader may change the semantic answer attributed to them; an operator may propose a transcription or attribution repair but cannot silently rewrite the leader's answer.

R3 must also state that this registry covers only the currently verified kernel seam. It does not yet claim to implement the full leader-owned final call, Brain learning proposal or later customer relationship loop.
