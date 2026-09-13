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

## Review round 8

**Frozen commit:** `87447e58c956bfb0e1ca989bb2f9aa98bbf40426`

**Frozen tree:** `f47e5c73bb90983959f05b397a48a58557175418`

**Human contract blob:** `1cba95b21248953a22d2a8e5420ddb64b7c6ca64`

**Machine contract blob:** `e6f3434d9ee591756be646bc726dd6ee0af56f6e`

**Checker blob:** `a793c1a054d20f2838679a20f0d1d56eaa37c4f0`

**Materializer blob:** `196247dd966a896c5cab5b703d82eb5f4ead6ce9`

**QA blob:** `d04500077ed8f2337ce36021f9a4d67bdd6e1be6`

**Adjudication:** `VETO`

Both technical reviewers verified the frozen archive and rejected R8. Exact generation, forty-nine declared mutations, the full documentation suite and all 211 kernel tests passed. The separate founder calibration again found high alignment and no product veto. It confirmed that authenticated foreground attestation is the honest human boundary, while warning never to claim it proves attention or comprehension and never to expose its machinery.

R8 preserved evaluator operation parity, one effect vocabulary, stable lifecycle retry identity, complete fingerprint links and a materially stronger causal outbox direction. Five implementation roots remain:

1. Structural watermark members preserve control identifiers but omit `lineage_ref` and `version_ref`. A controlling version change can therefore produce the same set, and the set preimage still names values absent from the member schema.
2. Proof rows remain locator shells rather than content-bearing authority. Candidate members, policy content, intervention content, answer-chain order, dependency edges and lifecycle preconditions are absent. Several semantic fingerprints are incorrectly reused as row-envelope fingerprints, allowing same-scope row splicing or different content under the same declared proof shape.
3. Visibility secondary idempotency names a stable attestation projection but defines no schema, preimage or collision-before-fresh-evaluation phase. Prior-acknowledgement failure conflicts with promised same-projection success.
4. Evaluator export values are maps used as if they were schemas. Closed operation and proof export-map schemas and proof-export parity are absent.
5. The outbox lacks a typed genesis event, exact event-kind-to-payload binding and a durable invocation-start record between dispatch and provider call. Without that record, recovery cannot distinguish a committed dispatch never called from a call whose outcome is unknown.

R9 must make each claimed authority reconstructible from actual bytes or exact set members. It must preserve the complete control identity, close the evaluator manifest, order visibility collision resolution before fresh evaluation and turn provider invocation into its own immutable causal event. No product decision is required and no adapter, database or runtime work opens from R8.

## R9 repair rationale before review

Krish confirmed “yes to both”: continue the exact contract repair and keep the reasoning durable. R9 changes no approved product behaviour, opens no external action and does not convert an implementation defect into a founder choice.

The R8 review clarified why passing named-field checks was insufficient. A proof is not reconstructible merely because it points at rows; the rows must contain the actual semantic material, the set members must have typed identities and ordering, and each dependency must be tied to the same owner and snapshot. Likewise, an outbox does not become crash-safe merely because state transitions are append-only; it needs a unique genesis, an exact event-to-payload binding and an immutable moment separating “definitely not called” from “may have called.”

R9 therefore makes five narrow repairs:

1. Base and applicable-control watermarks carry kind, lineage and version in both their schema and identity projection, so a lineage-only or version-only change invalidates an old release.
2. Operation and proof export maps are validated by separate closed schemas. Operation specs, result payload schemas and evaluator exports must agree exactly.
3. Visibility secondary idempotency has a closed stable projection and fingerprint. Existing acknowledgement collision resolution occurs before the fresh no-prior-ack predicate. The claim remains deliberately narrow: this is an authenticated acknowledgement of exact foregrounded content, never proof of attention or comprehension.
4. Nineteen authoritative row types carry content, not locator shells. Semantic and row-envelope fingerprints are separate. Selector candidates, answer chains, dependency edges and lifecycle preconditions use typed member schemas. Dependency and seal equality spans extension, canonical owner, dependent row and one exact scope.
5. Outbox creation has one atomic genesis. Every transition binds an exact payload schema, reference and fingerprint plus the current predecessor. Provider invocation requires its own committed event and yields a non-serializable, in-process, single-use capability. A crash before that event can be marked definitely not invoked; a crash after it is ambiguous and cannot trigger an automatic resend without a current exact idempotency guarantee.

The visible experience remains unchanged and deliberately simple. The leader sees a specific question or proposed move, the operator sees an honest review and approval action, and neither sees hashes, receipts, transition graphs or delivery recovery machinery. R9 remains unimplemented and awaits exact independent attack.

## Review round 9

**Frozen commit:** `c1a0fd1909598157559ab4e6e4737374216bdba2`

**Frozen tree:** `3b9f15c123f24252db2c2c0ca7db1743af8fe015`

**Human contract blob:** `08ff5907c86ed2534ce753183222625dd2559fb0`

**Machine contract blob:** `7d736361ca92ec44e13e0e9cc7c5a0c0264b8bc3`

