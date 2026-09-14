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

## Review round 18

**Frozen commit:** `7163c4fde940aa20602862574a69bd0737853279`

**Frozen tree:** `577e3bd5fbbae68fb0dfe871a74027ec2f8ff744`

**Human contract blob:** `e1ea7f93ed0270e7c0f8a293b7d16718f5572379`

**Machine contract blob:** `e50ff594859f1bcb990dfac3f06a97f37de68608`

**QA blob:** `1dc02d31ebb1ba0f3f8eb952e781b6b5d30feca5`

**Checker blob:** `7ae75557164342eabdbcfe5959f5997ec125630f`

**Materializer blob:** `31334c1b25d191d3bb4dc9a1a0e1babcd5d92f3f`

**Founder-lock checker blob:** `07fff83e1289859f6b37c713b771ab1a051c031f`

**Machine SHA-256:** `a6e8c78ab2a14979930b65b409350e377e8f9167268c741003257e952b5d8579`

**Adjudication:** `VETO`

Both technical reviewers verified the exact archive and vetoed R18. Its thirty-nine declared mutations, full documentation suite, founder lock and all 211 locked-kernel tests passed but remained non-dispositive. Founder calibration again found high alignment, no product veto and no founder decision. It confirmed that the new provenance machinery must remain backstage and that migration bootstrap is not a production onboarding design.

R18 permanently inventoried both discriminated result families, propagated selected schema and branch through fresh result, response and success, repaired Release onto selected schema and one universal result fingerprint, made case history append-only and server-timed, and bound ambiguity actor to recorder. Four current roots remain:

1. Both Release branches echo a terminal receipt identifier, but neither branch receipt is an authoritative row. The existing terminal-consumption row can become the sole receipt, but its exact reference and fingerprint must be bound atomically into both result branches.
2. `replayed_committed` has a closed shape but no exhaustive derivation from the stored success and result blob. Metadata can be substituted while preserving the original payload bytes.
3. Lifecycle single-action consumption uses `actor_role` to choose human authority, but omits that role from semantic and envelope fingerprints and does not join it byte-for-byte to the consumed action receipt.
4. Case-control idempotency scopes disagree about `subject_ref`; replay admission order is undefined after operator transfer; caller identity is absent from request and receipt; and collision results remain prose rather than a closed result union.

Checker bypasses accepted extra path segments, duplicate joins, invented Release extraction fields, substituted replay metadata, arbitrary lifecycle role, detached control keys and missing receipt rules. The lifecycle scanner also accepted extended property keys and hyphen-suffixed reference spellings.

No founder choice is required. The bounded R19 default is original-author-only replay: fresh execution requires the exact current Krish operator; an existing exact operation may be replayed only to the authenticated actor recorded in the original request and receipt. This preserves retry after an operator transfer without disclosing the old control receipt to a new or unrelated actor.

## R19 repair rationale before review

R18 made the principal graph resolvable but left three authority-bearing labels outside that graph: Release receipt identity, replay envelope identity and lifecycle actor role. R19 must make each one a fingerprinted equality rather than a schema-valid assertion.

The Release terminal-consumption row will be the sole terminal receipt. Both result branches may retain their human-readable branch field names, but those fields, committed `result_ref` and terminal `terminal_receipt_ref` must equal the same consumption-row reference, with its fingerprint included in the branch derivation and the operation transaction.

Replay will be a pure historical projection: every field except replay status, server-generated replay time and fixed non-current flags must equal committed success or the resolved immutable result blob. Case control will use one four-part scoped idempotency key everywhere, bind authenticated actor into request and receipt, and evaluate existing-operation replay or collision before fresh-current authority and compare-and-swap checks.

Lifecycle consumption will fingerprint and resolve its authority-bearing role. Graph checking will reject extra path segments and duplicate joins, while lifecycle vocabulary will scan both keys and values and admit only exact field-reference punctuation.

R19 changes no visible product behaviour and opens no implementation or external action.

## Review round 19

**Frozen commit/tree:** `0851d07d99d4f25ce315c7d7b2e60f75f97bb46d` / `6c69a32065f164c920330380578928a9a87b9084`

**Human / machine / QA:** `8c98c7b7fc244418a2d488edbdd1f1f3d065081d` / `e25c5b4a3e073e827a348355ce0ca7024aab3d5a` / `7c20d371b58878f4b2fd6017d8546b54e6dfe22a`

**Checker / materializer / founder checker:** `3161cea5b3f3b1b730249203f29010dd81df695f` / `0746d04e8b6a2d9afd1113f79d597eab0067bcf6` / `338eebaa993ed95a5d56084c48c75cef2fb3af33`

**Machine SHA-256:** `017bab6d0e6e96341ae9ba4341e1f77c8452730e720c7e8a6c165e57b7079dd7`
**Adjudication:** `VETO`

Both technical reviewers verified and rejected R19 despite all declared checks and 211 kernel tests passing. Founder alignment remained high with no product veto or decision. The lifecycle-role repair, exact committed replay, result unions, graph paths, ambiguity actor identity and provider failure closure survived.

Four roots remain: terminal-consumption and result fingerprints form an impossible hash cycle while obsolete branch receipts remain; durable committed holds and held replay lack authoritative rows and derivation; case actor identity is caller data rather than the server session principal; and case-control holds lack canonical fingerprints and total malformed/exhaustion outcomes. R20 must close only those roots and keep all implementation and external action closed.

## Review round 20

**Frozen commit/tree:** `19443d23d92cc670a3cc1150327694ae879c2f6d` / `52d7cba70ced4a130dab90eb39aca1b3e51fdbb2`

**Human / machine / QA:** `b020ed658e22849747cdef6093e808820f07b8a2` / `0b88f1c29f0234622e8c0f323e1c3930b1777e8c` / `62a8f46e33c821d1e41008b47aece31d4354ec66`

**Checker / materializer / founder checker:** `59103a5acb8276e22e3e035e7c75276c11db6900` / `59f43bd0e51cdc50a83d5ebb1c7ca472e224e34d` / `2840343a2b254f5cfa9bb110038c6b1cab71ed0c`

**Machine SHA-256:** `1d8f062eee31f7b29ac9383ac7f06525f7b4e256091103ef7093ce29c1434a5c`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R20 despite exact materialization, thirty-four declared mutation probes, the documentation chain, founder lock and all 211 locked-kernel tests passing. The acyclic Release precommit sequence, removal of active legacy branch receipts, universal outbox result lineage, committed-hold row and blob, server-session actor intent, total case-control outcomes and exact lifecycle property-key direction survive as requirements. Six executable roots remain:

1. The operation-result schema inventory still names the stale R12 `use_release` union and R6/R11 branches. It is not bound to the effective R20 union and branch schema versions.
2. The inherited `held` and `replayed_held` response variants lack exact schema versions and object types. The committed-hold row, blob and replay derivation therefore cannot bind one exact response schema.
3. Session and revocation authority are prose rather than closed evidence. No trusted issuer and evaluator identities, server-derived principal row, account-to-stable-actor join, expiry, standing, exact source identities, deterministic current selection or same-snapshot transaction and compare-and-swap obligations make the claimed actor executable.
4. Case hold fingerprints have domains but no closed typed input schemas, exact unavailable sentinel bytes, correlation-id derivation, exhaustive admission-row-to-reason mapping, availability bits or canonical encoding contract.
5. The Release issuance dependency graph is linear through outbox assembly. It does not branch after outcome selection, prove exactly one outbox genesis for pending delivery, prove an explicit no-outbox path for invalidation, then rejoin only at the atomic commit.
6. The checker does not mutate these exact stale-schema, response-shape, session-authority, revocation-snapshot, hold-input and branch-DAG seams strongly enough to establish closure.

No founder choice is required. R21 must close only these executable seams while preserving R20 byte-for-byte and keeping every runtime, customer, database and external action closed.

## R21 repair rationale before review

R20 established the intended identities but left some of their authorities as prose or stale references. R21 must bind every result and response to the exact effective schema, make live-session and revocation evidence closed and current in one transaction snapshot, and make each hold fingerprint a typed canonical function rather than a named domain.

Release issuance must branch only after the result outcome is known. Pending delivery assembles exactly one outbox genesis; invalidated-before-use executes one explicit no-outbox assertion. Both branches rejoin only at the atomic commit.

