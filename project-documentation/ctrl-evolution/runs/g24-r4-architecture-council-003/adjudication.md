# G24 R4 architecture council final adjudication

**Run:** `g24-r4-architecture-council-003`

**Date:** 12 September 2026

**Role:** Final history-aware permanent-panel adjudicator

**Final status:** `BLOCKED_PENDING_REPAIR`

## Decision

The exact frozen R4 candidate is not ready to be placed before Krish for founder lock. One current-gate defect survives adversarial adjudication: a pending Release projection that contains content influenced by a selector result is not required to retain the selector result's independent-challenger dependency, and the explicit Release invalidation list does not name a challenger-result version change. The inherited R1 dependency and repair rules operate only when that dependency has been retained or a covered correction reaches it. They do not make the missing Release dependency unavoidable under the exact R4 text.

This is not a demand for a physical schema, delivery implementation, transaction proof, revocation traversal, residue handling or recall from a customer-held release. Those remain later. The current architecture must first decide the binary semantic rule: a materially changed challenger result invalidates every dependent pending Release projection before use. R4 currently lets two otherwise conforming implementations answer that question differently.

No second current-gate defect was found. The exact lifecycle graph, close and Release separation, five-output selector, invalid-control hold, guarded conflict routes, human-facing intervention atom, human authority and one canonical Brain all survive. The smallest sufficient action is therefore one dependency-propagation repair, not a redesign.

Founder calibration is preserved only as labelled non-voting inference. Its `LIKELY_FOUNDER_ALIGNED` recommendation neither supplies a missing dependency nor overrides this defect. Founder lock, the headless Crossing and every implementation or external action remain closed.

## Review integrity

This was intentionally history-aware final adjudication, not an eighth sealed specialist vote. I first read `cross-examination-brief.md` and `cross-examination-freeze.json`, verified the freeze identity and every hash declared by the freeze and brief, then read the accepted standard, Pack A brief and manifest, all Pack A submissions and dependencies, all seven sealed verdicts, all seven judge histories, the R2 and R3 adjudications, prosecution, defense and founder calibration.

The seven specialist verdicts were treated as immutable evidence. They were not edited, averaged or counted as authority. Prosecution and defense were tested against the frozen standard and candidate, not merged by compromise. Earlier adjudications and judge histories were used as failure history, not authority over changed R4 bytes. Founder calibration was treated as non-voting inference only.

No other agent was consulted. No conversation history, builder commentary, unrecorded founder prediction, earlier prosecution or defense file, or quarantined `docs/history/2026-09-07-md (2).md` was used. Process skills governed review method only and supplied no substantive architecture evidence.

Exactly eight historical theory cards were opened because the required all-criterion challenge materially triggered intervention burden, question comprehension, selector purpose, epistemic standing, stored-context versus learned-judgement, Brain lineage, lifecycle distinction and compounding value. Each was treated as historical advisory theory only. No historical status label or implementation prescription became current authority.

Authority was limited to this adjudication record. No frozen architecture artifact, sealed verdict, judge history, gate state, product state or external system was changed.

## Complete hash verification

Method: PowerShell `Get-FileHash -Algorithm SHA256` over the exact local bytes. Every value declared by `cross-examination-freeze.json` and `cross-examination-brief.md` matched. The freeze file itself matched the separately required SHA-256 `09ff52279851ed0afd8d37714f6e7cc3a2ddcd9065237f791cb43695e443affb`.

### Run controls and adversarial records