**Checker blob:** `ce4434f0aafb537c1781bfebe651b91d4d023c78`

**Materializer blob:** `b2bca59702123ee65e7f40e73eb122e0440935cc`

**QA blob:** `c167b3f83583583773a635c30300f0023d4072af`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R9. Exact generation, thirty-three declared mutations, the complete documentation suite and all 211 kernel tests passed. The separate founder calibration found high alignment, no product veto and no founder decision required. It confirmed that R9 preserves human first and last gates, leader-owned truth, Edit as the visible action, narrow foreground attestation and invisible machinery.

R9 permanently improved closed evaluator operation and proof parity, collision-before-fresh visibility retry, distinct semantic and row-envelope fingerprints, content-bearing row scaffolding, atomic outbox genesis and the conservative distinction between definitely not called and may have called. Three implementation roots remain:

1. Watermark authority is duplicated. `type_registry.controlling_watermark_member` requires lineage and version, while the inherited `controlling_watermarks.member_schema` still permits versionless R8 members. The changed variants also retain R8 schema versions.
2. Proof reconstruction does not yet reproduce the locked kernel. Selector rows invent `route_1` through `route_4` instead of `reuse`, `enrich`, `ask` and `session`; they omit eligibility, provenance, actual finite burden, rejection reasons and trusted-evaluation version. Answer and lifecycle authority omit material meaning, cross-row equality remains incomplete, answer-chain genesis and set schema versions are undefined, dependency targets are untyped and lifecycle has no exact transition-to-precondition map.
3. Outbox payload causality can be cross-wired. A transition does not require the payload effect to equal its effect or uniquely consume the payload. Reconciliation success and failure share a schema without an exact branch discriminator. Invocation capability issuance and consumption are not each uniquely evidenced, so authentic payload rows can be reused in another causal path.

Checker bypasses accepted a stale duplicate watermark schema, a weakened selector burden field, an arbitrary reconciliation-failure condition, provider-success declared as no call and a cross-wired reconciliation payload schema.

R10 must establish one watermark authority, reproduce the exact locked kernel's selector, answer and lifecycle semantics through recursively resolvable proof rows and make every outbox payload and invocation capability unique to one effect, predecessor and branch. No product decision is required and no adapter, database or runtime work opens from R9.

## R10 repair rationale before review

The R9 veto exposed a recurring architectural lesson: preserving the names of locked concepts is not the same as reproducing their meaning. A candidate called `route_1` cannot prove the locked `reuse` route, a fingerprint called burden cannot replace a finite burden value, and a lifecycle authority row that names two eligible people cannot prove which person acted. The same is true of delivery: a valid payload is not causally valid unless it is bound to this effect, this predecessor, this branch and one unique consumption.

R10 therefore narrows three roots without changing product direction:

1. The type registry becomes the sole watermark authority. Each base and applicable-control member has an exact R10 variant, identity, lineage, version and fingerprint preimage. Release invalidation records both the bound and current values so a change, removal or new applicability has one meaning.
2. Canonical proof rows now reproduce the locked headless kernel. Selector candidates use `reuse`, `enrich`, `ask` and `session` with the actual eligibility, provenance, burden, rejection and trusted-evaluation fields. The selected result binds the evidence state, material effect, controls, challenger and least-burden rule. Answer rows carry the complete human-owned case effect and automatic-action prohibitions. Lifecycle authority names the acting human and resolves through the exact thirteen-transition catalogue. Cross-row equality, typed dependencies, exact genesis and versioned set ownership close the remaining splicing paths.
3. Every outbox payload exposes and equals the transition effect, and one unique consumption is committed atomically with the payload and transition. Reconciliation success and failure use distinct schemas. Invocation-start is the durable consumption of call authority, with a single-use process capability and current authority rechecks immediately before the provider boundary. A three-reservation abandoned path terminates without inventing a provider call.

The user experience remains one clear proposal, one honest human review and one deliberate action. None of the added machinery is a surface requirement. R10 remains unimplemented and awaits exact independent attack.

## Review round 10

**Frozen commit:** `2785675b75c808e01eef9ab2d950510f355ca9b8`

**Frozen tree:** `b76346f5dc404672e74d9be454bdaa6bb137477e`

**Human contract blob:** `189d7e8a74069457ef877016e230677b154b821e`

**Machine contract blob:** `7369577c25079d71afe44d4c0dc6883f53016557`

**Checker blob:** `fb11b948120aaf5eb5caed989153612055d226e1`

**Materializer blob:** `d1d4e2fbcdb1ce0e78f4c0542982e336387648bd`

**QA blob:** `e85b2171d80e3721b624daa7c46eecb3d822b67a`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R10. Exact generation, thirty-six declared mutations, the complete documentation suite and all 211 kernel tests passed. The founder calibration again found high alignment, no product veto and no founder decision required. It confirmed that the real route vocabulary, human-owned answer meaning, named acting human, deliberate gates and invisible infrastructure all remain faithful to the product.