R21 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 21

**Frozen commit/tree:** `754994c868c31c29ffe5ed077ac3668d7ed9b95c` / `47cf682d18791aae7af2262908585450454b68f1`

**Human / machine / QA:** `2a5645411ced2866d56fc7eff882f65f6ea049d0` / `eaca9579126df4d203c22052fe94350cefa803f6` / `b0a730d9661d9d5a182831368e33947c1afbe649`

**Checker / materializer / founder checker:** `01acee8d9fb2e4d6b5f47efa2c6b4fcbc1c75582` / `e46a5f69417aa58d466236fda1e1aea355e345b9` / `37f630c4ca138c061fd8ccf464bb68693e4e48af`

**Machine SHA-256:** `25f783047ba0272cca05ca742aa856df5d485e7392bcc2ce66da351378ebdb9f`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R21 despite exact materialization, forty-five mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its exact result inventory, versioned held history, typed sentinel-bearing holds, serializable session intent and branch-complete Release issuance graph survive as requirements. Seven executable roots remain:

1. No closed server-presented principal binds the live session projection byte-for-byte to `principal_schemas.human_session`, selected session evidence and the request and current-case workspace. Session-instance lookup and the principal-kind and actor-class joins are incomplete.
2. The five session, issuer, evaluator, account-binding and account-standing stores lack a sole-writer and direct-DML contract, issuance and transition operations, bootstrap trust anchor and exact trusted-authority joins. Issuer and evaluator self-appointment and untrusted account-standing transitions remain expressible.
3. Case-control receipts do not persist the complete session-authority read set and snapshot fingerprint, so commit-time authority cannot be rehydrated and audited exactly.
4. Hold fingerprints name dependency slots but do not define one exact source path, source schema, scalar type and canonical encoding for every dependency. Raw bytes and identifier encodings can be substituted.
5. `replayed_committed` lacks an exact version and type. Held replay still contains an impossible whole-payload byte-equality assertion instead of exhaustive historical field equalities with only explicit replay fields allowed to differ.
6. The `use_release` schema inventory binds version strings but not canonical schema bytes or digests, and the derivation object itself is unversioned. A branch schema can change semantically while retaining its version.
7. The checker does not attack cross-workspace confused-deputy joins, writer and issuer authority, receipt read-set persistence, raw-versus-identifier dependency encoding, replay field substitution or same-version schema mutation.

No founder choice is required. R22 must close only these trust-boundary seams, preserve R21 byte-for-byte and keep all runtime, database, UI and external action closed.

## R22 repair rationale before review

R21 made the authority sources explicit but not yet executable as one end-to-end principal presentation and audit chain. R22 must make the live principal a closed server projection, make every authority store writer-owned and trust-anchored, and persist the exact authority read set used by every case-control receipt.

Hold dependencies and result-schema identity must bind canonical typed bytes rather than labels. Committed and held replay must be exact historical projections with only named replay fields allowed to differ.

R22 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 22

**Frozen commit/tree:** `68f4795c587554560d82ada219f3f50a8fedcc6c` / `96d562563a44715049f9b982501ed450db29ecfc`

**Human / machine / QA:** `4a15b50c36e01fea1269bd534642c49200378072` / `0a15525c30fafbb835fa9fb6c5097895edcfecb4` / `c7fce751c05ed6ea8e6ba5d4eb87f31efb2452f5`

**Checker / materializer / founder checker:** `5c9561c64df2fcd2372db2656152e442d0680b57` / `19609212270125e830d605cb2530a32bbc48cfd7` / `ce1d8d63a62af21c4e311b7a068a14fa4284a2aa`

**Machine SHA-256:** `d7a4907da81bdb1a042bbba8f480e6fc70f13b7b317ab90ed8d784912ad6f8d7`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R22 despite exact materialization, forty-two mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its server-presented projection direction, five-store writer boundary, receipt read-set intent, typed hold projection, exact replay fields and schema-digest propagation survive. Eight executable roots remain:

1. The root trust anchor is still prose around a self-hashed row rather than one externally pinned authoritative singleton with deterministic current selection, bootstrap proof and rollback-safe rotation.
2. Authority operations are labels rather than distinct closed request, result and receipt protocols. Issuer, evaluator and account-binding rows have no explicit active, revoked, expired or offboarded transition standing that makes prior rows non-current.
3. The live principal is derived from durable session evidence instead of being independently authenticated at the server boundary and then joined to it.
4. Receipt read sets omit complete composite lookup keys and immutable live-principal and presented-projection artifact bytes or resolvable content addresses needed after restart.
5. Hold dependency codec references do not resolve to closed versioned codecs, so raw SHA-256 and identifier bytes are not independently distinguishable.
6. Result-schema digests use insertion-order JSON rather than the existing Unicode-codepoint-sorted canonical object-key rules.
7. The selected result-schema digest does not reach every universal result, committed-success and pending-outbox authority identity and restart equality.
8. The checker does not attack root singleton and artifact removal, genuine trust joins, byte-identical revoke and restore, missing standing, circular live-principal derivation, incomplete receipt scope and artifacts, unresolved codecs, insertion-order digest drift, held replay operation substitution or pending-outbox digest omission.

No founder choice is required. R23 must close only these trust-boundary seams, preserve R22 byte-for-byte and keep all runtime, database, UI and external action closed.

## R23 repair rationale before review

R22 named the right authority layers but did not yet give each one an independently anchored byte identity and executable transition protocol. R23 must make root trust externally pinned, every authority operation distinct and replay-safe, and live authentication independent from durable evidence.

Restart proof must resolve the complete authority read set and content-addressed live principal artifacts. Codecs and schema serialization must resolve to one exact canonical byte grammar. The selected result-schema digest must become part of every downstream authority identity.

R23 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 23

**Frozen commit/tree:** `6b490c0860edfa83142e28d1a8336abea07b3d2f` / `35b4189c6126897e8ba0fae0eba59dc135811868`

**Human / machine / QA:** `53b3f55d9401a0821a9cbd0cc2e10d5b85d990aa` / `5615db579bbb371e35689b0bc2f0bd3dd1a593f4` / `521b6c533a847b9b791ccf43f855487ea7912338`

**Checker / materializer / founder checker:** `0ef6e41dece5b7b7c5c5d3d973a5df9b3d37edb8` / `0598e3d23811636ae2a115b591a056a6507cab63` / `e76287f451f82e7ae90524d70ee93e274ad0879d`

**Machine SHA-256:** `4b191c1215fd0d7ea8a2d15ec8a42475e50ef88f0c24dcdba51c035a1da6b584`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R23 despite exact materialization, fifty-six mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its external deployment pin, independent live assertion, canonical schema serialization, typed codecs, complete authority read-set intent and selected-result-schema lineage survive. Six executable roots remain:

1. Append-only authority selectors filter to active rows before ordering. A later revoked, offboarded or expired row can therefore resurrect an older active row. Selection must choose the latest row across every standing first, then authorize only an active and time-valid latest row. A tie or duplicate must hold.
2. Authority-operation protocols have schemas but no durable operation registry and authoritative receipt store binding canonical request, target, result and receipt blobs. Restart replay, collision, target decoding, immutable partition enforcement and exact standing transitions are therefore not executable.
3. Authority proofs remain opaque bytes with ambiguous issuer-or-evaluator privileges. Closed proof schemas must bind role, root capability, audience, scope, expiry, nonce, algorithm and verifier, and every operation must name exactly one permitted authority class.
4. Root rotation cannot safely make an immutable deployment pin and database row change atomically. R24 must narrow root scope to one externally pinned immutable singleton and fail closed on rotation until a separately reviewed staged protocol exists.
5. Authority receipts name live and projected principal artifacts but do not define their immutable content-addressed stores, complete root and deployment configuration read set, or pinned-attestor snapshot required for restart.
6. The selected result-schema digest is attached to a sidecar pending origin instead of extending the existing authoritative outbox effect origin, fingerprint, genesis equality and restart lookup. Two competing origin authorities remain.

No founder choice is required. R24 must close only these executable seams, version every changed semantic object, preserve R23 byte-for-byte and keep all runtime, database, UI and external action closed.

## R24 repair rationale before review

