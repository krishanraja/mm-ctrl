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

## Review round 3

**Frozen commit:** `6e965e8a4b2011e881f737b0860e3d471fe0d4d5`

**Frozen tree:** `030bce8a96f3f83282c71cdee85bc11084030c09`

**Human contract blob:** `3c7c160af855a952c074af205a0bad870a6e6890`

**Machine contract blob:** `3998cd606c54fdd460758d7b594b26f0ed5ee071`

**Checker blob:** `de268afdb7726e523921f6deb7f0f7a7160a717f`

**QA blob:** `3ec24916a042c8d21dfedeaed6d77edaeec74fc9`

**Adjudication:** `VETO`

Both technical reviewers verified the exact bytes and rejected R3. The checker resisted direct semantic mutation, and R3 materially repaired typed intents, result storage, credential rotation, replay reauthorisation, operator answer ownership, set-name parity, evaluator versioning, abort-local proof state, outbox leases and limit mapping. The non-voting founder calibration found high alignment and no product choice requiring Krish. Seven remaining implementation ambiguities govern the R4 repair:

1. Invalid requests could not satisfy the required held envelope because malformed or missing operation IDs and classes cannot be returned as valid canonical fields. A pre-admission rejection envelope is required, while held must be reserved for admitted operations.
2. Approve, edit, hold and suppress shared one approval write and result. R4 must discriminate their effects so only approve or an exact newly versioned edit can confer approval; hold and suppress must remain nonapproval transitions.
3. Principal variants lacked field schemas, actor and capability enums, case-specific equality predicates and an exact operation and lifecycle authorisation matrix.
4. Result and proof families still used undefined schema labels. The evaluator ABI had no exact manifest digest, operation export map or unique-active-selection rule.
5. Set-seal membership was named but the digest preimage framing remained ambiguous. Scalar-version inclusion was also left to "where applicable" rather than one exact per-operation map.
6. The resolver closure was not bound to one transaction attempt, connection, principal, case, snapshot, bundle digest and owner family, and was not single-use. Held operations also had no durable terminal replay rule.
7. The outbox omitted the authority-failure transition, canonical provider-idempotency guarantee owner and reconciliation evidence schema. Limit ordering grouped individual failures and omitted streaming raw transport, decompressed size, token, nesting, property and string ceilings.

R4 must not reopen the product direction. It must close these exact backstage seams, extend the checker with negative fixtures and retain the same unimplemented local-only claim.

## Review round 4

**Frozen commit:** `5e4ec8f6309a68542cd18b74e709d3490ec02b58`

**Frozen tree:** `fa6c9be4afb6822df421747cb98f66da8281c585`

**Human contract blob:** `736599d4ae3d34671872e2d531947b735a4d5d70`

**Machine contract blob:** `b9f4f628a0c7a6bae4ecbb61b4a3f1c6fb12f0e1`

**Checker blob:** `abc6a745ad464878aa3e5ba7fc17d3720efbf84e`

**QA blob:** `32082df0a31cf0ff37ac3858c30a3d48b7981e69`

**Adjudication:** `VETO`

Both technical reviewers verified the exact bytes and rejected R4. The sixteen mutation probes passed, and R4 materially repaired pre-admission rejection, principal classes, approval branches, concrete result and proof schemas, evaluator export selection, binary seal framing, resolver isolation, raw parser bounds and outbox reconciliation. The founder calibration again found high alignment and no product decision requiring Krish. The stricter review found seven remaining roots:

1. `use_release` had only a successful pending-delivery payload. It omitted the locked kernel outcome that appends an invalidation receipt and creates no outbox when a controlling watermark has changed.
2. R4 replaced snapshot and compare-and-swap but never defined the snapshot fingerprint bytes. Operator and workload grant seals were not included, and no rule forced their change through case-scope version.
3. Set sealing rejected duplicate identities without defining the identity projection for each set kind.
4. Operation-registry uniqueness scope was absent. Serialization exhaustion allowed two different outcomes, and the held evaluation fingerprint used an undefined known-dependency set.
5. Proof bytes lacked an exact genesis, predecessor encoding, bundle digest frame and decoded-byte equality to common scope, fingerprints and authoritative rows.
6. Fresh lifecycle execution required an unconsumed two-party receipt, but replay incorrectly reran that consumed execution predicate instead of checking only current disclosure authority. The joint receipt also lacked complete field, action and issuance schemas. Edited approval did not bind visibility to the final edited atom.
7. R3 size annotations and R4 post-admission limits gave the same oversized answer two possible outcomes. Outbox calls lacked a durable fenced attempt reservation and exact success-evidence schema, so crashes could evade the claimed three-attempt ceiling.

R5 may change only these seams. It must preserve the R4 gains, the single canonical Brain, leader-owned semantic state, invisible customer complexity and the unimplemented local-only claim.