| Artifact | Required SHA-256 | Result |
|---|---|---|
| `cross-examination-freeze.json` | `09ff52279851ed0afd8d37714f6e7cc3a2ddcd9065237f791cb43695e443affb` | match |
| `cross-examination-brief.md` | `e7b77bc180726281aaa2e20765d247f058beb1acf449d0cb04f496ed23edfb3c` | match |
| `standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
| `brief.md` | `ce4bc2eb8a28a769684afa72526b9d3e6c2890645621aa0fea5239c9a9fed5e1` | match |
| `input-manifest.json` | `ba748ee84e03c31fc9599a10accd713ba230d30868af324d1c6fec8da2606cc1` | match |
| `sealed-verdicts.json` | `67869c759a68ed7e31745a8c0a9416542ec37016d0509d31ab3eaf2ff4342140` | match |
| `standards-prosecution.md` | `8dea6d24cc2a01f8d6a09ebc773f71b468e30ba20c95763c20e1200bd3ff3fa2` | match |
| `veto-defense.md` | `008e83b2836ec19decf41e4821f84a231ad0b9d17bf5b50ff7ff0bc9ce5c7269` | match |
| `founder-calibration.md` | `2b2b039b48b21c024182414840554d183bcc335adeceb6145f0d87b7a251e66f` | match |

### Frozen Pack A and dependencies

| Set | Artifact | Required SHA-256 | Result |
|---|---|---|---|
| R1 | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| R1 | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| R1 | `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| R2 | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| R2 | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| R2 | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| R2 evidence | `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| R3 | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| R3 | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| R3 | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| R4 | `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| R4 | `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| R4 | `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

### Sealed verdicts and judge histories

| Criterion | Sealed verdict | Verdict SHA-256 | History SHA-256 | Result |
|---|---|---|---|---|
| Human Agency | `PASS_WITH_WATCHPOINTS` | `a3ebd3a597ad46c4680e1d47f123c961ea5854af76c8cc5008914d8583723deb` | `6f0a4afecd52b673b155ae3410f4ddd94b79729bcf1ba49cf84cde657b740c1f` | both match |
| Epistemic Integrity | `PASS_WITH_WATCHPOINTS` | `81aa488556ebf513f8caebea44591f11b34cb97b2cc433a82fafcbec0061beb3` | `b0d14f4f682ac9f619f6537328ba36bd2f45e07bbcd16c20beb53df73db18145` | both match |
| Subject, Audience and Lifecycle Safety | `PASS_WITH_WATCHPOINTS` | `c2e5d34519ccae56fa2ac6c8f769735052aab2eaf6dfdfe10dccb39a2b210cbf` | `e02294cc4e52a0cc30f2b4d2862ea7ddb2ec0f144f3e256ad0693a55dd6a8415` | both match |
| Consequential Usefulness | `PASS_WITH_WATCHPOINTS` | `f53f44653cf34d9210cfcc0f250af1c09181b0e732ec63bf3f3b3c1cff854fc0` | `1333c07c95d2af7528b9a2f21a65791777ce7eccd2684325a3d61560b01a0101` | both match |
| Living Brain Integrity | `PASS_WITH_WATCHPOINTS` | `5371e1497d3e22e2ec8e5af1715d59ca6ebfdf5670a5480ca141a3ea1f8bac7d` | `1ee6c9bb19e4138ca6b6b21f461cd11b4f723d062d02cbc3374d156d317755ef` | both match |
| Human Comprehension and Access | `PASS_WITH_WATCHPOINTS` | `e8417f1c2a993f2c7facd9feee2302e8ac997f6e4dee093a25d74eda661402bd` | `c9226e3c56c876b4d5535e9aaae7d0af2e053b61a44be08b33dc2387575f85dc` | both match |
| Behavioural and Implementation Reality | `PASS_WITH_WATCHPOINTS` | `5110086fb863f817b27427aa9e3a17954b8e721a4deb185b0d5c87518bb11379` | `e7671975d37a167b57b5934f9dc314d762a7587f77967d3040835b6fb9c5e5fa` | both match |

`sealed-verdicts.json` records seven separate `PASS_WITH_WATCHPOINTS` verdicts, zero `PASS`, zero `VETO` and zero `INCONCLUSIVE`. Those values remain untouched. Their agreement is evidence of seven attacks, not a majority rule.

### Prior adjudications

| Record | Required SHA-256 | Result | Use |
|---|---|---|---|
| R2 `adjudication.md` | `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b` | match | failure history only |
| R3 `adjudication.md` | `abe26c55559950c749d1f203444fe0cac452812182646478e546b82ed841829a` | match | failure history and source of the three R4 repair obligations |