R23 established the required authority identities but left historical revocation, operation replay and proof privileges open to implementation choice. R24 must make latest-row selection non-resurrecting, make operation receipt identity durable and restart-complete, and give every privileged operation one exact typed proof authority.

The root remains one immutable externally pinned bootstrap singleton. Rotation is explicitly outside R24 and fails closed. Live-principal artifacts become immutable content-addressed evidence, and selected schema identity extends the existing outbox origin rather than a sidecar.

R24 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 24

**Frozen commit/tree:** `bcb77069cf1506ba0ad1d3a34de58567e219d5c8` / `0f90a1d2fb970081707b55210dff3292cfb79aff`

**Human / machine / QA:** `5630f6316f9700b42e1104c57c0bdf4ce9b272c6` / `b6354df68f14a8b8b3fa050eb9f033b07089a8b7` / `2ca9dd5cef16dabd82aae7eb11abddfd7640f02b`

**Checker / materializer / founder checker:** `74f2a1d28418e31488b8c65e7e75312d7521120a` / `130c937638f19e43a43ec2dd3b52b0a487d73f22` / `912d0447c41f1e975799f0dec686ceb6f2a6eb49`

**Machine SHA-256:** `559a62f56feb915f8f8d9b70acb540c4700e2e30d8dea2773a55205f4e6d7721`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R24 despite exact materialization, fifty-three mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its nonresurrecting latest-row direction, durable operation and receipt stores, exact role separation, immutable root scope, principal artifact stores and single outbox origin survive. Seven executable roots remain:

1. Target rows still carry authoritative order fields. Server transaction time and a monotonic partition head must own `valid_from`, row version and order so a caller cannot submit a backdated or non-tip row.
2. Registry replay and collision resolution must precede proof nonce and currentness checks. An exact committed retry must replay its stored response and receipt without proof revalidation or new effects, while a changed request holds.
3. Root bootstrap proof is incorrectly reused for issuer and evaluator administration. A distinct externally pinned root-admin capability is required. Every proof needs an exact signed preimage and fingerprint, and root bootstrap needs two distinct signer identities and signatures with a 2-of-2 threshold.
4. Proof nonces have no durable atomic consumption ledger or exact committed-replay exception.
5. Authority request, target, proof, result and replay response artifacts are named but lack separate immutable content-addressed stores with exact schema binding, size limits, canonical decode and re-encode equality, fingerprints, retention and restart failure.
6. Authority results lack one exact fingerprint and total first-match lifecycle. Persisted holds and held replay are not fully defined, and branch receipt and result non-nullability is incomplete.
7. Recursively changed case-control receipt and dependent authority-read-set schemas and fingerprint domains retain stale versions.

No founder choice is required. R25 must close only these transaction, replay, proof, artifact and lifecycle seams, preserve R24 byte-for-byte and keep all runtime, database, UI and external action closed.

## R25 repair rationale before review

R24 made authority visible to the architecture but did not yet make ordering, retries and cryptographic proof consumption one executable transaction. R25 must move row ordering to the server partition head, resolve replay before proof freshness, and bind every authority byte to one exact content-addressed store.

The result union must be total. Committed retries replay without new work. Every hold has explicit persistence and replay behavior, and no hold can acquire a committed receipt.

R25 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 25

**Frozen commit/tree:** `d1033ec3feba099a50defa2c4f9b2db53e7f32bc` / `5bbc9bda2da993b1f65b58cb51f2df1be4025122`

**Human / machine / QA:** `a451b9c7606c426fff9dddfc31cfe8645e799f7a` / `c3c3fb3ba4047471b253e17ef803a47f39372e7c` / `3f5b6355d2706c2446e4acb2e727892caeca9339`

**Checker / materializer / founder checker:** `942a0685e66b58aa971f48e4a4b9235e7a2c5a47` / `f7d17d34eee2b2752e4585b2ba9e33ba95b5744b` / `1676fc6252fbd98c9de93c77129eed7f556b767e`

**Machine SHA-256:** `8def0d4f99db236425f0b69a98f2987176d3dc5e6fad46594103b87579d716f5`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R25 despite exact materialization, forty-eight mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its server-owned ordering direction, registry-first replay, distinct bootstrap and admin proofs, nonce ledger, schema-bound authority artifacts and total result intent survive. Six executable roots remain:

1. The old selector protocol and new partition-head protocol coexist. R26 needs one authority-order protocol with exact partition schema refs, database uniqueness, head-to-max-row equality and atomic postconditions.
2. Registry rows still use nullable branch fields. Original committed and persisted-hold rows must be separate closed variants, while replay is a deterministic projection rather than a durable registry state.
3. Replay results carry dynamic `replayed_at`, so identical concurrent retries are not byte-deterministic. Any time evidence must be a separate uniquely keyed replay event.
4. Nonce uniqueness uses a generic verifier ref. Bootstrap requires a family-specific verifier-set fingerprint over two distinct signer and key identities, while admin and delegated proofs require their exact verifier identity. Invalid or unverified proofs must never poison a nonce.
5. Live assertion and projection artifact rows do not const-bind their expected schemas or persist a parsed-content fingerprint under those exact schemas.
6. Authority writer names and session proof rules conflict. One executor must own all closed writes, and session evidence must require exact current issuer and evaluator authority if both trusted joins remain.

No founder choice is required. R26 must close only these selector, branch, nonce, artifact and authority-coherence seams, preserve R25 byte-for-byte and keep all runtime, database, UI and external action closed.

## R26 repair rationale before review

R25 introduced the right stores but left two interpretations of current selection and let branch-specific authority collapse back into nullable rows. R26 must make the partition head and unique maximum row one invariant, and make original committed and held outcomes the only durable registry states.

Nonce consumption must be proof-family-specific and occur only after successful proof verification. Session authority must be exact issuer-and-evaluator conjunction, never an ambiguous alternative.

R26 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 26

**Frozen commit/tree:** `4f63710f16ea75b2b9240a1ae523f381e1c138ed` / `d8f35462560107b829a5a4f6d718387577a0eb3b`

**Human / machine / QA:** `f3b4770a8e833d4cb4a9466c841aadcd95e00cdc` / `28fdbb8082829f922679ac7ade9d5f196277e563` / `c11dc9c6a5aa46b3d81bd8be2b8af0faf4dd5e89`

**Checker / materializer / founder checker:** `c16da74d2769b3580b04f1de97d4bbd5bc93c261` / `2981b59e857df9ace7c615d2997e190148eb0bbc` / `de76e17631717394a2c9298eaea0dac9472392ea`

**Machine SHA-256:** `05a40077658eb1a6e6cf655e2325712fbef6b93f078e46db1cc069d665d73988`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R26 despite exact materialization, forty-two mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its unified authority order, branch-discriminated originals, deterministic replay direction, family-specific nonce subjects, const-bound principal artifacts and dual session authority survive. Five executable roots remain:

1. Collision still competes with the registry identities it is meant to protect. It must be a deterministic no-write projection from the existing registry row and incoming canonical request identity, not a durable original or replay source.
2. Session operations name two proofs but lack one closed dual-proof bundle with exact subproof identities, role and scope equalities, bundle fingerprint, two persisted proof triples and exactly two atomic nonce consumptions.
3. Nonce behavior is expressed in overlapping prose and tables. One exact branch-effect table must be the sole authority and invalid or preverification paths must never consume a nonce.
4. Malformed target and proof bytes cannot enter parsed artifact stores, yet hold rows refer to them. Bounded opaque raw stores are required for target and each proof slot.
5. Generic and per-operation replay schemas coexist. One operation-discriminated, timestamp-free replay schema and fingerprint must be the sole replay authority.

No founder choice is required. R27 must close only these collision, dual-proof, nonce, raw-evidence and replay seams, preserve R26 byte-for-byte and keep all runtime, database, UI and external action closed.

## R27 repair rationale before review

R26 made original committed and held states explicit but still allowed derived collision and replay behavior to masquerade as durable outcomes. R27 must make both pure deterministic projections and leave the registry immutable.

Session proof authority must become one exact bundle that preserves two independent proof and nonce identities. Malformed bytes must be held as bounded opaque evidence without pretending they parsed successfully.

R27 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 27