R10 permanently removed the duplicate watermark schema, restored the real route vocabulary, made answer and lifecycle rows materially richer, added proof-set version scaffolding, bound payload maps to effects, separated reconciliation outcomes and made invocation authority explicit. Five executable roots remain:

1. Canonical field encoding does not yet define numbers, null, nullable tags or discriminated values, although R10 fingerprints those fields.
2. Selector semantics remain descriptive rather than exact. The locked kernel allows a candidate subset, gives `reuse` precedence only for sufficient evidence and ranks `enrich`, `ask` and `session` only for unresolved gaps. R10 still contains an inherited “all four” phrase, does not define the exact rejection-reason derivation or bind every result field, and leaves the selector candidate set and watermark set incompletely owned.
3. Answer and lifecycle proofs remain spliceable. Answer effects are not derived from the exact approved question option/effect contract. Lifecycle owner, actor, authority, precondition, receipt and invalidation fields are not all byte-equal to the selected catalogue row and current identities.
4. Watermark-change labels have no exact value-pattern and precedence table. Impossible null patterns remain admissible, and the complete set encoding still contains an ambiguous generic member token.
5. Outbox consumption and origin are incomplete. Consumption fields are not all required equal to the payload and transition. Invocation rechecks omit lease expiry and current-tip status. A prior ambiguous invocation can be hidden by a later “never invoked” terminal. Reconciliation transition rows still name the generic schema while the payload map names the distinct schemas. Effect creation is not yet tied to the exact successful operation branch and canonical payload bytes.

Accepted checker bypasses included arbitrary selector reason and rejection derivation, forged answer and lifecycle equality paths, implementation-defined watermark change semantics, old reconciliation schema selection, arbitrary provider-call condition, an `always` invocation recheck and weakened payload-consumption fingerprinting.

R11 must replace each remaining descriptive invariant with a closed derivation table or exact equality set, extend canonical bytes before fingerprinting new values and tie outbox genesis to one successful operation result and canonical payload. No product decision is required and no adapter, database or runtime work opens from R10.

## R11 repair rationale before review

Krish again authorised both parts of the established loop: continue the exact repair and preserve the reasoning durably. This remains a technical truthfulness repair, not a new product direction and not authority to touch UI, data, providers or production.

R10's failure is valuable product evidence. A product can appear to “know” why it chose a question while its contract only stores a route label, can appear to respect an answer while its effect is not derived from the approved question, and can appear crash-safe while a later clean-looking terminal hides an earlier uncertain call. Those are all versions of the same failure: polished language standing in for reconstructible causality. That is precisely the behaviour Krish has repeatedly rejected in the visible product as vague AI theatre and verbal overclaiming.

R11 therefore makes five narrow repairs:

1. Every newly fingerprinted value has one exact byte representation, including finite numbers, null, nullable values, base64url payloads and discriminator-bound answers.
2. The selector records the exact zero-to-four candidates it actually received, separates input and generated rejection reasons and uses one ordered table for sufficient evidence, unresolved gaps and holds. Candidate and watermark sets are sealed under their actual owner versions.
3. A leader answer resolves one exact atom, approval, authority and closed question contract. Its effect key and every resulting case field are mechanically derived from that contract. Lifecycle and Release authority receive the same byte-equality treatment.
4. Watermark changes use a total classification table with invalid null states rejected and variant identity included in set bytes.
5. Outbox consumption is field-equal across payload, transition and consumption; invocation authority must still be live at the call boundary; no-invocation exhaustion requires zero invocation history; and every effect has one immutable successful-operation origin and canonical payload.

The experience promise is unchanged. A leader should encounter one clear, timely prompt or proposal, not the machinery below it. The machinery exists so CTRL can be minimal without becoming simplistic, confident without inventing authority and helpful without silently acting beyond the human's first and last gates. R11 remains local and unimplemented until its exact frozen bytes survive independent attack.

## Review round 11

**Frozen commit:** `2ce2d7e5651c69ee1b17dd667322d7710d587b12`

**Frozen tree:** `11ab9948dd8f3f7cbc9bf5525de2e294189b2bb4`

**Human contract blob:** `1ab7b517cab49f362df782f21b287062436b6798`

**Machine contract blob:** `d2e515b2090ff981634a2f3af38b9c35daa5584e`

**QA blob:** `f3531b677820be2ceba32e94f7bfb9677aee4bc7`

**Checker blob:** `3db5420dfe250e0379588da06aa4efae7d48592b`

**Materializer blob:** `e070144500e315a2223586ef27539be70b270b7a`

**Founder-lock checker blob:** `ff129fbe6b2837550b7080ee229e13553fc26c01`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R11. Exact generation, thirty-nine declared mutations, the complete documentation suite and all 211 locked-kernel tests passed but remained non-dispositive. The founder calibration found high alignment and no product veto. It confirmed that the customer should see one clear prompt or proposal while all policy, receipt, watermark and delivery machinery remains invisible.

R11 permanently improved canonical primitive encoding, the selector's real zero-to-four candidate set and precedence, question-effect derivation intent, lifecycle catalogue projection, watermark change classification, payload-consumption equality and invocation freshness. Six executable roots remain:

1. Release projection and authority are circular. The pending projection fingerprint contains the authority fingerprint while authority now contains the projection fingerprint. `compile_release` must create the projection first, so no deterministic issuance order exists.
2. Leader and Release authority have no authorised issuing operation. The operation registry writes neither authority row, and the accepted Release request has no authoritative row, fingerprint or issuance path.
3. Lifecycle identity and evidence remain prose-bound. Actor identity, authority version, predecessor state and precondition evidence do not resolve through closed content-bearing owner rows or seals; joint human action receipts and their exact consumption are absent.
4. The question schema and answer kernel disagree. Only ranked choice may be capped at five, yet R11 caps every grammar. Blank, padded, reserved or control-bearing options and proposals are admitted by the question contract while the answer path rejects them. Proposal types also disagree.
5. Outbox origin can multiply authority and a failed final pre-call recheck has no executable path. Origin is not unique by exact committed operation, result and branch; it confuses operation ID with operation class and omits subject scope and provider target. After an invocation event, no honest `provider_called=false` transition exists.
6. Versioning remains incomplete. Operation and proof export-map schemas changed without new versions, and the R11 invalidation row retains an embedded R8 self-version constant. The hand-written schema-change manifest is not complete by construction.

Additional exact joins are required between answer authority, visibility identity and the authenticated answer principal, and between selected route and atom kind. Accepted checker bypasses included a domain-only pending-projection fingerprint, deleted answer authority derivation, unconditional lifecycle identity prose, deleted compile-Release reads, stale export-map versions and mismatched invalidation self-version.

R12 must make Release authority one-way and issuable, give every human authority an exact operation path, resolve lifecycle identity and evidence through closed owners, reproduce every question normalization rule and grammar-specific bound, make outbox origin uniquely consumptive and add an invocation-aborted-before-provider event, and derive version changes mechanically. No founder choice is required. No adapter, database or runtime implementation opens from R11.

## R12 repair rationale before review

R11 failed for the same reason several visible prototypes failed: a credible-looking object existed without a credible path by which it could become true. A Release authority that depends on a projection whose fingerprint already depends on that authority is the architectural equivalent of a confident but meaningless sentence. The repair must remove the circularity, not explain it more elegantly.

R12 establishes an executable order. Projection comes first. Named human approval creates one accepted request and authority bound one-way to it. Use comes last and rechecks present conditions. Answer authority receives the same explicit issuance path. Lifecycle human actions and evidence become closed, resolvable records with exact single consumption rather than identifiers supported by prose.

The question contract is corrected to the locked human experience: five is a ranked-choice ceiling, not a universal ceiling; blank, padded, reserved or control-bearing choices and consequences are invalid; and the question's declared proposal is the same type the answer receipt can preserve. The authenticated named leader, visible question, authority receipt and answer now resolve to one identity.

Delivery receives two final protections. One successful operation result branch can create only one effect and attempt budget, and a worker that loses authority after recording invocation-start but before calling the provider has one honest non-calling transition. It never has to pretend the provider failed, claim ambiguity or strand the causal tip.

Finally, schema-version obligations are generated from the actual before-and-after schema graph. A hand-written list can no longer quietly omit a changed export container or embedded self-version. R12 changes no approved visible product behaviour and opens no external action.

## Review round 12

**Frozen commit:** `7749ce273239cb1c162310b597c899c56d0016f0`

**Frozen tree:** `a845038133ff172ccae66c5d71524e5457404767`

**Human contract blob:** `e89aa7dd41b2ba61f4574f633df0ccb8a3e36da7`

**Machine contract blob:** `286eedd1710bbe44296b2d5de8d191a84479930e`

**QA blob:** `2ea101a91e482d41f656a36a2f20f40ae803cd4a`

**Checker blob:** `01938981b637d8d767253dad5da53fe73d75f8cf`

**Materializer blob:** `58ded8df313ee002771286563496b58aade1fc3c`

**Founder-lock checker blob:** `0cbe41a0dffe3eb836207a91d0a7a06b222bec5e`

**Machine SHA-256:** `8e530d681073afa4a5a461353c2b5e00c33199ce055103fe1f6195c1d78e3a06`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and reproduced blocking defects. The declared materializer, checker, founder lock, documentation suite and all 211 locked-kernel tests passed but were non-dispositive. The founder calibration found high alignment, no product veto and no founder decision. It confirmed that human authority remains explicit while its receipt machinery must stay hidden behind natural actions.

R12 permanently improved one-way projection fingerprints, explicit human authority operations, case identity rows, lifecycle receipt scaffolding, question grammar bounds, operation-result origin identity, an abort-before-provider event and mechanically derived schema-version obligations. Eight executable roots remain:

1. Release issuance is still circular at the operation boundary. `compile_release` requires the accepted request that `issue_release_authority` only creates after the projection exists. A pre-authority projection request must be distinct from later human acceptance.
2. The public request discriminator still exposes seventeen operations and rejects both R12 authority issuers. Operation names, request dispatch, evaluator exports and result schemas therefore disagree.
3. Release authority retains an orphan `approval_receipt_ref` and has no unique terminal consumption, so one accepted authority could be replayed into more than one use or invalidation path.
4. Root lifecycle action is impossible. Both human action intents and authoritative action receipts require a non-null predecessor even though `open_preparation` requires null and no current lifecycle row.
5. Lifecycle precondition evidence has no authorised producer. The row and prose resolution exist, but no closed evaluator operation or atomic server derivation commits its evidence, result, CAS and fingerprint.
6. Leader-answer authority does not yet bind every exact visibility, question, approval, identity and authenticated-principal field, and its use is not uniquely consumed by the answer.
7. The worker cannot execute the new abort path because it is assigned only to the lease reaper. Tip-superseded and lease-failure outcomes are not reason-scoped. Genesis also retains an equality naming the removed `source_operation_id`.
8. The transition event container is labelled R12 while its required embedded `event_schema_version` remains R9. Question validation also overclaims control-character and trimming rules the locked kernel does not enforce.

Checker bypasses reproduced arbitrary compile ABI and public-dispatch drift, a non-null root predecessor, evidence with no issuer, reusable Release and answer authority, an arbitrary abort actor, deleted genesis equalities and a stale transition self-version. R13 must close those executable paths without changing product behaviour. No adapter, database or runtime work opens from R12.

## R13 repair rationale before review

R12 again demonstrated that adding a named object is not the same as giving it an executable lifecycle. An authority that can be issued but not dispatched, consumed or invalidated exactly is still theatre; so is precondition evidence with no authorised evaluator and an abort event the active worker cannot write.

R13 therefore has one narrow purpose: make every newly claimed operation reachable from the public request boundary, make Release compilation precede rather than depend on human acceptance, make human authorities single-use, make root lifecycle and precondition evaluation executable, and make the outbox's no-call path internally self-consistent. The question contract will describe only the validation the locked kernel actually performs.

The visible product remains unchanged. These repairs exist so one natural human action has a truthful, replay-safe meaning underneath it. R13 remains local, unimplemented and closed to UI, external data, model calls, database change, deployment, merge and release until its exact bytes survive independent attack.

## Review round 13

**Frozen commit:** `6452461bd48fd451623b0fde3c9a36d0108ca47e`

**Frozen tree:** `5dd3a287f829ce2a65263321e2343d4931bec4c5`

**Human contract blob:** `7b875fd283f044b00ad453f33feecba193c656c1`

**Machine contract blob:** `a4e0a3c0a019bf8c3ebb496a545059df6400c97c`

**QA blob:** `c62b84b6996aa0d8303383d8e45ecf9d0352936c`

**Checker blob:** `f4b8ad129d21c0975518adc82143b1d1b4b79d02`

**Materializer blob:** `8f9c64274b60a6c80626913a7038d01e3351f873`

**Founder-lock checker blob:** `722c2c815d268b7f9c1a0953f2d7b9039910176e`

**Machine SHA-256:** `4dd0f8694c68aba2a61b3e1ec0699c9844327df73ac3fa8b74691910a4b8267d`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R13. Exact materialization, twenty-seven declared mutation probes, the documentation suite and all 211 locked-kernel tests passed but remained non-dispositive. Founder calibration found high alignment, no product veto and no founder decision. It confirmed that twenty internal operations must remain one natural question or one comprehensible Release decision in the visible product.

R13 permanently removed Release's future-acceptance dependency, restored public operation parity, added terminal Release consumption, made lifecycle genesis nullable, introduced an authorised precondition evaluator, narrowed question claims to kernel behaviour and separated worker and reaper abort authority. Six implementation roots remain:

1. The provider-operation rename is incomplete. Schemas expose `provider_operation_class` while identity arrays, uniqueness keys, predicates and multiple fingerprint preimages retain nonexistent `provider_operation_ref` tokens.
2. Terminal Release consumption is not joined to the exact committed `use_release` operation result, result fingerprint, terminal branch and branch-specific receipt. Its operation, result and outcome fields can be spliced.
3. Lifecycle still contains a non-null R8 stable-action projection and an impossible joint equality that makes distinct leader and operator actions equal. Combination and single-transition consumptions omit exact action-fingerprint joins.
4. Canonical case identity requires an ungrounded `case_authority_binding_fingerprint`. The canonical case authority binding has neither a fingerprint field nor a fingerprint preimage, so the projection cannot reconstruct it.
5. Lifecycle evaluator evidence does not equate its duplicate `evaluator_version_ref` to the current registry member and result. Provider-target derivation likewise omits exact equality for `provider_key_grammar_version` and `verification_source_ref`, despite hashing them.
6. The final provider-call outcome table overlaps without precedence, and retirement references remain stricter than the locked kernel because they use canonical identifiers rather than exact trimmed nonblank strings.

Accepted checker bypasses erased or rewired each of those relations while returning no failures. R14 must validate semantic equality, fingerprint preimages and recursive field vocabulary rather than relying on field presence or join counts. No adapter, database or runtime implementation opens from R13.