All allowlisted JSON records parsed successfully. Deterministic inspection also reproduced six exact R4 lifecycle states, 13 unique exact transition edges, five selector outputs, all seven sealed verdict labels, 16 closed actions, zero opened actions and the Release invalidator asymmetry adjudicated below. These mechanical observations establish identity and literal structure only.

## Historical theory cards used advisory-only

| Card | Observed SHA-256 | Material trigger | Bounded use |
|---|---|---|---|
| `docs/history/2026-09-07-_INTAKE-HARNESS-SPEC.md` | `a0372ba82a04906ac10c0fccac8d9c1e90bba2b88343afa736b22bf250174d77` | intervention burden | Recognition-first input, optional depth and visible payoff pressed the inherited intervention atom. |
| `docs/history/2026-09-07-_INTERROGATION_PROMPT.md` | `850607241dfb31227c13ca8af10273796fe9adc464ec12debb18c1d2fb2bb85e` | sequencing and comprehension | One-question sequencing, preserved input and rationale pressed the customer-facing boundary. |
| `docs/history/2026-09-07-CTRL-DECISIONING-FRAMEWORK.md` | `74ee5bff759aed9b20427f9fe31b42ba6dbbdeb3fa10b1800ffe48ff0faa37cc` | selector purpose and consequential effect | Decision framing, source capability, countercase and human call pressed the value contract. |
| `docs/history/2026-09-07-intel-methodology-critical-thinking.md` | `3fb306aab5443f4feaef0b1f2c4e2b04dab903d1dbdcd3c6f910ebf0e2801803` | epistemic standing | Claim typing, disconfirmation, countercase and evidence-tracking confidence pressed selector eligibility. |
| `docs/history/2026-09-07-intel-methodology-memory-identity.md` | `492a4c439ca36ce973532d250c517bbc4310f6e99476940151f4f3f2ad351094` | stored context versus learned judgement | Cold-versus-loaded testing and correction history pressed no-shadow-Brain claims. |
| `docs/history/2026-09-07-AI Memory Systems for Multi-Agent Architectures  The Canonical Reference (2025-2026).md` | `28e182238af0bfa534f91d8113fb635199560dce90465be4d952949a869d9976` | Brain lineage and temporal validity | Provenance DAG, contradiction and stale-projection pressure informed the dependency challenge only. |
| `docs/history/2026-09-07-intel-data-lifecycle.md` | `f1b6e9870c2c4bfce7494d555f57dc174ef6580a8752f94f4e7ee9df410ce0dc` | lifecycle semantics | Capture, validity, permission, correction, retention and deletion were kept distinct. |
| `docs/history/2026-09-07-app-data-learning.md` | `bf7e2456d90be5dbc8812ede05c9395f60153680e580de784b0ab41b8d33d6be` | compounding value | Stored activity was distinguished from a closed outcome and correction loop. |

These observed card hashes are identification records, not newly frozen authority. The current standard and candidate decide the result.

## Prior failure-class recovery