**Frozen commit/tree:** `41984124b10f31aeb51a55aaee1639d2b074652c` / `f12c5e7d6ba6563a670b869b0213e9dc4342a949`

**Human / machine / QA:** `7f722c1347b13df3cb2134f4bc53041d38262c21` / `8b75c07a474a5b36d450aeb11b89622332c70966` / `f8d48414b7b38f9b886c51f5b2981b339522f035`

**Checker / materializer / founder checker:** `bcdcfa1e81efe49ec8023cb8f56e38d9e4573845` / `22676ccae71ab383add30262476ce95571fc8f91` / `d3a1a2eab6a1cef15b98242079c52a7d7a41ceb3`

**Machine SHA-256:** `269d2b29d9e1b894c8c2bc5168c939fb0af92d3ce5bfe4b4de71a9d16348db0b`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R27 despite exact materialization, thirty mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its no-write collision direction, explicit dual proof, sole nonce branch table, opaque malformed-input evidence and single replay direction survive. Six executable roots remain:

1. The three session operation request schemas retain R26 versions and their request fingerprints still bind deleted issuer and evaluator request fields rather than the R27 dual bundle.
2. The dual bundle and receipt evidence are not closed content-addressed stores, while the committed receipt remains a singular-proof row that cannot persist both proof and nonce identities.
3. Held evidence still uses one raw proof slot. Session holds need distinct issuer and evaluator slots, optional raw bundle evidence and exact availability or unavailable semantics.
4. Result and replay artifact manifests retain forty-five deleted per-operation replay and collision refs. Replay needs one resolvable acyclic payload and envelope model with exhaustive source equalities.
5. The no-write collision response carries a fresh incoming request artifact ref despite prohibiting an artifact write. Its content address must derive directly from the canonical incoming request hash.
6. The checker does not recursively reject stale schema refs, same-version semantic drift, dual-bundle substitution, composite nonce authority, replay splicing or nondeterministic collision identity.

No founder choice is required. R28 must close only these schema, receipt, hold, manifest, replay and collision seams, preserve R27 byte-for-byte and keep all runtime, database, UI and external action closed.

## R28 repair rationale before review

R27 chose the correct authorities but did not propagate them through every stored byte and consumer. R28 must make the dual bundle the exact request and receipt authority for session operations, preserve both role-specific nonce receipts, and keep malformed evidence explicit without falsely parsing it.

Artifact manifests must be regenerated only from schemas that exist. Replay becomes an immutable payload followed by an acyclic envelope, while collision identity is computed without any write.

R28 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 28

**Frozen commit/tree:** `e3fcddbd7f4bc61c91122211831c0daf7d5ebc92` / `cdbccc1b8f6e50258177b9ad1a13789cd950ac7b`

**Human / machine / QA:** `feda2c1d9243f3399bf3ded495dfd6a7faacdde3` / `057d0ab12da16fdd02ce170561ded0c00a5267a1` / `b8191a7284b389cd4ca1a9782ab488a0793849f3`

**Checker / materializer / founder checker:** `35244b2b2e7439a011ca9a6aacd426ad76fae558` / `2268c6fc1ecc8bab15dc1f990d44e8d206c38896` / `d3a1a2eab6a1cef15b98242079c52a7d7a41ceb3`

**Machine SHA-256:** `6c0f8c998506bf8df1a43c6b3b669e355513d346050b2fc1fef4d5482c4e3f69`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R28 despite exact materialization, thirty-seven mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its rebuilt session request identities, discriminated dual receipts and holds, active manifests, acyclic replay direction and no-write collision identity survive. Six executable roots remain:

1. The dual bundle still carries duplicated proof, nonce-subject and verifier values without exact field-by-field joins to resolved canonical subproof artifacts and selected authority subjects.
2. Nonce rows have a fingerprint but no canonical receipt ref, content-addressed receipt identity or exact lookup, and the authority read set has no const-bound content-addressed artifact store.
3. Proof validation, nonce inserts, evidence artifacts, target and head mutation, registry, result, receipt and hold writes are not enclosed by one explicit serializable all-or-none branch transaction.
4. Malformed dual-bundle bytes lack their own opaque store and the hold truth table does not bind every raw slot to its exact artifact family, leaving role-splice ambiguity.
5. Replay points to original registry or hold refs that are not content-addressed row identities, and the first replay may require writing payload or envelope artifacts despite the claimed no-write replay path.
6. Checker coverage does not reject bundle join drift, nonce and read-set resolution gaps, partial branch commit, raw role splicing, missing malformed-bundle evidence or unresolved first replay.

No founder choice is required. R29 must close only these truth-join, receipt, transaction, raw-evidence and replay-source seams, preserve R28 byte-for-byte and keep all runtime, database, UI and external action closed.

## R29 repair rationale before review

R28 made the correct evidence shapes visible but did not yet prove that every repeated value came from one canonical source or that every durable branch appears atomically. R29 must make the bundle a projection of resolved proofs and authority subjects, give nonce and read-set evidence exact content addresses, and define one serializable all-or-none write boundary.

Malformed bundle evidence must remain role-specific. Replay artifacts are pre-materialized atomically with the original outcome so every replay is resolution only and cannot make a first-use write.

R29 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 29

**Frozen commit/tree:** `c6362ca899d164d2ec632d80f65f6c2e766f782c` / `02fba885bba9d0cd62c5db975a743937f96fa54b`

**Human / machine / QA:** `813bb02cf91d9a27fce94291fa23c278d5357979` / `b6690b3e4c2145e1f28bf5728d8ed5b864fb7778` / `f5980a6126a1563bf28b5be771acc81f15433a7b`

**Checker / materializer / founder checker:** `8a4090e3b4ec662020ff1bf9d976832d1c9e1b74` / `5c39273c17895c848313b3aaad8b7803dd8ac30c` / `ba46e2c4fd49e0668eeef7a6c42dd2a9042cac84`

**Machine SHA-256:** `2f020a872e112a5fc07079f9128a8ee9952b8f4741005a295c0333d680eb4395`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R29 despite exact materialization, thirty-nine mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its resolved bundle joins, content-addressed nonce and read-set evidence, serializable all-or-none branch boundary, role-specific malformed evidence and pre-materialized replay direction survive. Six executable roots remain:

1. Parent provenance is wrong for the frozen R28 checker, materializer and founder checker. R30 must record and assert every exact parent identity.
2. Bundle workspace and bundle identity are under-specified. Workspace must come from decoded target intent and current partition joins, while the bundle ref and one canonical runtime truth projection must be server-derived and cover every non-derived bundle field.
3. The session authority read set still inherits a singular nonce receipt fingerprint. Ordinary and dual-session read sets must be closed discriminated variants, with the session variant binding exactly the issuer and evaluator nonce receipts.
4. Consuming session holds have no closed evidence row joining bundle, projection, proofs, nonce receipts, read set, head, target or raw evidence and result. Non-consuming proof failures must bind only bounded raw evidence and consume no nonce.
5. Replay has competing store authorities and lacks one closed original historical response artifact. Registry and hold source references must be unambiguous, single-valued and atomically pre-materialized.
6. Checker coverage does not yet reject parent provenance drift, unprojected bundle keys, caller bundle refs, singular nonce inheritance, missing consuming-hold lineage, competing replay stores or historical response splicing.

No founder choice is required. R30 must close only these provenance, bundle, read-set, hold-evidence and replay seams, preserve R29 byte-for-byte and keep all runtime, database, UI and external action closed.

## R30 repair rationale before review

R29 established the right atomic boundary but left several repeated identities capable of diverging. R30 must make the bundle and its runtime truth projection entirely server-derived, distinguish ordinary from dual-session nonce evidence, and ensure every consuming hold carries the exact evidence that justified nonce consumption.

Replay must have one payload store, one envelope store and one historical response store. Every replay must resolve the exact original registry or hold row without a first-use write or ambiguous alias.

R30 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 30

**Frozen commit/tree:** `044f8bfe3983f955b549df698c3389a4e10ab3db` / `2fa3936c754f0be5fec6b504cd97505a6f4529c9`

**Human / machine / QA:** `318c30a30ea1fc710571362634b06c1dbb5554fd` / `3c3f60bc05dca78f99b6559fa3b7462126594308` / `c6677de81360abf40c9631323911458d86ee8139`