## R14 repair rationale before review

R13 closed reachability but not all identity. The remaining defects are variations of the same problem: two authentic objects can still be joined through an unchecked name, fingerprint or branch. Presence is not causality. R14 must make every link computable from exact bytes and make every provider-bound outcome deterministic.

The repair is technical only. It will complete the provider vocabulary migration, bind Release terminal consumption to the exact committed branch, unify lifecycle action identity and fingerprints, ground case authority in one canonical fingerprint, remove or bind duplicate evaluator identity, reproduce retirement-reference validation exactly and replace overlapping final-recheck prose with ordered, exhaustive precedence.

The visible experience and approved product direction do not change. R14 remains local and unimplemented until frozen bytes survive both independent attacks.

## Review round 14

**Frozen commit:** `7fa5d5b23f7bcd20d4460993fdae4cbfc5df52dc`

**Frozen tree:** `b9a79885003bf8dedb6f8ccd96cdb84689d58f56`

**Human contract blob:** `027257a3b9d92a018a211a39eaf5f6c38eb5e953`

**Machine contract blob:** `fbc53e06e1b78e192676b274120aac521a474488`

**QA blob:** `5292f265ff14bfc572f897d367f66f56ca400ee2`

**Checker blob:** `3a0c9f5c3504c47c340e3ed0c1ad10f0b7427a3e`

**Materializer blob:** `b29f7d48ad457fbd9be54f9193e3e208d851cd6f`

**Founder-lock checker blob:** `21d82cc1829be41a1f6c4e64c0e71326c2fb064f`

**Machine SHA-256:** `79d6dfa3a9f19c9258e380dd59c4b962c01eaa7ee4ddc18b94f5269df65403e2`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R14. Its nineteen declared semantic mutations, documentation suite and 211 locked-kernel tests passed but remained non-dispositive. Founder calibration found high alignment, no product veto and no founder choice. It reaffirmed that all internal operations must collapse into one natural visible action.

R14 permanently completed provider-target field equalities, grounded case authority in a complete fingerprint, repaired nullable stable lifecycle identity, paired most consumption references and fingerprints, aligned retirement strings to the kernel and imposed ordered provider precedence. Three executable roots remain:

1. Release consumption invents a second committed-success schema keyed by `operation_ref` instead of extending the canonical registry keyed by `operation_id`. Branch extraction does not define exact result-reference and result-fingerprint derivation for both Release outcomes.
2. Active lifecycle combine, nonce-collision and legacy fingerprint structures still contain `predecessor_lifecycle_version`, `action_ref` or old receipt vocabulary. Collision and replay cannot be implemented against the authoritative R14 rows.
3. The ordered provider table strands an expired current tip after capability consumption or a possible call. The live worker is no longer authoritative, while the reaper's no-call row requires an unconsumed capability. The existing lease-expiry ambiguity transition needs an exact higher-priority reaper route.

Accepted checker bypasses substituted arbitrary Release equalities, arbitrary provider actors and actions, and stale lifecycle fingerprint preimages. R15 must extend the one canonical operation registry, recursively eliminate legacy lifecycle tokens from the active graph and add the missing reaper ambiguity outcome. No product decision is required.

## R15 repair rationale before review

R14 made each local relation more exact but accidentally introduced a parallel truth source for Release results. R15 returns to one authority: the existing operation registry. Both Release branches must mechanically expose the exact result reference, recomputed result fingerprint and terminal receipt used by the consumption row.

Lifecycle collision and combination rules must use the same `*_receipt_ref` and nullable predecessor vocabulary as the authoritative rows. Provider recovery must also have a responsible actor after a worker dies: an expired, consumed or maybe-called current tip belongs to the reaper's ambiguity path, never a false no-call abort.

R15 changes no product behaviour or surface. It remains local and unimplemented pending exact independent review.

## Review round 15

**Frozen commit:** `0977caef12a0ef525702e23e0b248170b22c417d`

**Frozen tree:** `bc2f388b0931d6db6f35e7dcd7e881fbcce13f9e`

**Human contract blob:** `dc6ac63dc1c51482d9f3fe4ee3440c72e2a9d8be`

**Machine contract blob:** `c75c81c48d65b5c9f9dfc495ecdc44e3d90ed690`

**QA blob:** `151c693981d4e10b7a779d313ca93c765b674885`

**Checker blob:** `9d30e424ceb82a144b75fd6bc1d2d5971cb28665`

**Materializer blob:** `7dfacc58ec2151249cd5aac9286213da0776a184`

**Founder-lock checker blob:** `799448145a9749e142e8b6bcc4777b6908ea6289`

**Machine SHA-256:** `66b5c9c8fcfe61a12ebbf07ec465990745d731e22fe8b4ea67a86453d515b0d2`

**Adjudication:** `VETO`

Both technical reviewers verified the exact archive and rejected R15. The exact generator, twenty-two declared mutation probes, documentation suite and 211 locked-kernel tests passed but remained non-dispositive. Founder calibration found high alignment, no product veto and no founder decision. It confirmed that conservative dead-worker recovery is invisible infrastructure, not a customer workflow.

