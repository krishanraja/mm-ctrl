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

## Review round 5

**Frozen commit:** `32b378582c18316ac3fb156ae82df60b3f29bb9b`

**Frozen tree:** `05a29d2d038700d9e8b5c2b6509ad68bb797369b`

**Human contract blob:** `80a6ca30e17fcf98cb137f272aeeda83b046dcb3`

**Machine contract blob:** `b20653edc02055b7253cc86261a849f9ec416b5e`

**Checker blob:** `c60650832d5b693ad44446fb5f2ee3ba8acdc3f1`

**QA blob:** `821e0e3e069e90f6d2bfcd1905eae79cc18980b5`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen bytes and rejected R5. The contract, documentation suite and twenty-seven declared mutations passed, but those checks were non-dispositive. The non-voting founder calibration found high alignment and no product veto. R5 preserved the correct direction around thirteen-set snapshots, grant seals, fixed member identities, fresh-versus-replay authority, pre-admission request-owned limits and durably counted provider attempts. Seven implementation roots remain:

1. The conceptual overlay cannot be materialised deterministically. It has no exact JSON Pointer patch set or complete effective document, and it contradicts inherited R4 result, replay and registry clauses.
2. Edited approval still fabricates visibility by creating, presenting and approving a new atom in one operation. It must be staged and presented first, then approved in a later human-authorised operation over that exact version and content fingerprint.
3. Lifecycle leader action, operator action and combination mint authority outside the closed operation registry. They need the same request identity, result, replay, snapshot, limit and serialization rules as every other canonical write path.
4. Release invalidation lacks one projection-version type, a closed controlling-watermark universe and order, exact watermark-set bytes, receipt fingerprint bytes and idempotent finality.
5. Authority-bearing lifecycle, invalidation and provider-success records lack exact fingerprint preimages. Decoded proof payload schemas and authoritative reference vocabulary are still delegated to future implementers.
6. The outbox cannot distinguish a reserved attempt from one already dispatched. A durable single-use dispatch transition is required, and ordinals one through three must each permit exactly one call while a fourth reservation and call remain impossible.
7. The checker still accepts semantic downgrades including MD5 snapshot or chain digests, boolean timestamp and projection-version fields, missing provider rechecks and weakened success evidence.

R6 must be one fully materialised effective contract, or an exact mechanically materialised patch whose generated effective document is frozen and validated as the authority. It will preserve the R4 replay envelope and exact original payload bytes; adding `current_standing: false` to a replay envelope is compatible with that rule, while claiming byte equality for the whole original response is not. No adapter, database or runtime implementation opens from R5.

## Review round 6

**Frozen commit:** `1354994738571e9c7bb0ec42969d654887e7bc3b`

**Frozen tree:** `2c7bfcb57d340e18cccfffa8451ea422e422b6cf`

**Human contract blob:** `db714610dd2ecddd8f7b282c4e8ded7ff9c457d4`

**Machine contract blob:** `76a5bf1f5d14a904dc660f0632caf54eff16e32e`

**Checker blob:** `ad67d6f3c673f9b25ff032627325cfbdbe2f3772`

**Materializer blob:** `bae058a50c5f34a08dc8a35641c3ded930554470`

**QA blob:** `a817257f924405896f1fad71b24a4be7c150eaa0`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R6. The generated effective document, full documentation suite, thirty-seven declared mutations and all 211 headless kernel checks passed, but semantic traversal and adversarial inspection found eight remaining roots. The non-voting founder calibration again found high alignment and no product veto.

