# G24 R3 Standards Prosecution

**Run:** `g24-r3-architecture-council-002`

**Role:** History-aware, non-voting Standards Prosecution

**Outcome:** `REPAIR`

The R3 product direction survives. The frozen candidate is not ready for founder lock because three bounded G24.A semantic roots still let conforming implementations choose materially different trust behavior. The three roots are: selector-eligible epistemic judgments lack a current versioned trust binding and live-countercase result; the lifecycle graph is not total and conflates engagement closure with Release authority; and the selector's invalid-input and contradiction behavior disagrees across the blueprint and machine contract.

These are not reasons to redesign the relationship, the five-route planner, the one-question interaction, the prepared-session opportunity, or the single canonical Brain. They are small repairs at the seams R3 was created to close.

## Review contract

- **Standard:** `g24-r3-architecture-recheck-v1`, owner `CTRL permanent council contract`, accepted for this run, fresh 12 September 2026.
- **Submission:** the three R3 artifacts at the frozen hashes below.
- **Mode and independence:** history-aware Pack B and adversarial Pack C cross-examination, intentionally performed only after the sealed Pack A manifest and all declared identities were verified. This is not an eighth sealed specialist pass.
- **Inputs used after freeze verification:** all seven sealed verdicts, all seven durable judge histories, the prior R2 adjudication, and the R1, R2 and R3 architecture artifacts needed to test inheritance and repair closure.
- **Excluded:** conversation history, founder prediction, and unrelated builder commentary were not read.
- **Authority:** this local prosecution record only. No frozen input, history, implementation, ledger, external system or action was changed.
- **Current-fact need:** none. This is a frozen architecture ruling.

## Mechanical verification

**Tool:** PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` over exact file bytes.

Every required expected hash matched the observed hash before substantive review:

| Class | Artifact | Expected and observed SHA-256 |
|---|---|---|
| Standard | `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` |
| Sealed manifest | `runs/g24-r3-architecture-council-002/sealed-verdicts.json` | `e79e4353d85387710ddf8b239ca68a150fbdc155fae68ca4f692fffddd19ee87` |
| R3 submission | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` |
| R3 submission | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` |
| R3 submission | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` |
| Sealed verdict | `human-agency.md` | `5639692a627eb4914aff042cb79551dbeb1ea407d6e2330f8b2d9f970cf02cca` |
| Sealed verdict | `epistemic-integrity.md` | `246e6844e9c25e28fc9ac7dca34d40258795cfe77a687af60dc7f17f8a59d51a` |
| Sealed verdict | `subject-audience-lifecycle-safety.md` | `03f822e43e3fd7e0573836bf93ef4c9b20e32a9f3a906ef871422ebb0fe372aa` |
| Sealed verdict | `consequential-usefulness.md` | `969326d0ce5b3376f638ad77fa20b8948f2fddbec0cbca69dc2f8a8d1d18d258` |
| Sealed verdict | `living-brain-integrity.md` | `543e440a26daf101471e9b516e0f535953fe8f2007df05149a90fa3680f05b39` |
| Sealed verdict | `human-comprehension-and-access.md` | `de65d887231d3106269aa5582ed0f43e55e5953248210883c6eb2b4b1f8fbda6` |
| Sealed verdict | `behavioural-and-implementation-reality.md` | `6276c92ec65342a0f3d6c8184bdbcf1dfcd51b49b95003663fc0575d8eeb858e` |
| Judge history | `judge-history/human-agency.md` | `84e1f9d750b5dff7b144e18f019275a047eae0597eca470675c14f6a9088cd2b` |
| Judge history | `judge-history/epistemic-integrity.md` | `78e81bcc8090baab9569950ec1639ce2568513f6023268ee994d787005538d3c` |
| Judge history | `judge-history/subject-audience-lifecycle-safety.md` | `fc1baa3f5277fba7b3de6e047456445179aad2dee0cf0d0c2d1f1c3e570d9a21` |
| Judge history | `judge-history/consequential-usefulness.md` | `02e5d12ea6c4d05066a89f305a267e2f5c789e078e1de04c7b10d1fb465f1c9e` |
| Judge history | `judge-history/living-brain-integrity.md` | `25e4c84a3352ede838e326a499cafe9e75a4ff037c0c10c2d432e62adf119573` |
| Judge history | `judge-history/human-comprehension-and-access.md` | `a674845dc23be23538a8e8c9ba4b3864282955006d64a03ceba962ccbe11ec79` |
| Judge history | `judge-history/behavioural-and-implementation-reality.md` | `5d55b9e87a8437999e5ee81af02ac7ce453b310a4ea2c4876d53da2e253f1c06` |
| Prior adjudication | `runs/g24-r2-architecture-council-001/adjudication.md` | `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b` |