**Checker / materializer / founder checker:** `cfdc108a14fd28519b666fa1d679d0a2fc3f5cca` / `fba0d48fa2dd31f4732cd94541ce8b3683bbcb3d` / `0b3d691e4baa9ac02dc11cf50949dccbf8727255`

**Machine SHA-256:** `78bbac3dc89bb89ce4309161ab43f4e62456fb7f86616f61f7dd454a3b55b03b`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R30 despite exact materialization, forty-five mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its exact parent provenance, server-derived bundle projection, discriminated nonce read sets, session-hold evidence direction and single replay-store direction survive. Eight executable roots remain:

1. Session hold evidence includes the result that references it, creating a fingerprint cycle. Evidence must be issued first without result fields, then the result may reference evidence.
2. All seventy-five held result variants still carry legacy `hold_ref`. Every branch and fingerprint must use the exact SHA-256 `hold_row_ref` and join result, hold row, held registry, historical response and replay.
3. Held replay still compresses registry and hold identity into ambiguous source fields. Held replay must carry both exact held-registry and hold-row refs and fingerprints, while committed replay carries its exact committed-registry ref and fingerprint.
4. Historical response accepts an attacker-selected response schema. A closed operation-and-branch matrix must select one exact schema ref and version, and its fingerprint must bind operation, branch, schema identity, payload identity and result identity.
5. Bundle projection nonce-subject and verifier fingerprints are described but not defined as exact formulas against the named prior domains, selected authority rows and proof-key artifacts.
6. Session hold evidence lacks field-by-field equality tables to the exact request, read set, receipt evidence, hold row and raw artifact stores.
7. Opaque raw refs use inconsistent identifier and SHA-256 types. R31 must use SHA-256 content addresses across stores, hold rows and evidence, with exact role constants.
8. Checker coverage does not yet prove the issuance graph acyclic, migrate all seventy-five held results, enforce dual held-replay identity, close the historical schema matrix, verify projection formulas or reject raw-ref type drift.

No founder choice is required. R31 must close only these cycle, held-result, replay-source, response-schema, formula, evidence-equality and raw-address seams, preserve R30 byte-for-byte and keep all runtime, database, UI and external action closed.

## R31 repair rationale before review

R30 introduced the right evidence object but let that evidence depend on the result that depended on it. R31 must make the issuance order executable: select and validate evidence inputs, store evidence, compute the result with the evidence identity, then bind result and evidence through the hold row, registry, historical response and replay in one transaction.

Every held result must use the same content-addressed hold-row vocabulary. Replay must preserve both held-registry and hold-row identity, and historical response selection must be a closed operation-and-branch fact rather than caller input.

R31 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 31

**Frozen commit/tree:** `07d817469775ada105d0c5b16e0e8afd9c7dee27` / `df7013cc04e9363e113a502bf6856a446ec73895`

**Human / machine / QA:** `eb22381a8525d12bb932bc65ce6e874d9879a4ef` / `34e7c64b8442f0e3cd470e512819708f4d28838a` / `b6973ec196b8c86a4787fbdbd33cac25bb8e332b`

**Checker / materializer / founder checker:** `60a8284ea9b36e01b9623c41211e9a604e5030c6` / `4a385c4878b5a9335ff2f17f79aa21cfd18b1944` / `9835190a02059749bb36aa32aecd393290e1331c`

**Machine SHA-256:** `a068f7fbf9efa8e3b5c353a8968a729c5b729933bfb1f7784bb516ee1d9317ff`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R31 despite exact materialization, fifty-one mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its acyclic pre-result evidence direction, universal SHA-256 hold-row reference, split replay source identities, closed response matrix, projection formulas and consistent raw reference types survive. Six executable roots remain:

1. All seventy-five held result variants still carry the final `hold_fingerprint`, so result identity and final hold fingerprint form a fixed point. `hold_row_ref` must be the sole pre-result hold identity. Final hold fingerprint may be computed only after the result triple exists.
2. All five opaque raw stores name nonexistent `raw_bytes_sha256` operands in their unique keys and content-address rules. Every operand must resolve to the declared `opaque_bytes_sha256` property.
3. Issuer and evaluator nonce rows are not joined field by field to the selected bundle projection, canonical proof, operation and outcome. Receipt, read-set and consuming-hold evidence must resolve the same exact two rows so a nonce from another bundle cannot be spliced in.
4. The R31 projection derivation still names the R30 projection fingerprint domain. The R32 schema, derivation and fingerprint authority must name one exact R32 domain and preimage.
5. Replay lookup triples are not fully proved to resolve their canonical payload and envelope stores, and historical response equalities contain ambiguous or nonexistent operands. Operation, branch, result, payload, response, registry and hold identities must resolve through exact field-level equalities.
6. Checker coverage does not yet detect the result-to-hold fixed point, stale evidence reverse dependencies, old projection domains, undeclared operands, nonce-row splicing, unrelated replay artifacts, operation mismatch or nonexistent equality fields.

No founder choice is required. R32 must close only these hold-fingerprint, operand, nonce-row, projection-domain, replay-resolution and checker seams, preserve R31 byte-for-byte and keep all runtime, database, UI and external action closed.

## R32 repair rationale before review

R31 established the correct pre-result hold-row reference but still allowed the final hold fingerprint to leak back into the result. R32 must make issuance strictly one way: evidence and hold-row reference first, result second, final hold fingerprint third, then registry, historical response and pre-materialized replay.

Every stored identity must now resolve through declared fields and one canonical source. The two session nonce rows are exact projections of the selected issuer and evaluator proofs, while replay may return only the canonical response already bound to the same operation and original result.

R32 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 32

**Frozen commit/tree:** `6d08ade0766d843c1a724b57da3ecec1637ac0a1` / `b9beba3ade0c98371f894aa6acebe6184b52af07`

**Human / machine / QA:** `3f8d1a53ced68757d9da734cc747cbe9694aac48` / `d0eb74c71e64e78768463f353959142fd1cd40f0` / `bfd4d40034350ea84709b7757976727ff9f44114`

**Checker / materializer / founder checker:** `37ccb33994ca1096a98abe3bbdc8e71d3a3c5d4f` / `e2992bd111ffad124593947982e29e3db833a110` / `52b006e1497898521a35507ca9d3d71a2680ccae`

**Machine SHA-256:** `f392cd5338bf5ade8c07e1724bfbd44fda0906bd8ee6d4726a60d45e219559c0`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R32 despite exact materialization, forty-four mutation probes, the founder lock, full documentation chain and all 211 locked-kernel tests passing. Its result-independent hold reference, declared raw operands, exact dual nonce rows, singular projection domain and content-addressed replay triples survive. Six executable roots remain:

1. Every committed result still includes the final receipt fingerprint while the receipt fingerprint includes the result triple. Ordinary and session committed branches therefore contain a result-to-receipt fixed point.
2. Session hold issuance still computes the hold-row reference in parallel with its evidence even though the actual hold-row preimage includes that evidence. Evidence must be stored first, then the hold-row reference, then result identity, then final hold fingerprint.
3. Replay bindings do not yet make the committed or held registry the sole authority for operation, branch, result, historical response and, for held outcomes, exact hold-row identity. Payload copies remain vulnerable to cross-row splicing.
4. The held result timestamp is not explicitly equal to the precommit hold timestamp, final hold-row timestamp and held-registry timestamp across all seventy-five held variants.
5. Residual compound prose can still imply evidence-to-result authority even where the field graph intends the opposite. R33 must remove those reverse claims and machine-check the complete dependency graph.
6. Checker coverage does not yet reject ordinary and session receipt cycles, missing evidence-before-hold edges, reverse semantic clauses, registry/result/history A-B-C splicing, held timestamp mismatch or omitted dependency edges.

No founder choice is required. R33 must close only these committed-receipt, session-hold-order, replay-authority, timestamp and checker seams, preserve R32 byte-for-byte and keep all runtime, database, UI and external action closed.

## R33 repair rationale before review

R32 made the held branch acyclic but left the same mistake on committed receipts. R33 must derive a precommit receipt identity from request, target, proof and authority inputs, let the committed result reference only that identity, then compute the final receipt fingerprint from the completed result.