| Earlier failure class | Current disposition | Exact locators and reason |
|---|---|---|
| R2 shadow ownership and unexplained inheritance | Recovered | R3 contract `/object_map` maps all nine extensions to R1 owners with no new canonical root; `/inherited_integrity` remains active through R4 contract `/normative_precedence/all_other_r3_rules_inherited`. |
| R2 answer-to-authority and continuation ambiguity | Recovered | R3 contract `/intervention_authority` separates immutable answer evidence, rebuildable case effect and pending human-owned proposal. R4 contract `/lifecycle_policy_replacement` fixes actors, preconditions, versions, invalidation and receipts for every edge. |
| R2 selector without a total owner | Recovered | R3 contract `/intervention_selector` retains one trusted owner, hard precedence and exactly five outputs. R4 contract `/selector_policy_replacement` makes invalid control non-actionable `abstain_hold` and confines provisional detail to hold metadata. |
| R2 omitted intervention atom | Recovered | R3 contract `/intervention_atom` remains inherited, including wording, control, complete answer shape, honest exits, disclosed effect and visible consequence in one version. |
| R3 unbound current policy and challenger | Recovered at selector; new downstream gap sustained as P-01 | R4 contract `/epistemic_eligibility_binding` binds and invalidates both versions at selection, but `/release_non_inference/required_binding_before_use` and `/pending_projection_invalidation_triggers` do not carry the challenger dependency. |
| R3 grouped lifecycle, no preparation exit and close-as-Release | Recovered | R4 contract `/lifecycle_policy_replacement` has six exact states and 13 exact edges, including `preparing -> closed`; `/release_non_inference` denies lifecycle and receipt authority over Release. |
| R3 actionable provisional ambiguity | Recovered | R4 contract `/selector_policy_replacement/provisional` denies route standing, intervention, approval, Brain mutation and invalidation bypass. |

## Allegation dispositions

### P-01: a pending Release projection can omit the independent-challenger dependency

**Disposition:** Sustained. Prosecution wins.

**Affected criteria:** Epistemic Integrity, Subject, Audience and Lifecycle Safety, Living Brain Integrity, and Behavioural and Implementation Reality.

**Exact current-gate rule:** `standard.md`, `Gate question`; `Current-gate pass boundary` items 1, 3, 6 and 7; and the four affected owned criteria. A defect vetoes G24.A when a conforming implementer can still make a consequential unsafe or contradictory choice that the architecture must own now.

**Exact locators:**

1. `g24-product-system-blueprint-r4.md:51` makes both policy and challenger versions selector input, output-watermark and invalidation dependencies, and invalidates the selector result when either changes.
2. `g24-product-system-contract-r4.json#/epistemic_eligibility_binding/selector_output_watermarks` contains both `epistemic_policy_version` and `independent_challenger_result_version`.
3. `g24-product-system-contract-r4.json#/epistemic_eligibility_binding/invalidation_triggers` contains both corresponding version-change triggers.
4. `g24-product-system-blueprint-r4.md:109-111` binds Release to projection, purpose, audience and included source and Brain versions, then names identity, permission, audience, validity, policy and included-source changes as pending-projection invalidators. It does not require the challenger dependency.
5. `g24-product-system-contract-r4.json#/release_non_inference/required_binding_before_use` contains `release_projection_version`, `purpose`, `audience`, `included_canonical_source_versions` and `included_canonical_brain_versions`, but no selector result or challenger watermark.
6. `g24-product-system-contract-r4.json#/release_non_inference/pending_projection_invalidation_triggers` includes `epistemic_policy_version_change` but omits `independent_challenger_result_version_change` and any explicit complete dependency-set rule.
7. R1 `g24-product-system-blueprint.md:197`, `:214`, `:225`, `:243-248` and `:353-364` makes Release a verified projection, requires influence lineage, includes evaluations in Release, provides dependency edges and repair receipts, and traverses corrections to affected releases.
8. R3 `g24-product-system-blueprint-r3.md:55-88` requires decision-shaping artifacts to inherit current canonical references and all input watermarks needed to invalidate the artifact, but its explicit cascade at line 86 ends with capsules and unsent delivery projections and predates R4's separate Release amendment.

**Conforming failure path:**

1. Accepted policy `P1` and current challenger result `C1`, bound to decision requirement `D1`, evidence coverage `E1`, trusted cutoff `T1` and `P1`, produce eligible selector result `S1`. `C1` records `none_found_within_declared_boundary`.
2. After a separate current named-leader Release action, a pending projection `R1` is compiled with a decision, evaluation or Brain projection influenced by `S1`. It binds the exact projection, purpose, audience, source versions and Brain versions, satisfying every R4 Release binding expressly listed.
3. Challenger result `C2` supersedes `C1` for the same `D1`, `E1`, `T1` and `P1` and finds a material countercase. Identity, permission, audience, general validity field, policy, source versions and Brain versions remain unchanged.
4. R4 invalidates `S1`. It does not require `R1` to carry `C1` or `S1`, and its explicit pending-Release invalidator list does not necessarily fire. A challenger change need not produce a correction, source change, Brain change or policy change.
5. One implementation traverses the dependency and blocks `R1`; another treats the explicit Release bindings and invalidators as complete and leaves `R1` eligible. Both can claim conformance to the frozen text because the dependency whose traversal would decide the outcome was never required on Release.
6. The second implementation can later use the still-pending projection under otherwise current Release authority even though current challenger evidence rejects or materially contests the standing under which its content was compiled.