The R1 blueprint, contract and QA record, and the R2 blueprint, contract, delta and supporting evidence note also matched the hashes inherited by R3.

PowerShell 7.6.5 `ConvertFrom-Json -Depth 100` parsed the input manifest, sealed manifest, R1 contract, R2 contract and delta, and R3 contract and delta without error.

An exact structural inspection of the R3 contract found:

- nine ownership-map entries, nine unique R2 object names, and zero entries declaring a new canonical root;
- five unique selector outputs, exactly `reuse`, `enrich`, `ask`, `session`, and `abstain_hold`;
- literal declarations of `exactly_one_output: true`, total bad-input handling, and `fail_closed_output: "abstain_hold"`;
- two transition `from` values that are not members of the lifecycle state set: `intensive_proof_or_continuing` and `active_or_paused`;
- only one exact outgoing edge from `preparing`, namely `preparing -> intensive_proof`;
- no explicit versioned epistemic-policy reference among inherited controlling references or selector inputs;
- no explicit current countercase or independent-challenger result among selector inputs; and
- all sixteen currently closed external actions still closed.

These checks prove file identity, JSON syntax and literal structure only. Semantic consequences are assessed below.

## Prior R2 repair closure

R3 substantially closes all four R2 roots, but does not finish three seams:

| R2 adjudicated root | R3 result under attack |
|---|---|
| Map all nine R2 objects to R1 and inherit integrity | The ownership map is present and no new canonical root is declared. The surviving gap is narrower: selector-eligible source capability, sufficiency, causal standing, applicability and live countercase do not resolve to a current versioned trusted evaluation authority. |
| Make authority and lifecycle transitions executable | Continuation, pause, intervention approval and answer-to-human-state separation are materially repaired. The graph still uses two undefined group tokens, gives `preparing` no terminal exit, does not name the human authority for reopening, and names a close-only terminal state `released`. |
| Add one total route selector | The owner, inputs, hard precedence, five outputs and invalidation are present. Bad-input prose still permits an undefined provisional result, while valid evidence contradiction is both included in the fail-closed declaration and allowed to seek a resolving route. |
| Preserve one versioned human-facing atom | Repaired at architecture level. Wording, controls, grammar, options, honest exits, effects, visible consequence, watermarks and exact-version approval are bound together. Exact fixtures and observed comprehension remain later proof. |

## Veto reproduction and defense

### EI-V1: trusted epistemic production and live countercase

**Evidence first:**

- `g24-product-system-blueprint-r3.md` lines 55-88 makes `source capability`, provenance independence, sufficiency, causal standing and applicability decision-shaping predicates, but does not bind their production to a current versioned policy or trusted evaluation receipt.
- `g24-product-system-contract-r3.json` `/inherited_integrity/use_specific_semantics` enumerates those predicates.
- `/inherited_integrity/controlling_references` and `/intervention_selector/inputs` contain neither a versioned epistemic-policy reference nor a current live-countercase result.
- `/intervention_selector/trusted_code_validates_references_precedence_and_transition` validates references, precedence and the transition. It does not say that only a trusted evaluation may produce the semantic predicates consumed by those checks.
- R1 names both a governance policy layer and an independent challenger, at `g24-product-system-blueprint.md` lines 252-278, but R3 does not bind either one's current version or result into selector eligibility.