Session hold evidence must become an actual predecessor of the hold-row reference, not a parallel input. Replay must copy only from one authoritative registry row and the exact artifacts that row binds. Held time is one server timestamp preserved through result, hold, registry and replay.

R33 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 33

**Frozen commit/tree:** `a190ccf434c8a88ed4e87f667c12912f4e4af7b3` / `1815e5bde6877ac9fe5c5fbb4c0e561b5d8702a8`

**Human / machine / QA:** `eee9b31e0bff3854ab90d6c6fbff33cf40f64936` / `f4b37a63ec470070b6a5561c770bfb6055bfb391` / `feb1953289567efee6ef41136b7eedf19497c591`

**Checker / materializer / founder checker:** `85f918a872655c056397e5e9b9e40fc9a5275b69` / `58dffadf48afc023eb9bf54c7b731c55d41109c1` / `b59d44cce676de387f9bc38693bfd0b37d90da9e`

**Machine SHA-256:** `785e1ab73e85a1bbd2f5396012da689325137791d42970cff42b45ddb0aeef8f`

**Adjudication:** `VETO`

Both independent technical reviewers verified and rejected R33. Its acyclic committed receipt identity, evidence-before-hold order, exact held timestamps, registry-authoritative replay framing, historical result-byte binding and retained dual nonce joins survive. Five executable roots remain:

1. Every committed result payload still contains `result_ref`, while the result artifact reference is the SHA-256 of canonical result bytes. This creates a self-referential content address because the bytes contain the value that must equal their own hash.
2. All seventy-five held results omit `result_ref`, but replay still sources historical result identity from decoded outcome `result_ref`. Held replay therefore depends on a field that cannot exist.
3. Historical `result_ref` must come only from the selected result artifact reference, while `result_bytes_sha256` must equal that artifact's canonical byte hash and `result_fingerprint` must equal the decoded result fingerprint. No decoded outcome may author its own artifact identity.
4. The dependency graph omits the result-fingerprint-to-result-artifact edge and the historical-response-to-registry edge. Its branch ordering can therefore place registry material before the history that the registry binds.
5. Checker coverage does not yet prove source existence, type parity and exact local binding coverage across all fifteen committed and seventy-five held result variants, or reject missing, reversed and stale result/history dependencies.

No founder choice is required. R34 must close only these result-artifact, history-binding, dependency-graph and checker seams, preserve R33 byte-for-byte and keep all runtime, database, UI and external action closed.

## R34 repair rationale before review

An outcome may describe what happened and carry its result fingerprint, but it cannot declare the content address of its own bytes. R34 must compute the result fingerprint, serialize the exact result, derive the artifact reference from those bytes and make that artifact the sole source of historical and replay result identity.

The dependency graph must be derived from the same fingerprint, content-address and equality rules that the stores execute. History must be materialized before the final receipt or hold and before the registry that binds it. Replay must resolve only identities reachable from that one registry row.

R34 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 34

**Frozen commit/tree:** `45ba363f08324240f311bba2610e9ad93c640624` / `595874408a4a143bc5e09743652470d0f10d4211`

**Human / machine / QA:** `b22f1a67b26887c24d949b68f5f2de352752ca4a` / `d5ac663afdaad34064855423ea674aff6e40976a` / `4ac59a24d6ad6f9594660c4e97eb7e147e79af26`

**Checker / materializer / founder checker:** `2facfea73d44d4edb27d0866336d5846c0639eba` / `8f82687e9ab571c1125556b00be76930ae08fa62` / `c7de3e0cb6f6334a6e31378c28999e87542c12a0`

**Machine SHA-256:** `d69744b686f24877debaa4988102039010a092fa6a1ac9bfdc43d005d410bdcc`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R34. Its removal of result self-addresses, canonical result artifact identity, ninety branch bindings, result-before-history ordering and registry-authoritative replay sources survive. Five executable roots remain:

1. The R32 `authority_operation_historical_response_field_bindings` remains active and omits `result_bytes_sha256`, while newer replay equalities compete with it. One R35 normative mapping must be the sole historical-response binding authority.
2. The identity graph is one conjunctive graph that requires mutually unavailable receipt, hold and session-evidence nodes, then hides that contradiction by filtering edges. R35 must define exact committed, ordinary-held and session-held rule sets and graphs.
3. Committed registry identity must depend only on its final receipt and history. Held registry identity must depend only on its final hold and history. Ordinary held issuance must never require session evidence.
4. Replay paths do not explicitly resolve the exact result artifact between registry or hold resolution and historical-response resolution. Each replay class must select the same original issuance graph and preserve exact source precedence and anti-splice rules.
5. Checker coverage does not reject competing field-binding authority, missing result-byte mapping, singular dependency graphs, unavailable cross-branch dependencies, missing exact result-artifact resolution or reordered replay sources.

No founder choice is required. R35 must close only these binding-authority, branch-graph and replay-path seams, preserve R34 byte-for-byte and keep runtime, database, UI and external action closed.

## R35 repair rationale before review

R34 made result artifacts honest but described mutually exclusive branches as if every branch issued every identity. R35 must make the identity derivation itself discriminated. Each branch class gets a complete rule set, dependency graph and issuance path with no unavailable node and no filtered edge.

Historical response construction must have one active binding authority. Replay must follow the exact original branch class, resolve its authoritative registry or hold row, resolve the exact result artifact, then resolve history and the pre-materialized replay artifacts.

R35 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 35

**Frozen commit/tree:** `73eb2e505671247d1fdfc749ef7707eba64a9401` / `309c2540f6eaf5409fcd9419c4e70ea81221204b`

**Human / machine / QA:** `9ed721ed509da0b3d94a27e6a752660d5fecbc89` / `d5edc9fd47849b308bc18a61ca7e24abf26ac365` / `1442ca099dab556eb054c237c6ce5ea156b25741`

**Checker / materializer / founder checker:** `754a57126a9dbf5e4719b9f4f429954b1332fb46` / `34c9f4caf8a9b81b5705e914f84d7738faabdb74` / `1bc3f2f8682d67774c9f80721dd6525536289140`

**Machine SHA-256:** `319ddcb2f180d0f1b93785df8ec2571c1a7a3bac6a8b1e9f08310049a4ea89a8`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R35. Its one historical-response binding authority, three branch-specific graphs, ordinary-held exclusion of session evidence and result-before-history replay step survive. Six executable roots remain:

1. No exhaustive fresh branch-class selector proves which of the three graphs applies to each operation and result branch. R36 must map all ninety operation-and-result combinations, with fifteen committed, sixty ordinary-held and fifteen session-held rows.
2. The three rule sets still share a generic validated-precommit root whose source inventory includes both receipt and hold material. Each branch class needs its own exact available-source root and explicit forbidden unavailable sources.
3. Replay branch classification is prose. It must bind operation family, held-registry hold schema, session-evidence availability, result branch and exact replay path to the same branch class selected during fresh execution.
4. Replay checks do not yet prove payload materialization precedes envelope materialization in every class, alongside result-before-history.
5. The historical-response binding authority is singular by naming convention only. R36 needs an exhaustive top-level normative authority registry with exact keys, local schema refs and versions, and must reject any unregistered competing authority regardless of its key name.
6. Checker coverage does not yet reject branch-row swaps, an always-committed selector, generic precommit roots, proof-family mismatch, replay-classifier drift, envelope-before-payload order or evasively named competing authority.

No founder choice is required. R36 must close only these selection, exact-source, replay-classification and authority-registry seams, preserve R35 byte-for-byte and keep runtime, database, UI and external action closed.

## R36 repair rationale before review

R35 defined three honest paths but did not define a complete selector that makes exactly one path inevitable. R36 must classify every fresh result and every replay from closed operation, proof-family, branch, hold-schema and session-evidence facts.

Each branch root must name only material that exists in that branch. One top-level registry must make every normative authority explicit and reject any unregistered competitor without relying on a predictable property name.

R36 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 36

**Frozen commit/tree:** `d7a1790536756e2c12b4841b1edebf19d8b3b7bc` / `b5ca1bcc6238d809cf0b01c17a7b032a9f42c70b`

**Human / machine / QA:** `82d725fb2804d77e9566f92e822d4d3b121599a2` / `f6331799468babc833ca6bfdb5f21e656826a3d1` / `b437d96aa7fd3bff0246ec1315b5adad80bbc2a0`