**Why the defense loses:** The defense correctly identifies the intended R1 dependency model, but it assumes the missing premise: that every pending Release containing selector-influenced content must have a recorded edge to the complete selector watermark set. R1 line 214 records which releases a durable Brain item influenced, not every evaluation dependency of Release. R1's correction cascade reaches affected releases after a correction, but a new challenger result is not guaranteed to be represented as a correction or to change a canonical source or Brain version. R1's general state-transition watermark rule does not identify the inputs to a Release transition, while R4's explicit Release binding does, and omits the challenger. The generic `validity_change` entry cannot eliminate this ambiguity because R4 separately enumerates the paired policy change but not the challenger change. Treating any challenger update as `validity_change` and treating it as unrelated are both plausible under the written contract. G24.A forbids that choice.

**Current versus later gate:** Current at G24.A is the dependency obligation and fail-closed expected outcome. Later at G24.B/C and the first Release-capable gate are the physical edge or watermark representation, authentic/current version checks, atomic invalidation, race handling, use-time revalidation, receipt storage, delivery side effects, correction successors, revocation traversal, retention, erasure, residue and non-recall behavior.

**Smallest sufficient root repair:**

1. Add one sentence under R4 blueprint `Release non-inference`: "When included content depends on a selector result or trusted epistemic evaluation, the pending Release projection carries that result's complete controlling watermark set, and any change to an included watermark, including the independent-challenger result version, invalidates the projection before use and emits a receipt."
2. Add one matching semantic member to `g24-product-system-contract-r4.json#/release_non_inference/required_binding_before_use`, such as `included_selector_result_versions_and_controlling_watermarks_when_applicable`.
3. Add one matching trigger to `/release_non_inference/pending_projection_invalidation_triggers`, such as `included_selector_controlling_watermark_change`. Prefer the complete dependent-watermark rule over a growing global list. Do not invalidate a projection for an unrelated challenger result outside its lineage.

This repair adds no new Brain, evidence store, policy root, challenger root, Release root, lifecycle state, physical schema, numeric threshold, delivery mechanism or customer surface.

**Identical resolving test:** Freeze a pending Release projection containing content influenced by selector result `S1`, with a separate exact named-leader Release action and fixed identity, purpose, audience, permission, validity, policy, source, assertion, Brain, decision, evidence-coverage and trusted-cutoff versions. First use `C1 = none_found_within_declared_boundary`; only the exact current projection may be eligible. Re-run the identical case changing only the dependent current challenger-result version to `C2 = countercase_found`. The unchanged pending projection must become ineligible before use, emit or require an append-only invalidation receipt and create no external side effect. A rebuild under `C2` may regain eligibility only if current trusted policy resolves the countercase and a new exact projection satisfies the separate Release authority. Run a control projection with no lineage to `C1`; it must remain unaffected by the unrelated change.

At the architecture recheck, the test passes only when blueprint and machine contract state the identical complete-dependent-watermark rule and deterministic inspection finds both the binding and invalidation semantics. The same frozen case is then executed at the later Release-capable runtime gate.

### A-02: a syntactically current policy or challenger can be substantively weak

**Disposition:** Rejected as a current-gate defect. Defense wins. R4 blueprint `Repair 1` and contract `/epistemic_eligibility_binding`, including `/challenger_binding`, `/challenger_results` and `/declared_search_boundary_required_for_none_found`, already fix current ownership, decision-specific binding and fail-closed semantics. Policy authenticity, immutable version storage, exact capability matrices, search-boundary adequacy, trusted-clock checks and evaluator behavior are G24.B/C proof.