1. Several used primitive and discriminated types were absent because the materializer read nonexistent R3 properties and JSON serialization silently omitted `undefined`. `invalid_command_hold` was also a dangling result code.
2. Universal fresh-operation authority still ran before registry lookup, contradicting disclosure-only replay. Request admission and replay lookup require an exact phase order.
3. Operation maps were key-complete but branch effects were not. Release invalidation inherited an unconditional success write set, approval omitted atomic visibility consumption and lifecycle transition omitted atomic joint-receipt consumption.
4. Visibility remained an authenticated caller assertion rather than evidence that exact rendered bytes were foregrounded and explicitly acknowledged. It needs a server-issued single-use presentation challenge and later acknowledgement.
5. Lifecycle nonce and combined-pair collisions lacked exact cross-operation outcomes. Mutable `consumed_at` fields destabilised receipt fingerprints; consumption must be separate append-only state.
6. Proof bundles used server-side references but did not map each family to one exact canonical owner row, extension equalities, current-version rule and failure code. Generic constraint strings still allowed different implementations to select different rows.
7. Fingerprint field encoding was undefined, absent optional bytes were incomplete and mutable state was included in supposedly stable receipt and outbox fingerprints.
8. Outbox dispatch lacked an exact reaper path from orphaned `dispatched` to immutable ambiguity. Attempt state mutation lost the dispatched identity, and reconciliation evidence did not bind the exact attempt, ordinal, fence and worker.

R6 did permanently close conceptual overlay ambiguity, establish one effective artifact, register all sixteen operations, preserve the historical replay envelope, retain thirteen-set CAS, make Release watermarks complete but extensible and remove caller-carried proof bytes. R7 must preserve those gains while closing the eight executable seams. The founder-locked semantic `edit` action remains: R7 will implement it as safe staging followed by exact presentation and later approval, not remove it from the product vocabulary. No adapter, database or runtime implementation opens from R6.

## R7 repair rationale before review

Krish said “yes to both”: continue the contract repair and keep the complete reasoning durable. No new product decision was inferred. The technical repair therefore keeps the approved product experience fixed and changes only executable trust semantics.

The chronology matters. R6 passed every declared check yet was still vetoed because those checks observed named fields rather than the whole semantic graph. The failure was not lack of specification volume. It was that silent JavaScript `undefined`, universal authority ordering, unconditional write sets, caller-asserted presentation, mutable consumption, generic proof prose and mutable outbox attempts each left an implementer room to build two incompatible systems that both appeared conforming.

R7 responds by making ambiguity structurally difficult:

1. It starts from R6's exact effective JSON shape, rejects every new undefined value before serialization and resolves every used type and reference through one closed graph.
2. It places registry lookup before fresh authority so replay can remain historical disclosure rather than accidentally becoming re-execution.
3. It gives approval, release and lifecycle execution branch-specific reads, writes and forbidden writes.
4. It distinguishes server challenge issuance, actual foreground display and explicit human acknowledgement. This preserves the recurring product lesson that generated, prefetched or hidden content is not something a human has seen.
5. It makes lifecycle issue receipts immutable and records combination and transition consumption separately, with exact nonce and pair-collision outcomes.
6. It replaces proof-family advice with exact authoritative table, schema, row identity, fingerprint, equality, current-state and failure mappings.
7. It defines canonical bytes for every supported field shape and gives every authority-bearing record family a stable fingerprint domain and ordered preimage.
8. It replaces mutable outbox attempts with append-only reservation, dispatch, terminal and reconciliation events, including the exact lease-expiry path for an orphaned dispatch.

This is deliberately invisible product infrastructure. It should make the later experience feel simpler and safer, not expose receipts, TTLs, hashes or state-machine language to a leader. R7 remains unimplemented and awaits exact independent attack.

## Review round 7

**Frozen commit:** `a95f210be0d4de611e8862821c050907add88d00`

**Frozen tree:** `793480d472a4ff22d7a9dd4fa5a00887e314b815`

**Human contract blob:** `cd2cf1c2e7fd2e6776e294ba1ea28d9f991c0904`

**Machine contract blob:** `98d5eb83e422cec8eaa056a8bf3b668763afcaa5`

**Checker blob:** `33922ff8bda4d2b2a89390fd1d1b035283a17db0`

**Materializer blob:** `9a9324b0b32266bd735028468e48c83ffa211620`

**QA blob:** `4c5ee8acee7b3d9ef7a179b3590107ef543b37b0`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R7. The full documentation suite, fifty-two declared mutations and all 211 kernel tests passed but remained non-dispositive. The separate founder calibration found high alignment and no product veto. It reiterated that the backstage sequence must remain invisible and that this trust contract does not prove consequential intelligence or customer value.