R15 permanently repaired the one canonical operation registry and exact Release result-branch derivation. It also moved the principal lifecycle combine and collision structures to authoritative receipt vocabulary and introduced the intended reaper ambiguity branch. Five executable roots remain after reconciling both attacks:

1. Lifecycle vocabulary closure is hand-enumerated and omits an authority predicate and other active proof, evaluator, result and fingerprint nodes. The omitted two-party predicate still uses old action-fingerprint, joint-receipt and predecessor names.
2. Expired invocation recovery is contradictory. The ordered table distinguishes unconsumed no-call abort from ambiguity, but a dead process's non-serializable capability cannot be proven unconsumed by the reaper. Broad transition guards also authorize both abort and ambiguity for the same durable state.
3. Canonical result payload bytes are only an unresolved identifier. There is no closed append-only byte row with exact content, length, content hash, unique selection and a complete committed-success envelope fingerprint.
4. Case authority binding is fingerprinted but not a workspace-and-subject-scoped, append-only, uniquely current authoritative row. `current` therefore lacks a deterministic source selection.
5. Lifecycle evaluator results bind version but not `evaluator_artifact_sha256` to every written evidence row and the selected evaluator-registry member.

Accepted checker bypasses inserted legacy lifecycle vocabulary into omitted active nodes, made transition authorization disagree with ordered recovery, removed canonical-registry conditions, left result bytes unresolved, made the terminal outcome call twice, and allowed an evaluator result to name a different artifact. R16 must scan the whole active effective graph, route every expired current invocation tip to ambiguity unless a durable provider-boundary proof exists, materialize canonical result bytes and fingerprint the success envelope, make case authority deterministically current, and close evaluator artifact identity. No product choice is required.

## R16 repair rationale before review

R15 fixed local names while still trusting hand-selected closure boundaries. R16 removes that discretion. Lifecycle vocabulary will be rejected across the effective document rather than across a list that can omit a dependency. Result bytes and case authority will become independently resolvable, scoped records rather than asserted references.

Dead-process recovery will prefer honesty over speculative retry. Once an invocation lease expires without a committed successor, the durable state cannot prove what happened inside a vanished process, so the reaper records ambiguity. Only a live fenced worker may prove a pre-provider failure and append a no-call abort. Ordered outcomes and transition authorization must be exact derivatives of one another.

R16 changes no product behaviour or visible surface. It remains local and unimplemented pending exact independent review.

## Review round 16

**Frozen commit:** `040438d234cd136e91525adced80894ff0b6eaba`

**Frozen tree:** `0eb278cfe2b5da1827de54a676ea0a308eb78bb4`

**Human contract blob:** `a254b7e91a2bc548b576cf996ba91a898aa2c530`

**Machine contract blob:** `92cededb5ea803291e2350b96e0c49c635665a9a`

**QA blob:** `08f9bfcf8b2f86c2c7d3d2d43b3dbd9d49bd3f91`

**Checker blob:** `3a1df844ecaac513da692aeceb9caf865cc467a2`

**Materializer blob:** `9166d9dd81e921bf806c03511db8bb3fd392948c`

**Founder-lock checker blob:** `ec07584960c22867cbb0e971871d00aff955c079`

**Machine SHA-256:** `479f3011d7250861fb8ec6472e43dafffa210be9c6a419e72767246e26ae516f`

**Adjudication:** `VETO`

Both technical reviewers verified the exact archive and rejected R16. Exact materialization, thirty declared mutation probes, the documentation suite and all 211 locked-kernel tests passed but remained non-dispositive. Founder calibration found high alignment, no product veto and no founder decision. It confirmed that ambiguous external delivery remains a quiet operator exception rather than customer-facing technical ceremony.

R16 permanently made result blobs closed, bounded, content-hashed and atomically joined to a completely fingerprinted success envelope. It made case rows scoped and deterministically current, bound evaluator version and artifact, closed lifecycle vocabulary globally, aligned provider transitions to selected outcomes, removed unsafe reaper no-call authority and routed every expired current invoking tip to reaper ambiguity. Five executable roots remain:

1. Result-blob canonicalization points to binary fingerprint field encoding while its row rule requires canonical JSON. The exact canonical JSON byte authority is not named consistently.
2. A success and blob may agree on any result schema without binding that schema to the operation class and selected evaluator export. Discriminated results do not distinguish the exported union schema from the selected variant. A deterministic payload-fingerprint rule is also missing for most operations.
3. Canonical response bytes and response fingerprint remain unresolved references rather than content-bearing authoritative rows with exact schema, bytes, length, hash and derivation.
4. Case authority selection is deterministic but issuance is not. No sole producer, capability, rotation compare-and-swap, ownership rule or direct-write prohibition defines who can create, rotate or expire the root leader/operator binding.
5. Worker and lease-expiry ambiguity share a schema whose reason and recorder are not bound to the selected event and actor. Priority-six failure is not a closed `at_least_one` set, so simultaneous failures can be interpreted differently.