### A-03: invalid control can leak through an omitted dimension or force a fabricated hold envelope

**Disposition:** Rejected as a current-gate defect. Defense wins. R3 contract `/intervention_selector/total_for_invalid_missing_stale_ambiguous_and_contradictory_input` remains inherited; R4 contract `/selector_policy_replacement/invalid_controlling_conditions`, `/invalid_controlling_dimensions`, `/invalid_controlling_output`, `/invalid_controlling_creates_actionable_intervention_or_derivative` and `/invalid_controlling_enters_approval_or_delivery` fix the semantic result. A missing accepted frame cannot be fabricated without violating canonical binding and non-actionability. Null, absent or tagged-not-evaluable physical fields are G24.B/C schema choices.

### A-04: valid unresolved evidence can be mistaken for permission or a sixth route

**Disposition:** Rejected as a current-gate defect. Defense wins. R4 blueprint `Valid unresolved evidence` and `Provisional diagnostics`, with contract `/selector_policy_replacement/valid_unresolved_evidence` and `/provisional`, allow only `enrich`, `ask` or `session` after every prior guard, require unresolved references to remain, and deny provisional route standing, approval, Brain change and invalidation bypass. Semantic-oracle and runtime side-effect proof remain G24.B/C.

### A-05: the lifecycle can strand preparation, infer edges or silently reactivate authority

**Disposition:** Rejected as a current-gate defect. Defense wins. R4 blueprint `Universal transition envelope`, `Exact transition graph` and `Closed-state capability`, with contract `/lifecycle_policy_replacement/states`, `/transition_envelope`, `/transitions`, `/grouped_or_implicit_edges_allowed`, `/absence_of_receipt_changes_state`, `/stale_or_invalid_transition`, `/commercial_state_grants_permission` and `/reopen_revives_expired_authority`, own the six states and 13 permitted edges. Atomic non-existence checks, compare-and-set, idempotency races and delayed-work cancellation are later implementation proof.

### A-06: close, payment or engagement state can infer Release authority

**Disposition:** Rejected as a separate current defect. Defense wins. R4 blueprint `Release non-inference` and contract `/release_non_inference/owner`, `/engagement_state_grants_proves_or_completes_release`, `/close_receipt_grants_proves_or_completes_release`, `/release_entry`, `/close_without_release_allowed` and `/release_closes_engagement` expressly close the authority inference. P-01 concerns validity dependency after separate authority exists, not lifecycle-derived authority.

### A-07: an answer can silently mutate human-owned state

**Disposition:** Rejected as a current-gate defect. Defense wins. R3 contract `/intervention_authority/answer_effect_layers`, `/human_owned_changes_require_named_authority`, `/answer_can_be_authority_event_only_if`, `/krish_transitions_before_delivery`, `/material_edit_invalidates_approval` and `/honest_exit_effect` remain inherited through R4. Exact rendered recognition of the effect and real refusal behavior remain G24.D proof.

### A-08: a generic material-effect string can masquerade as consequential value

**Disposition:** Rejected as a current-gate defect. Defense wins. R2 blueprint `The decision evidence map` and `Question Intelligence: Eligibility`, R2 contract `/decision_evidence_map` and `/question_intelligence/eligibility_effects`, and R3 contract `/intervention_selector/hard_precedence`, `/output_fields`, `/binds_to_r1_decision_frame_not_new_value_root` and `/question_yield/planner_authored_route_mutation_is_sufficient` require a decision-specific material effect and reject route churn as value. Hidden semantic fixtures, high-value and low-value discrimination, a competent baseline and observed lift remain later.

### A-09: stored context, model output or lifecycle receipts can create a shadow Brain