**Strongest defense:** R3 explicitly says effective standing comes from canonical references, a model-authored output cannot upgrade it, a model may only propose a route, and trusted application code owns the final selection. Requiring a complete causal ontology, final source matrix, exact thresholds or a second evidence store now would overreach G24.A.

**Prosecution:** the defense defeats the veto's broadest reading, but not its narrow core. A free model-owned predicate would violate the prose. The unresolved choice is which current, versioned trusted evaluation turns canonical references into selector-eligible `capable`, `sufficient`, `causal`, `applicable` and countercase outcomes. R3 requires a live countercase under the accepted standard, yet the selector need not consume either one or an explicit `none found within <declared boundary>` result. Two implementations can bind different unwatermarked policies to the same canonical evidence and emit different eligible routes while each satisfies the machine fields and trusted-transition checks. That is a current semantic ownership gap.

**Disposition:** `SUSTAINED, NARROWED`. Preserve no demand for a new evidence subsystem or final physical schema. Require one versioned binding to existing R1 governance and challenger authority.

### EI-V2 and BIR-V2: invalid input, contradiction and provisional output

**Evidence first:**

- `g24-product-system-blueprint-r3.md` line 208 says missing, stale, ambiguous, contradictory or invalid input returns `abstain_hold` **or a typed provisional result**.
- The same blueprint at lines 210-212 says a valid evidence conflict may seek the smallest admissible resolving evidence or abstain.
- `g24-product-system-contract-r3.json` `/intervention_selector/outputs`, `/exactly_one_output`, `/total_for_invalid_missing_stale_ambiguous_and_contradictory_input`, and `/fail_closed_output` define only five routes and make `abstain_hold` the fail-closed output. No provisional result type or invalid-versus-unresolved partition exists.

**Strongest defense:** the prior R2 adjudication itself allowed `abstain_hold` or a typed provisional *state*. Read charitably, the provisional object could be a non-actionable diagnostic while a valid contradiction can legitimately select an eligible evidence-resolving route.

**Prosecution:** R3 changed `state` to `result`, did not define it as non-actionable, and did not encode the charitable partition. A missing authority reference and a valid, fully authorised contradiction now share one declared failure bucket even though only the latter may safely produce `enrich`, `ask` or `session`. One implementation can emit a provisional actionable `ask`; another can hold all contradictions; a third can route valid contradictions. Each has frozen text to cite. The accepted standard requires exactly one trusted, total and fail-closed selector. The ambiguity is directly reproducible from the two artifacts.

**Disposition:** `SUSTAINED AND MERGED`. EI-V2 and BIR-V2 are one root, not two repairs.

### SALS-V1: engagement close versus Release authority

**Evidence first:**

- `g24-product-system-blueprint-r3.md` lines 104-106 permits `closing -> released` when the leader accepts a scoped release **or close outcome**.
- `g24-product-system-contract-r3.json` `/lifecycle_policy/states/5`, `/transitions/7`, and `/capability_policy/released` use `released` as the terminal engagement state even when only a close was accepted.
- R1 separately owns canonical `Release` at `g24-product-system-blueprint.md` lines 187-197 and the `Ownership and release` surface at lines 389-395, whose entry is an accepted release request. The matching machine locations are `g24-product-system-contract.json` `/canonical_kernel/6` and `/surfaces/7/entry`.

**Strongest defense:** R1 already makes Release a separate canonical object, actual release is closed at G24.A, and the terminal name could be read as relationship vocabulary rather than authority.

**Prosecution:** the frozen R3 text expressly joins release acceptance and close acceptance with `or`, then gives their shared state the release name. It supplies no invariant that lifecycle state cannot satisfy Release authority. A later compiler can therefore key release eligibility or audit language from `lifecycle_state == released` after a close-only receipt and still claim conformance. The closed action boundary prevents release now, but it does not resolve the architecture meaning that later code will inherit.

**Disposition:** `SUSTAINED AND MERGED WITH THE LIFECYCLE ROOT`.

### BIR-V1: non-total lifecycle graph

**Evidence first:**