Checker hardening must also require the predecessor suffix to equal `_ref`, not merely begin with it, and must validate exact outcome rows, transition actor-authority references, case predicates and transition actor classes. R17 must define one canonical JSON encoder, bind every result to its operation ABI, resolve response bytes, make case-authority issuance executable, split or condition ambiguity evidence by event and actor, and close the failure set. No founder decision is required if case authority remains an internal, explicitly authorised control-plane responsibility.

## R17 repair rationale before review

R16 proved that hashing bytes is not enough when the contract does not identify which bytes and schema are authoritative. R17 must bind operation class, exported union schema, selected variant schema, canonical JSON bytes and payload fingerprint into one derivation. Response bytes require the same treatment rather than inheriting trust from a sealed reference.

The root case binding will remain internal: one explicitly named case-control-plane authority may issue or rotate it under serializable compare-and-swap, with every other writer prohibited. This does not change who decides customer truth; it makes the existing leader/operator assignment executable.

Ambiguity will remain conservative but become exact. Worker and reaper evidence must carry the event-specific reason and authenticated recorder selected by the same outcome row. Non-lease failures will be an explicit closed set with `at_least_one` semantics, so concurrent failures cannot create a fallthrough choice.

R17 changes no visible product behaviour and opens no implementation or external action.

## Review round 17

**Frozen commit:** `0c7db13d1a70d1f9758c73d719b97165c4199be0`

**Frozen tree:** `ac90df421c9c06d97a7d6eefa6df2d5ee1a9cc40`

**Human contract blob:** `c2d0e61da0a6d792fe1fa5277f76831b6006f55c`

**Machine contract blob:** `ca38baf41a45acdfefd93f15147b052f199bdfaf`

**QA blob:** `680d3d882c76619a4d023d8724a69719d2696937`

**Checker blob:** `48757a1166aae47ea44f2616440b961b7b543d66`

**Materializer blob:** `2eb550c7dba223895509ac7b4f4935d3a61b17fd`

**Founder-lock checker blob:** `0ff1ab0618ce4b76e00e1d505ca2281239f68b8d`

**Machine SHA-256:** `2615ccfe048cfccfcc5ae10cc206419d28382295c0c801004638abc7033dfd2e`

**Adjudication:** `VETO`

Both technical reviewers verified the exact frozen archive and rejected R17. Exact materialization, thirty-three declared mutation probes, the documentation suite, founder lock and all 211 locked-kernel tests passed but remained non-dispositive. Founder calibration found high alignment, no product veto and no founder decision. It confirmed that bytes, schemas, receipts, row versions, grant seals, compare-and-swap, worker/reaper ambiguity and failure accounting must remain invisible. Migration-only bootstrap is acceptable only at this unimplemented seam; it cannot become permanent per-customer onboarding.

R17 permanently separated canonical JSON bytes from fingerprint framing, bound result blobs to operation, exported schema, selected schema, branch and content, made response bytes content-bearing, and joined result blob, response blob and success in one atomic claim. It also named one internal case-control writer, split ambiguity reasons and recorder classes, persisted transition actors and closed provider failure codes. Five executable roots remain after reconciling both attacks:

1. Result-schema derivation special-cases only `use_release`, but `approve_intervention` is also a discriminated union with three variants. Its selected schema is therefore required both to equal the exported union and to equal one variant, making every approval result impossible.
2. Release terminal proof still joins deleted `result_schema_version` fields and gives its terminal fingerprint both universal and branch-specific authorities. No exact terminal proof can satisfy the stale join.
3. Case rotation claims append-only rows while instructing the writer to update the prior row. Caller-supplied validity time permits backdating. The promised idempotent control receipt has no closed row, request fingerprint, replay rule or collision outcome.
4. Ambiguity transition actors and evidence recorders are independently authorised but not required to be the same identity. Two different authorised workers or reapers can sign one claimed observation.
5. Checker closure accepts `_ref_extra`, proof-map targets are not resolved mechanically against referenced schemas, and mutations can detach response identity or actor authority without failing.

No founder choice is needed. R18 must inventory every discriminated result union, repair Release onto selected-schema and one fingerprint authority, make case rotation append-only and server-timed with a closed replay-safe control receipt, bind transition actor to payload recorder, and make the checker resolve every declared field path and exact authority relation.

## R18 repair rationale before review

R17 fixed the local objects but did not prove that every consumer still spoke their new vocabulary. R18 must treat schema evolution as a graph: every exported union member, proof join, terminal result, response equality and transition actor must resolve against the actual closed schema it references.

Case history must remain truly append-only. Rotation will append a later server-timed row and leave the prior row untouched; the deterministic current selector makes the later row current. A closed control-operation registry and receipt will distinguish exact replay from same-key collision and bind the old and new row fingerprints.

The universal result fingerprint will be the sole terminal payload authority. Branch schemas still validate structure and extract the declared receipt, but they will not compete for fingerprint identity. Ambiguity evidence and its transition will name the same authenticated recorder byte for byte.

R18 changes no visible product behaviour and opens no adapter, database, runtime or external action.