**Disposition:** Rejected as a separate current defect. Defense wins. R1 blueprint `Canonical kernel`, `Brain-item standing`, `Runtime and storage` and `Learning, correction and self-healing`, R3 contract `/object_map` and `/inherited_integrity`, and R4 contract `/normative_precedence` preserve one canonical Brain and deny derivative self-promotion. P-01 is the one recovered downstream lineage gap; no second root or private cross-case path was found.

### A-10: exact receipts can be decorative while runtime remains unsafe

**Disposition:** Rejected as a current-gate defect. Defense wins. The written before/after versions, authority, invalidation, idempotency, capability and no-side-effect semantics are already normative at R1 `g24-product-system-blueprint.md:248`, R4 blueprint `Universal transition envelope`, and R4 contract `/lifecycle_policy_replacement` and `/selector_policy_replacement`. Actual atomicity, concurrent schedules, malformed inputs, hidden safe-novel cases and independent state-diff evidence remain G24.B/C. A polished receipt is not proof, but absent runtime proof is not a present architecture break.

### A-11: rendered comprehension, accessibility and failure recovery are missing

**Disposition:** Rejected as a current-gate defect. Defense wins. R2 contract `/experience_intelligence` and `/question_intelligence`, inherited R3 contract `/intervention_atom`, and R4 protected strengths preserve one bounded question or action, natural control, honest exits, visible consequence and hidden machinery. Exact copy, fresh-participant comprehension, one-handed mobile use, keyboard and screen-reader behavior, contrast, zoom/reflow, voice alternatives and failed-save recovery remain G24.D/E.

### A-12: decision lift, compounding value and commercial efficacy are unproven

**Disposition:** Rejected as a current-gate defect. Defense wins. R3 blueprint `Proof carried forward, not falsely claimed now` and contract `/later_gate_requirements` explicitly reserve competent-baseline comparison, independently observed material effect, decision-quality lift, customer return, Qualified Judgement Transfer, continuation value and willingness to pay. R4 claims none of them now.

### A-13: Release execution, revocation, erasure and residue are unspecified

**Disposition:** Rejected as a current-gate defect. Defense wins. Release remains closed at R4 contract `/authority/closed`, and R4 blueprint line 111 explicitly leaves exact delivery, revocation traversal, residue and non-recall behavior to the named later gate. P-01 supplies the missing expected semantic result; it does not pull those mechanics forward.

## Criterion-level final findings

| Criterion | Final finding | Reason |
|---|---|---|
| Human Agency | holds | Policy, selector, answer, lifecycle and Release authority cannot silently become the leader's purpose, standards, exception or final call. P-01 does not transfer Release authority or the final call. |
| Epistemic Integrity | breaks through P-01 | Current challenger standing can invalidate a selector result while a dependent pending Release remains eligible under one conforming reading. |
| Subject, Audience and Lifecycle Safety | breaks through P-01 | Subject, audience, purpose and named Release authority may remain valid while epistemic validity materially changes and is not guaranteed to invalidate the pending projection. |
| Consequential Usefulness | holds | Decision frame, load-bearing variable, material effect, stop rule and non-activity value semantics remain explicit; actual lift is later proof. |
| Living Brain Integrity | breaks through P-01 | A downstream portable projection can outlive a controlling evaluation unless the missing dependency is guaranteed. The one-Brain and correction core otherwise holds. |
| Human Comprehension and Access | holds at G24.A | The exact semantic intervention atom and hidden-machinery boundary remain intact; rendered proof stays later. |
| Behavioural and Implementation Reality | breaks through P-01 | The explicit Release list permits opposite expected outcomes for a challenger-only change. Physical propagation remains later, but the expected result must be locked now. |

These are four criterion consequences of one root defect, not four independent repairs.

## Protected strengths

The repair and recheck must preserve all of the following without qualification:

- one canonical Brain and no new evidence, policy, challenger, permission, answer, engagement or Release root;
- all nine R2 object mappings to existing R1 owners;
- human-owned purpose, standards, exceptions, judgement, final call, final quality and Release authority;
- immutable answer evidence separated from rebuildable case effects and human-owned proposals;
- thirty days as the current intensive proof window, not a hard expiry or countdown;
- explicit two-human continuation without commercial permission renewal;
- the exact six-state, 13-edge engagement graph, safe `preparing -> closed`, no grouped or implied edge, and no old-grant revival;
- engagement close and portable Release as separate acts, with close without Release and Release without lifecycle closure both valid;
- current policy and independent-challenger binding at selector eligibility;
- common-root collapse, causal restraint, contradiction preservation and no model self-awarded standing;
- exactly one selector result from `reuse`, `enrich`, `ask`, `session` or `abstain_hold`;
- invalid control routed only to non-actionable hold, guarded valid-conflict resolution and provisional detail confined to hold metadata;
- the exact versioned human-facing intervention atom, one visible question, natural controls, premise rejection, non-punitive exits and truthful visible consequence;
- decision-specific material effect, quiet and abstention rather than profile completion or activity theatre;
- Krish's pull-only control over session opportunities;
- public-only real identities and fictional internal depth in tests;
- Qualified Judgement Transfer and Question Yield as unproven internal hypotheses;
- policy and lifecycle machinery hidden from the customer;
- headless intelligence proof before material interface polish; and
- every currently closed external action.

## Later proof preserved

| Gate | Required proof that remains later |
|---|---|
| G24.B/C | Exact schemas and validators; policy and challenger authenticity/currentness; trusted-clock, source-root, subject, audience, causal, cross-case and contradiction attacks; hidden semantic oracles; safe-novel and malformed cases; hold-envelope representation; all conflict routes; lifecycle compare-and-set and idempotency; queued-work cancellation; atomic dependency traversal; independent state and side-effect inventories; bounded slow, failed, duplicate and stale execution; high-value and low-value cases against a competent same-evidence baseline. |
| G24.D | Exact semantic question fixtures; fresh-participant comprehension; child-level language without childish reasoning; one-question and one-handed mobile use; progressive disclosure; premise rejection; effect comprehension; accessibility; failed-save recovery; operator queue legibility and clerical load. |
| First consented capture or customer-data gate | Sensitive-purpose disclosure; participant and modality permission; multi-speaker handling; withdrawal; real-data subject and audience enforcement. |
| G24.E and first Release-capable gate | Complete stateful slice; executed P-01 fixture; atomic use-time Release revalidation; zero side effects on invalidation; correction successors; deterministic portable import; retention, erasure, residue and non-recall behavior. |
| G24.F/G | Founder and assisted-pilot proof of specific value, session usefulness, decision-quality lift, continued relationship value, customer return, longitudinal learning, Qualified Judgement Transfer and willingness to pay. |
| G24.H | Capability-by-capability cutover, zero legacy readers and writers, retention and DSAR proof, rollback window and founder Release approval. |

No later proof is treated as passed by this adjudication.

## Closed actions

R4 contract `/authority/closed` continues to close all 16 actions:

- `production_write`;
- `customer_data`;
- `account_creation`;
- `external_research_run`;
- `model_spend`;
- `email_send`;
- `customer_contact`;
- `session_scheduling`;
- `session_capture`;
- `connector_creation`;
- `database_branch_creation`;
- `deployment`;
- `merge`;
- `feature_enablement`;
- `release`; and
- `legacy_backend_deletion`.

R4 delta `/external_actions_opened` remains `[]`. This adjudication opens none of them and grants no founder lock, implementation, Release or external-action authority.

## Precise next action

Hold founder lock and the headless Crossing on the exact R4 hashes. Apply only the P-01 complete-dependent-watermark repair to a new blueprint, machine contract and delta while preserving every protected strength and closed action above. Freeze the new bytes, run deterministic inspection for identical blueprint and contract dependency semantics, and execute the identical semantic resolving test at the appropriate staged proof boundary. Then obtain seven fresh isolated sealed specialist verdicts, followed by fresh non-voting prosecution, defense, founder calibration and final adjudication. The current seven verdicts remain immutable history and cannot certify changed bytes.