**Checker / materializer / founder checker:** `0c27d2f9da67b773c2afe3161bb53560117fce01` / `66783bbf155199e1294a540992df1d61915aa2fe` / `cb29630aab8de27768467a93c3e8a5685d1ed66f`

**Machine SHA-256:** `dda6415555de50b7cb960f2cc2b809f50e9a55b91eb0e14c62d3920e4a6c2c4f`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R36. Its exhaustive ninety-row selector, exact committed and ordinary roots, durable result-before-history and payload-before-envelope ordering and explicit authority registry direction survive. Six executable roots remain:

1. Session held outcomes are still one class even though stale-head and valid-proof invalid-target holds consume two verified nonces, while authorization, invalid-proof and internal-failure holds must remain raw and non-consuming. R37 must split these into exact verified-consuming and raw-non-consuming classes, evidence schemas and DAGs.
2. Fresh selection identity, proof family, branch class and evidence kind are not persisted in the original registry or hold lineage. Replay can therefore reinterpret old rows through the current selector table instead of reading the exact versioned decision that was committed.
3. Selector, replay-classifier and authority-registry rows have no closed exact schemas. Extra fields, caller overrides, fallback semantics and altered source meanings remain representable.
4. Authority completeness is derived from mutable candidate `normative` flags and a circular expected count. R37 needs an independently declared frozen path, schema, version and hash manifest plus recursive detection of unmanifested authority markers.
5. Replay paths must begin with the correct registry authority and use one exact ordered vocabulary. Source precedence, anti-splice and derivation references must remain mandatory, not descriptive accessories.
6. Checker coverage does not yet reject verified-versus-raw session source confusion, missing durable selection identity, non-closed control rows, caller overrides, nested unmanifested authority or replay vocabulary drift.

No founder choice is required. R37 must close only these session split, durable classification, closed-control, independent-manifest and replay-order seams, preserve R36 byte-for-byte and keep runtime, database, UI and external action closed.

## R37 repair rationale before review

R36 made branch selection exhaustive but treated every session hold as if the same evidence existed. R37 must distinguish verified consuming holds from raw non-consuming holds at selection time and carry that exact decision into immutable registry and hold identity.

Replay must read the committed branch decision, never infer it again from a newer table. Every control row is closed, every normative authority is independently manifested by exact path and hash, and every replay path begins from its durable registry authority.

R37 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 37

**Frozen commit/tree:** `2e9feb68809ff9238490b3a4283ff64ddfc59768` / `f16fa5e8d9ef8cae053989cb853c53fa2c4b68de`

**Human / machine / QA:** `0e58e93def26767078beb293b59d539f77ba8485` / `50a1e34efa3bf87fc352202fd88f83a331766c37` / `f497961b647ab45fda96ce6933ce8fa0a247fed8`

**Checker / materializer / founder checker:** `b9b41fd90300c11c476aa26e4c9e140abc9bb78e` / `cbf55da5c40667a3deed91ee3d9dce5b9db586b5` / `f0be47a00af5afc71887d924ce39710821806e67`

**Machine SHA-256:** `94c3a1838a7331e7687b2f374fb64b7a03cf551ee597b93342e8f9882133eb92`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R37. Its exact ninety-row split, durable selector identity, raw-versus-verified session evidence classes, four acyclic issuance paths and registry-first replay order survive. The shared executable roots are:

1. The five-row authority manifest covers only newly labelled controls. It does not close the inherited proof, operation, outbox, transaction, write-set, evidence, issuance and replay authorities that the R37 paths actually execute. Nested unmarked caller precedence can therefore survive outside its marker scan.
2. Replay registry authority and replay resolution bindings remain on R35 and R34 semantics. They do not bind all five durable selection fields across committed registry, held registry, hold row and classifier, and their source-precedence and anti-splice authority can diverge from the R37 branch map.
3. Exact reproductions still permit caller-supplied proof authority, caller-selected `use_release`, provider-callback outbox authority, two raw-session nonce rows, deletion or swapping of raw and verified evidence references, caller-selected replay authority references and weakening of the recursive scan rule.
4. R37 hashes authority objects with insertion-order `JSON.stringify`. It does not define a domain-separated canonical manifest preimage or close the transitive dependency hash graph, so co-mutated authority and manifest rows are not an independent trust anchor.
5. Prior focused controls are run only against their frozen earlier candidate. R38 must either reapply them to the materialized candidate or prove every unchanged prior core by exact immutable hash.

No founder choice is required. R38 must close only these transitive-authority, replay-binding, execution-control, canonical-hash and prior-core seams, preserve all frozen R6 through R37 artifacts byte-for-byte and keep runtime, database, UI and external action closed.

## R38 repair rationale before review

R37 made the newest branch controls explicit but did not close the full authority graph they depend on. R38 manifests every reachable top-level semantic authority, and each top-level hash covers all nested objects beneath it. Membership is pinned independently from candidate markers, names and counts.

Replay must carry the same five durable selection facts through registry, hold, classifier and binding authority. Proof, operation, outbox, transaction, evidence and issuance controls must remain server-owned, exact and invisible. Canonical manifest hashing and immutable R37 core hashes make semantic co-mutation and insertion-order tricks detectable.

R38 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 38

**Frozen commit/tree:** `a09740b6fb0e65740aae413281f372dc975a9bde` / `bcd807e58788845e0e67ee32dfa4a9966b6c4f4d`

**Human / machine / QA:** `49e083cf88d6217d20761c937681c52861992afe` / `333afb740bb7273318be25b7fdd0117f255e40f7` / `71a068a7fa34c0623ad8b440d392ac52b9b690c9`

**Checker / materializer / founder checker:** `dddf206852f01dce8a5eecbeca621f3a7d2165db` / `eb4b4f3ab3042b63cad637f09f69814224d1cef2` / `d58cd2072b15bb4357c6569ac0dd1ef0fd898a04`

**Machine SHA-256:** `442ff0188b00110bee9e79feb889f5c728b18d31815e7bb8bb0d6b46e0cffb01`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R38. Its expanded authority inventory, canonical top-level hashing, five durable selection facts, exact branch split and preserved R37 core identities survive. Six executable roots remain:

1. Replay bindings target durable-selection fields that do not exist in the replay payload schemas. The safe repair is to bind the authoritative fields from original registry and hold lineage directly into the replay classifier rather than inventing replay-payload fields.
2. Fifteen binding sources are pseudo paths, use `selected_variant` conventions and do not resolve through discriminator-specific schema properties. R39 needs typed source and destination schema refs, variants and declared fields.
3. No executable restart fixture proves reconstruction across committed, ordinary-held, verified-session-held and raw-session-held outcomes, or rejects five-field splicing.
4. The manifest does not independently seal its own envelope, row-schema expectations, enforcement constants, negative fixtures and metadata semantics. Candidate-authored manifest data can therefore weaken the mechanism that claims to seal it.
5. Declared graph and transitive hash preimages do not literally match the fields used to compute them. R39 must close exact domain, version, path, row and dependency inputs under the canonical codec.
6. Lexical dependency inference misses semantic aliases and can leave referenced authorities with an empty dependency set. Every semantic ref needs one explicit manifested owner, with unresolved, multiply owned and caller-owned refs rejected.

No founder choice is required. R39 must close only these executable-binding, restart, manifest-self-sealing, literal-hash and dependency-owner seams, preserve R38 byte-for-byte and keep runtime, database, UI and external action closed.

## R39 repair rationale before review

R38 made authority breadth visible but did not make every replay binding executable or the manifest independently self-sealing. R39 keeps the five durable selection facts in the authoritative original registry and hold lineage, resolves twenty typed discriminator-aware bindings to actual properties and proves all four restart classes with splice rejection.

The manifest envelope, row schema, enforcement constants, negative fixtures and hash contracts are pinned outside candidate data. Every semantic ref resolves through an explicit one-owner map, and every declared hash is recomputed from its literal domain-separated canonical preimage.

R39 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 39

**Frozen commit/tree:** `a1f77e801ad0e69e820c445b99b7083f153e6854` / `7834ee1ea160a0e5be9ba913383de1a606548af9`