- `g24-product-system-contract-r3.json` `/lifecycle_policy/states` does not contain `intensive_proof_or_continuing` or `active_or_paused`, but `/transitions/4/from` and `/transitions/6/from` use those values.
- The only exact `preparing` edge is `preparing -> intensive_proof`.
- `g24-product-system-blueprint-r3.md` lines 96-106 uses the undefined phrase `active or paused`, does not define how abandoned preparation terminates, and describes `released -> preparing` as a new explicit engagement decision without naming its human actor.
- The accepted standard requires lifecycle transitions to name human authority, preconditions, version binding, invalidation and receipts, and requires totality at declared boundaries.

**Strongest defense:** the two strings can be read as compact set expressions rather than state names, and exact physical schemas remain a later gate.

**Prosecution:** neither the JSON shape nor the prose defines a set-expression grammar or its membership. The values occupy the same scalar `from` field as exact states. Implementations may disagree over whether `preparing` counts as active, whether an abandoned preparation can close, and which human may reopen. Those choices determine operational eligibility, retention work and invalidation. They are semantic graph decisions, not physical schema names or runtime proof.

**Disposition:** `SUSTAINED`. Collapse it with SALS-V1 into one exact lifecycle and Release-separation repair.

## Cross-examination of every specialist result

### Human Agency: pass core survives, dependencies narrowed

The answer-to-authority boundary is strong at `g24-product-system-blueprint-r3.md` lines 131-145 and contract `/intervention_authority`: immutable answer evidence, rebuildable case effect and human-owned proposal are separate; a material change invalidates approval; refusal cannot cause pressure; and an answer can carry authority only for the named authority after its exact material effect was visible before commitment.

The pass nevertheless overstates whole-candidate closure. `/lifecycle_policy/transitions/8/authority` is only `new_explicit_engagement_decision`, not a named human authority, and the provisional selector ambiguity can place an intervention into an approval path when controlling authority is invalid. These are not new Human Agency roots. They collapse into the lifecycle and selector repairs below. The durable history supports this narrow treatment: human authority must be an executable capability boundary, but corrupt evidence or unusable routing does not independently redefine the owned Human Agency criterion.

### Epistemic Integrity: veto sustained narrowly

EI-V1 survives only as a trusted, versioned semantic-production and live-countercase binding. EI-V2 merges with BIR-V2. Exact source matrices, causal thresholds, schema names, runtime attacks and efficacy evidence remain G24.B/C or later. The durable history strongly supports the surviving boundary: source capability, subject, claim kind, chronology and meaning must earn trust together, and a receipt cannot upgrade association into causation.

### Subject, Audience and Lifecycle Safety: veto sustained and collapsed

The close/Release failure is exact and current. Its repair belongs with the malformed lifecycle graph, not in a second release subsystem. R3's permission, correction and erasure separation, pre-use invalidation, audience watermarks and no-grant-renewal rules remain protected strengths. Full erasure traversal, export residue and non-recall proof remain later.

### Consequential Usefulness: pass survives

The strongest attack is a conforming-looking selector that fills `expected_material_effect` with “route changed” and counts its own mutation as value. R3 blocks that at lines 175-214 and 254-258 and contract `/question_yield`: the effect is bound to the accepted R1 decision frame, materiality precedes burden, and planner-authored route movement is not sufficient. The missing trusted producer for semantic predicates is the EI root already retained. Concrete high-value and low-value discrimination, competent same-evidence baseline and observed lift are later proofs, not another G24.A veto. This matches the durable history's distinction between exact route consequence and activity.

### Living Brain Integrity: pass core survives, release claim narrowed

The no-shadow-memory result is supported by `/object_map`, `/inherited_integrity/effective_state_from_canonical_references_only`, `/derivative_can_award_standing`, `/public_reuse_by_immutable_reference_only`, and `/private_reasoning_cross_case_reuse`. Answer events cannot silently rewrite durable judgement, and controlling changes invalidate derivatives before use.

