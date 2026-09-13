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