R7 materially closed the undefined type graph, fresh-versus-replay ordering, human presentation model, immutable lifecycle consumption, canonical field encoding and orphan-dispatch direction. Eight implementation roots remain:

1. Applicable-control watermark IDs use a narrower ASCII grammar than canonical control IDs. A valid control containing `/`, Unicode or more than 128 characters can make the required complete watermark set impossible.
2. The new presentation-challenge operation is absent from the evaluator ABI, while visibility exports still point to R6. Complete actor, case, atom, fingerprint, expiry and unconsumed-challenge equalities are not materialized. Viewer choice and competing acknowledgement outcomes remain ambiguous.
3. Lifecycle nonce and pair-collision phrases name codes absent from the rejection and hold enums. “Same canonical action bytes” incorrectly includes server-generated identifiers and times, and a new operation ID has no exact registry-commit behavior when secondary idempotency returns an existing authority record.
4. Proof maps still resolve generic shells rather than every authority-bearing row. Selector policy, intervention atom, leader authority, visibility, correction chain and dependency graph, lifecycle snapshot and authority, enrichment budget and terminal state, and execution terminal state lack exact row mappings. Generic row schemas omit those semantic bindings and fingerprint themselves circularly.
5. Presentation challenge, visibility acknowledgement, lifecycle action-combination consumption and joint-transition consumption schemas do not link their fingerprint fields to the new fingerprint definitions. Reservation and dispatch have the same orphaned-link problem.
6. Approval's legacy effect map omits the visibility consumption required by its new operation branches. The release invalidation branch and the inherited release invalidation contract use different write names. These duplicate semantic maps can disagree.
7. The outbox state machine jumps from ambiguous to reserved even though reservation requires a current claim and fence. It has no ambiguous-to-claimed transition, no schemas for claim and terminal events, and no one-terminal-event uniqueness across success, failure, ambiguity and reconciliation. Conflicting terminal history remains possible.
8. The checker still accepts inherited-property references, a corrupted evaluator export, collapsed fingerprint domains, omitted preimage fields, missing terminal uniqueness, duplicate-effect drift, removed claim authority and weakened transition conditions.

R8 must repair only these roots and preserve the R7 gains. A structural applicable-control watermark member will avoid narrowing canonical control IDs. Secondary idempotency will compare a stable caller-intent projection and still commit an exact result for the new operation ID. Every proof dependency will resolve to a closed authority-bearing row or sealed set with a non-circular fingerprint. One canonical branch-effect map and one append-only terminal-event ledger will eliminate duplicate truth. No adapter, database or runtime implementation opens from R7.

## R8 repair rationale before review

No new product decision is required. Both technical reviewers agreed that weakening actual foreground review to passive telemetry or unauthenticated client assertion would require Krish; R8 does not do that. It treats the operator's explicit foreground action as an authenticated human attestation to one exact version and makes no claim about comprehension.

R8 converts each R7 ambiguity into one testable identity:

1. Control watermarks are structural objects carrying the complete canonical control identifier, so the control universe and watermark universe cannot disagree about legal characters or length.
2. Evaluator exports and operation results have exact seventeen-key parity.
3. Challenge issuance server-resolves the viewer and exact five-minute expiry. Acknowledgement binds actor, current operator, case, atom, version, content fingerprint, challenge fingerprint, expiry and prior-use absence. Later approval consumes one unique acknowledgement record.
4. Lifecycle collision comparison uses a stable intent projection that excludes server-generated record identity and time. Every new operation ID still commits an ordinary registry success or named hold.
5. Every proof authority field maps to a family-specific owner row, dependent row or complete set seal. Each row has an exact partition, deterministic valid-time selection and linked non-circular fingerprint.
6. Approval and release each have one authoritative effect map rather than two prose-equivalent copies.
7. Outbox state is one causal append-only graph. A unique predecessor key allows exactly one successor, and typed claim, failure and unknown payloads eliminate symbolic transitions.
8. The checker uses own-property reference traversal and attacks evaluator parity, domain uniqueness, complete fingerprint preimages, proof-field coverage, claim authority and exact transition conditions.

The expected user experience is unchanged: one simple review, one deliberate approval and no visible infrastructure ceremony. R8 remains unimplemented and awaits exact independent attack.