The verdict's claim that R3 preserves portable Release without a current defect is too broad because the terminal engagement state is also `released`. That failure is already captured by the lifecycle root. Its standing dependency is also conditional on the EI repair. No additional Brain subsystem or independent veto is justified. Runtime rebuildability, replay/currentness at admission, portable import and erasure residue remain later proof, consistent with the durable history.

### Human Comprehension and Access: pass survives

R3 repairs the current architecture atom at blueprint lines 216-252 and contract `/intervention_atom`. Exact wording, control payload, grammar, complete options or comparator, scoped write-in, bad-premise route, pre-commitment effect, per-answer effect, visible consequence, watermarks and exact-version approval travel together. Closed, ranked and forced formats require `premise_or_options_wrong`. R1 and R2 preserve the leader's decline path and one visible action.

The strongest remaining attack concerns whether “where honestly possible” could omit a useful unknown, defer or refuse control. It does not create a separate G24.A veto on this pack because the architecture already requires honest behavior and a mandatory non-inferential bad-premise route where coercive formats create the risk. Exact fixture coverage must prove the option is actually present and understandable at G24.B/C and G24.D. The durable history supports this split: complete choice semantics are required, while adult or repository evidence cannot prove rendered comprehension.

### Behavioural and Implementation Reality: both vetoes sustained, one merged

BIR-V1 directly reproduces as a referential-integrity failure and a missing preparation terminal. BIR-V2 is the same root as EI-V2. The veto does not justify exact numeric budgets, final arbitration algorithms, provider policy, runtime retries, hidden evaluator implementation or usability proof at G24.A. Durable history supports the limit: a green declaration proves only enumerated invariants, while total boundaries and exact state meaning cannot be left to labels.

## Smallest sufficient root repair set

### Repair 1: bind selector-eligible epistemic outcomes to existing trusted authority

Add one current, versioned R1 governance binding, such as an `epistemic_policy_ref`, to the inherited controlling references, selector inputs, selector output watermarks and invalidation triggers. This is a reference to existing R1 governance, not a new evidence store.

The binding must state that only its trusted evaluation may produce selector-eligible source capability, provenance-independence requirement, sufficiency, applicability, causal standing, contradiction treatment and countercase status. Models may propose evidence and labels but cannot make those outcomes eligible. The selector must consume a current live-countercase result from the existing independent-challenger authority, or an explicit `none_found_within_declared_boundary` result that names its search boundary. Missing, stale, unknown or inapplicable policy or countercase authority returns `abstain_hold`.

Do not lock final physical field names, exhaustive source matrices, numeric thresholds, provider choices or empirical validity here.

**Identical recheck test:** freeze one case with a single source plus two same-root syndications, one scope-mismatched but similar Brain item, one live contradicting assertion, and model-authored `capable`, `sufficient`, `causal` and `applicable` labels. With the policy or current countercase result absent, the only result is `abstain_hold`. With a current policy and challenger result that reject independence or applicability, it remains `abstain_hold`; changing only model confidence or labels cannot change the route. Changing the policy or challenger version invalidates the previous result before use.

### Repair 2: make one exact lifecycle graph and keep Release separate

Replace grouped pseudo-state sources with explicit edges whose `from` and `to` are exact members of the state set. Use `closed`, not `released`, as the terminal engagement state. Enumerate at least:

- `intensive_proof -> paused`;
- `continuing -> paused`;
- `intensive_proof -> closing`;
- `continuing -> closing`;
- `paused -> closing`;
- `closing -> closed`;
- `preparing -> closed` when Krish records cancellation or abandonment of the bounded operator-private preparation, with a matching preparation version and receipt; and
- `closed -> preparing` when Krish opens a new bounded operator-private preparation scope, with a new period version and no revival of old grants. A later `preparing -> intensive_proof` still requires the named leader and relevant Mindmake authority.

Every edge must keep the existing actor, authority, precondition, version match, before/after reference, invalidation and receipt contract. The `preparing -> closed` edge must invalidate prepared and unsent derivatives and leave only required retention, access, correction and deletion work eligible.