**Human / machine / QA:** `be33c81d19225fa88e14886fe4aa285bfecc9899` / `895a6f87a80f2c6715e24f51e9ffcf5fcd025393` / `1757047d970338c088afd4076746d9d8eba8f7c9`

**Checker / materializer / founder checker:** `c2326214d3777fc0f8ca130f4fa6b48919ebe457` / `7b267538e478baa422e4965082285593e7e2f57a` / `9099ab26bfd263d9c924271bf0f7aadee6b01827`

**Machine SHA-256:** `4e97cea81b88da7d712d8e2ab8ee1b80e29a76992a419d2a4ef9d6cc331772c7`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R39. Its twenty executable durable-selection bindings, four branch-class fixtures, self-sealed manifest envelope, literal hash preimages and explicit dependency-owner direction survive. Six executable roots remain:

1. Three inherited replay bindings still use `selected_variant` pseudo-paths: two hold-row sources and one replay-payload fingerprint source. R40 must resolve both hold and both payload variants through exact typed properties.
2. Replay derivation still declares R38 registry and binding-authority versions while referencing R39 objects. Every authority reference and version pair must resolve exactly.
3. The classifier fingerprint uses an undocumented `row` wrapper while its declared preimage describes a different representation. R40 needs one closed wrapper schema and exact independent recomputation.
4. Canonical JSON accepts non-finite numbers, negative zero and unsupported JavaScript values. Strict recursive domain validation must precede every canonicalization and hash.
5. Dependency ownership still ignores unresolved first segments and compound aliases. Every semantic reference occurrence needs an exact source path, literal value and one manifested owner, including operation case, derived and workload predicates.
6. Restart fixtures contain projections rather than stored durable artifacts. R40 must persist canonical registry and hold values, bytes, hashes and fingerprint preimages, then re-resolve and recompute them after simulated restart before classification.

No founder choice is required. R40 must close only these typed-reference, exact-version, fingerprint-preimage, canonical-domain, semantic-owner and durable-restart seams, preserve R39 byte-for-byte and keep runtime, database, UI and external action closed.

## R40 repair rationale before review

R39 closed the newly added durable bindings but did not remove three inherited pseudo-paths or prove restart from actual stored artifacts. R40 makes every replay binding discriminator-aware, binds exact authority versions, gives the classifier one closed fingerprint preimage and rejects every unsupported canonical value before hashing.

Every semantic reference occurrence is now enumerated with one owner and included in transitive authority hashes. Restart reconstructs the original registry and hold records from canonical bytes and independently recomputes their fingerprints before recovering the durable selection.

R40 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 40

**Frozen commit/tree:** `92badf816ce36605aa83f8849d37cdeb4a029af3` / `843a3977ccc65e796ab515cb6821dfbdfe8343b1`

**Human / machine / QA:** `7a3120203e76065b6d426d53dba6aa64945025f7` / `63f6b5222dc7350c2685c6a8ae2fc0d3e97fcd81` / `505d073fdfc1aa405fe880022921c92c97e94db3`

**Checker / materializer / founder checker:** `cb1277704693feeb265809c00ef5eee09f428619` / `76ca5e83b276ed5b189a8385d78d5d58601a4742` / `29e1b10946ee8f85c68f315baf7ee519e49a7234`

**Machine SHA-256:** `74434ed998ef047bc8ee855732688f20d061fd7d3ebd3981993047526cbcd535`

**Adjudication:** `VETO`

Both independent technical reviewers rejected R40. Its discriminator-aware replay bindings, exact authority versions, closed classifier preimage, strict scalar canonical domain, expanded 203-row authority manifest and stored-artifact restart direction survive. Three shared executable roots remain:

1. Validation and hashing still inspect mutable JavaScript objects directly. Accessors, proxies, reflective traps, descriptor changes and source mutation leave a check/use seam. R41 must take one owned immutable snapshot before any validation, hash or semantic use and reject every reflective or unsupported input shape.
2. The restart fixture constructor emits schema-invalid placeholder values for typed enums and exact-literal unions, does not independently validate all seven rows and reuses or fabricates identity values rather than deriving coherent unique row references from a declared preimage.
3. Semantic-reference discovery still relies on suffix and regular-expression inference. It does not independently pin an exact reference-field registry, and compound or wildcard reference forms remain outside literal typed resolution.

The reproduced attacks include a value that changes between validation and use; getter, proxy, throwing-reflection, non-enumerable, symbol, sparse-array, invalid-Unicode and unsupported-value inputs; typed-enum and sentinel-invalid fixture rows; duplicate or fabricated operation and row identities; unresolved compound and wildcard references; and unregistered semantic reference occurrences.

No founder choice is required. R41 must close only these immutable-snapshot, exact-fixture and explicit-reference-registry seams, preserve R40 byte-for-byte and keep runtime, database, UI and external action closed.

## R41 repair rationale before review

R40 rejected unsafe scalar values but did not first sever input ownership from the caller. R41 copies supported input exactly once into owned recursively frozen data before validation, hashing or use.

Restart evidence is now constructed and independently validated against exact selected schemas with coherent unique identities and dependency-ordered row refs, bytes and fingerprints. Semantic references are listed as exact occurrences under a closed explicit registry, and compound or wildcard pseudo-references become discriminator-aware paths to actual declared fields.

R41 changes no visible product behaviour and opens no adapter, database, runtime or external action.

## Review round 41

**Date:** 2026-09-14

**Frozen commit/tree:** `a52ca705f1e0ff4dc2b6354a1b0d4fea64b9c8f9` / `3c4ac97b483e6a1b11670531a04384655944154b`

**Human / machine / QA:** `46edaf251c4afecb088568f6962f3b5ef082cf70` / `e0efc391d87e9b851fc8e96cc8101f9725e45f45` / `906324acc1368e3aa8e6a3571b18589aeb7c43ed`

**Checker / materializer / founder checker:** `f2ff6749f6e7a324148076d294b15ef9a8f63efa` / `95d813d5f19ddb7d449bb4e084bd848d485633f2` / `9ed048bb245ba27a8eb0c1730e91faf4a691e924`

**Machine SHA-256:** `d9631f1a458ec635a594a90066f6efb7a6449bd3840490b54c80b51398e865f2`

**Adjudication:** `VETO`

The defense reviewer and correctness adjudicator independently rejected R41. Their verdicts were delivered through independent reviewer messages. No separate frozen verdict artifact identity was created, so none is implied here. R41's owned snapshot direction, exact schema validation, seven stored registry and hold artifacts, four branch-class restart cases and explicit reference registry survive. Five executable roots remain:

1. Fixture row references still use one fixture-only formula instead of the exact identity preimage declared by each selected authoritative registry or hold schema. A request fingerprint can change while the fixture retains the old row reference.
2. Restart validation checks only a subset of the cross-record lineage. Request, operation, idempotency, selection, result, history, evidence, proof, nonce, registry, payload and envelope facts need one complete equality authority that rejects a cross-row splice even after resealing.
3. Snapshot and canonicalization code still invokes mutable shared intrinsics after capture. Pollution of array iteration, mapping, object-key and JSON methods can change or interrupt check and use.
4. Array and object resources are not bounded before length-sized allocation or traversal. Huge sparse arrays, maximum-length sparse arrays and descriptor traps can consume resources before the intended rejection.
5. The reference field inventory is seeded from the prior candidate's map and misses the wider independently scanned reference universe. The reproduced scan found 1,295 absent categories and occurrences beyond the inherited list.

No founder choice is required. R42 must close only these normative-row-identity, complete-correlation, captured-primordial, resource-bound and independent-reference-universe seams, preserve R41 byte-for-byte and keep runtime, database, UI and external action closed.

## R42 repair rationale before review

R41 established the right ownership boundary but proved some restart facts through fixture conventions rather than the authoritative schemas themselves. R42 derives every stored registry and hold identity from the exact selected schema declaration, then verifies the complete request-to-replay lineage before issue or reconstruction.

Canonical processing now uses captured trusted primitives over a bounded owned snapshot. The independent reference vocabulary scans the complete manifested machine and records 5,236 exact occurrences rather than trusting an inherited map. These controls remain hidden infrastructure for preserving leader-owned truth, correction history and one canonical Brain without adding customer ceremony.

R42 changes no visible product behaviour and opens no adapter, database, runtime or external action.