Add the explicit invariant that no engagement state, close receipt or commercial transition grants, proves or completes Release/export authority. The existing R1 `Release` object remains the sole owner. A Release requires a separate current, version-matched named-leader request or acceptance bound to the exact projection, purpose, audience and included canonical versions. A controlling identity, permission, audience, validity or source-version change invalidates a pending Release projection before use. Exact traversal and non-recall mechanics stay at the later delivery/data gate.

**Identical recheck test:** parse the state set and edges; require every `from` except `none` and every `to` to be an exact state; reject group tokens; and run every declared edge with matching and stale versions. A preparation-cancel case must reach `closed`, emit its receipt, invalidate prepared and unsent work and allow no decision-shaping operation. A close-only case must reach `closed` while producing zero Release authority and zero eligible Release projection. A separately accepted exact Release projection may become eligible only under its own current authority. Audience narrowing before use invalidates it. No lifecycle state alone may satisfy the Release predicate.

### Repair 3: partition invalid control state from valid unresolved evidence

Remove `or a typed provisional result` as a selectable outcome. Keep exactly the five declared routes.

State identically in blueprint and contract:

1. unknown, missing, mismatched, future-dated, expired or invalid identity, subject, authority, audience, purpose, lifecycle, policy or controlling-version references return exactly `abstain_hold` and cannot create an actionable intervention or derivative;
2. valid canonical references with unresolved evidence contradiction may select `enrich`, `ask` or `session` only when the resolving route passes every earlier eligibility guard and preserves the contradiction in its output; otherwise they return `abstain_hold`; and
3. any provisional information is non-actionable diagnostic metadata on the `abstain_hold` receipt, never a sixth route and never a way around approval invalidation.

**Identical recheck test:** hold the accepted frame constant and mutate one condition at a time: missing subject, mismatched workspace, future source, expired permission, stale frame, invalid lifecycle, missing epistemic policy, valid contradiction with an eligible resolving source, valid contradiction with none, and a model route that conflicts with hard precedence. Require exactly one of the five routes; require `abstain_hold` for every invalid controlling-reference case; permit a resolving route only for the eligible valid-contradiction case; preserve the contradiction; prohibit side effects from provisional diagnostics; and invalidate the result after any controlling watermark change.

## Protected strengths

Every repair and recheck must preserve:

- the R1 bytes, one canonical Brain and no new evidence, permission, answer, engagement or Release root;
- thirty days as an intensive proof window, not a hard product expiry or customer countdown;
- explicit human continuation with no permission renewal through commercial state;
- human-owned purpose, standards, exceptions, judgement, final call and quality;
- decision-specific coverage and material effect, not profile completion, route movement or activity;
- eligible evidence before burden or interruption;
- public fact versus claim, public statement versus private judgement, behavior versus intention, and association versus causation;
- one visible question, fitting natural controls, leader prior, premise rejection, honest exits and visible consequence;
- immutable answer evidence separated from human-owned durable change;
- quiet and `abstain_hold` as successful states;
- prepared sessions only when conversation beats eligible alternatives and with Krish's pull-only control;
- public-only real identities, fictional internal depth and no simulated consent;
- Qualified Judgement Transfer and Question Yield as unproven internal hypotheses;
- headless intelligence proof before material interface polish; and
- all currently closed external actions.

## Later proof, not current veto

Do not enlarge these repairs to include exact tables, final field names, numeric budgets, provider or retry policy, queue limits, runtime performance, exhaustive source matrices, hidden semantic-oracle implementation, exact question copy, rendered comprehension, consented capture, actual delivery, full erasure traversal, clean-room portability, decision-quality lift, customer return, relationship value or willingness to pay. The candidate already assigns those to G24.B/C, G24.D, the first consented data or delivery capability, G24.E, and G24.F/G/H as applicable.

Those later proofs must verify the repaired semantics, not invent them.

## Owner decision and handoff

`REPAIR`

Apply only the three collapsed repairs above, freeze new blueprint, contract and delta hashes, and rerun the same three resolving-test families plus seven fresh isolated specialist reviews and adversarial adjudication. Do not begin the headless Crossing and do not open any external action until no valid G24.A veto remains.

## Ledger proposal

None. No ledger write was authorised.
