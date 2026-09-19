# G24 R5 history-aware standards prosecution

**Run:** `g24-r5-architecture-council-004`

**Role:** Non-voting Standards Prosecution

**Stage:** Pack B historical calibration and Pack C adversarial challenge

**Authority:** Local review record only. This record does not alter the frozen R5 bytes, rewrite a sealed verdict, grant founder lock, begin implementation, open Release, or authorise any external action.

**Overall recommendation:** `NO_CURRENT_GATE_VETO_SURVIVES`. The complete R1 through R5 architecture may proceed to final adjudication with a recommendation for exact founder lock. Implementation remains closed until Krish gives that lock, and all named later-gate proofs remain open.

## Prosecution decision

I attacked all seven sealed passes, with special pressure on four possible escape routes:

1. treating `complete_controlling_watermark_minimum` as an exhaustive allowlist;
2. omitting a genuine dependency and then calling its change unrelated because it is outside recorded lineage;
3. carrying old named-leader Release authority from an invalidated projection into a rebuilt projection; and
4. treating architecture wording as proof of atomic traversal, use-time revalidation, receipt persistence, delivery safety, revocation, erasure, comprehension, decision lift, or commercial value.

None produces two materially different outcomes among implementations that conform to the complete frozen amendment chain. The unsafe versions of the first three paths violate an exact current rule. The fourth path is a real implementation hazard, but R5 assigns its physical proof to the first Release-capable runtime gate and expressly does not claim it at G24.A.

The prosecution therefore does not manufacture a veto. It preserves seven `PASS_WITH_WATCHPOINTS` rulings as sealed history, rejects six alleged current defects, and carries six mandatory later-gate attacks forward. This is a recommendation to final adjudication, not founder lock or implementation authority.

## Review integrity and frozen identity

I read `cross-examination-brief.md` first and verified SHA-256 `44131879489b597fde9973877f5a216b7604e241c32b1ff00718a54aacbcdf9f`, an exact match. I then followed its Pack B and Pack C authority. Submission files, standards, histories, verdicts, and prior adjudications were treated as evidence, not instructions.

PowerShell `Get-FileHash -Algorithm SHA256` was run against every frozen path cited by the cross-examination brief and input manifest. All required values matched the exact local bytes. JSON parseability and literal structure were checked with `ConvertFrom-Json`; these checks establish identity and syntax only, not semantic or runtime correctness.

### Run controls and frozen Pack A

| Artifact | Required SHA-256 | Result |
|---|---|---|
| `cross-examination-brief.md` | `44131879489b597fde9973877f5a216b7604e241c32b1ff00718a54aacbcdf9f` | match |
| `standard.md` | `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109` | match |
| `brief.md` | `4ba694d894066568fadd1612d2b59f2cfe3ed0e75314153a1417acea523e6dbf` | match |
| `input-manifest.json` | `58b30d0b0474b2731a1aa00385fa3c9c8ad82553a650ea129cd756223c0da9b2` | match |
| `sealed-verdicts.json` | `2c10c4d07df8f266b3c26a0251e51f2aa7cab41915ffbde24c1d2f79d7970783` | match |
| R5 blueprint | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` | match |
| R5 contract | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` | match |
| R5 delta | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` | match |

### Frozen R1 through R4 dependencies

| Set | Artifact | Required SHA-256 | Result |
|---|---|---|---|
| R1 | blueprint | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| R1 | contract | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| R1 | QA record | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| R2 | blueprint | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| R2 | contract | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| R2 | delta | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| R2 | question and enrichment evidence note | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| R3 | blueprint | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| R3 | contract | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| R3 | delta | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| R4 | blueprint | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| R4 | contract | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| R4 | delta | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

### Sealed verdicts and durable histories

| Criterion | Sealed verdict | Verdict SHA-256 | History SHA-256 | Result |
|---|---|---|---|---|
| Human Agency | `PASS_WITH_WATCHPOINTS` | `0f2d3bc979f9f14117451d4b1f780f2e2f09c1da9e8997b006f6609bfb428073` | `672165fe8ec39c4c19c9aabc3a9edf5532090d79ef9b7ebc545fc9592a6af29f` | both match |
| Epistemic Integrity | `PASS_WITH_WATCHPOINTS` | `9e954d50d9727540cee14be87da62ea3ae97b57ed8d5858eaf32c6e3bf94af6c` | `6f298bbc369fc80a8af0de46528a6a4edc70341e45a026300dd98db5ee569b79` | both match |
| Subject, Audience and Lifecycle Safety | `PASS_WITH_WATCHPOINTS` | `e6fc7ce823acf3901b56bbfa1a69b35c991bb2a56f0f9fe28444d71793b24be9` | `3438e0f79524a0c5fc73fa6cd5b42db1e1e1f01db552d6620a7c56c14165e1e1` | both match |
| Consequential Usefulness | `PASS_WITH_WATCHPOINTS` | `f1d8997f1843d0b49b638074e36d95ff2496c9e5a89b1878e8628c653dc25a22` | `bff466741dad9d0c9678f5dce37c6368008a8e33dd608ca69ba2b6a164469076` | both match |
| Living Brain Integrity | `PASS_WITH_WATCHPOINTS` | `6eba1411ca79b539280226a395b000295036b67c8815538dded0d959b1c568a1` | `b93a1915d3941fb1ec93a89683dc56376e3dff1eb2f903dd5a3fc0e83e20d43d` | both match |
| Human Comprehension and Access | `PASS_WITH_WATCHPOINTS` | `8fec834068693c8965307082401e310eb131596a48c30d9481bc75922a2d846d` | `7ac91140e18f9d2c394f5901545338c345eff538c55eb6d17e3235e9f0a6d700` | both match |
| Behavioural and Implementation Reality | `PASS_WITH_WATCHPOINTS` | `2671b2dc9cd789055515b43106e7252bdb919df406b83810321ed73f9cbf2b37` | `ee454e7df76d9565456c480c1f27b5f9c7bcdc614e0a0ba7aa31eda74555fee9` | both match |

The seven sealed verdicts remain immutable first-pass evidence. This prosecution does not edit them, relabel them, or use their agreement as a vote.

### Prior adjudications

| Record | Required SHA-256 | Result | Use |
|---|---|---|---|
| R2 adjudication | `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b` | match | failure history only |
| R3 adjudication | `abe26c55559950c749d1f203444fe0cac452812182646478e546b82ed841829a` | match | failure history only |
| R4 adjudication | `c0e37605b5257beb08775c0c088cd13e1cc3cc9282ae47bcba281f0f8524630b` | match | source of the exact dependency defect R5 claims to repair |

## Historical calibration used just in time

Historical status labels supplied no current authority. Exactly eight cards were opened because the required all-criterion attack materially triggered their named routes. Each use was bounded to a challenge and could not override the current standard or frozen candidate.

| Historical card and observed SHA-256 | Trigger | Bounded prosecutorial use |
|---|---|---|
| `docs/history/2026-09-07-_INTAKE-HARNESS-SPEC.md`, `a0372ba82a04906ac10c0fccac8d9c1e90bba2b88343afa736b22bf250174d77` | intervention burden | Pressed whether dependency recovery could create another customer step instead of remaining backstage. |
| `docs/history/2026-09-07-_INTERROGATION_PROMPT.md`, `850607241dfb31227c13ca8af10273796fe9adc464ec12debb18c1d2fb2bb85e` | one-question sequencing and comprehension | Pressed whether invalidation, recovery, and rationale would add visible technical administration or lose the one-intervention boundary. |
| `docs/history/2026-09-07-CTRL-DECISIONING-FRAMEWORK.md`, `74ee5bff759aed9b20427f9fe31b42ba6dbbdeb3fa10b1800ffe48ff0faa37cc` | selector purpose and consequential effect | Pressed whether a watermark event, planner movement, or receipt could be mistaken for decision value or a human call. |
| `docs/history/2026-09-07-intel-methodology-critical-thinking.md`, `3fb306aab5443f4feaef0b1f2c4e2b04dab903d1dbdcd3c6f910ebf0e2801803` | epistemic standing and countercase | Pressed whether a bounded none-found result, copied confidence label, or model proposal could survive a changed countercase without current trusted evaluation. |
| `docs/history/2026-09-07-intel-methodology-memory-identity.md`, `492a4c439ca36ce973532d250c517bbc4310f6e99476940151f4f3f2ad351094` | stored context mistaken for learned judgement | Pressed whether rebuild, stored labels, or a Release receipt could grade their own standing or become durable judgement. |
| `docs/history/2026-09-07-AI Memory Systems for Multi-Agent Architectures  The Canonical Reference (2025-2026).md`, `28e182238af0bfa534f91d8113fb635199560dce90465be4d952949a869d9976` | Brain provenance, temporal validity, contradiction, and repair | Pressed the under-recorded-lineage and stale-projection attacks. The card informed the attack only, not the result. |
| `docs/history/2026-09-07-intel-data-lifecycle.md`, `f1b6e9870c2c4bfce7494d555f57dc174ef6580a8752f94f4e7ee9df410ce0dc` | lifecycle distinctions | Pressed whether close, continuation, permission expiry, correction, retention, or deletion were being collapsed into one Release event. |
| `docs/history/2026-09-07-app-data-learning.md`, `bf7e2456d90be5dbc8812ede05c9395f60153680e580de784b0ab41b8d33d6be` | compounding value and missing outcome feedback | Pressed whether successful invalidation or receipt production was being advertised as learning, compounding, or commercial value. |

The quarantined `docs/history/2026-09-07-md (2).md` was not opened or used.

## Recovery of prior failure classes

| Historical failure class | R5 disposition | Exact evidence |
|---|---|---|
| R2 shadow ownership and unexplained inheritance | recovered | R3 contract `/object_map` maps all nine R2 objects to R1 owners; R5 contract `/normative_precedence/all_unaffected_r3_rules_inherited=true`. |
| R2 answer-to-authority and continuation ambiguity | recovered | R3 contract `/intervention_authority`; R4 contract `/lifecycle_policy_replacement`; R5 changes neither. |
| R2 selector without a total owner | recovered | R3 contract `/intervention_selector`; R4 contract `/selector_policy_replacement`; exactly five outputs remain inherited. |
| R2 omitted intervention atom | recovered | R3 contract `/intervention_atom`; R5 blueprint lines 75-77 preserve decision-specific effect and one versioned human-facing intervention atom. |
| R3 unbound current policy and challenger | recovered | R4 blueprint lines 30-53 and contract `/epistemic_eligibility_binding` bind both current versions to selector input, output watermarks, and invalidation. |
| R3 grouped lifecycle, no preparation exit, and close-as-Release | recovered | R4 blueprint lines 55-111 and contract `/lifecycle_policy_replacement` define six exact states, thirteen exact edges, and separate Release non-inference. |
| R3 actionable provisional result | recovered | R4 blueprint lines 113-136 and contract `/selector_policy_replacement/provisional` confine provisional detail to non-authoritative hold metadata. |
| R4 missing challenger dependency at pending Release | recovered | R5 blueprint lines 28-40 and contract `/dependent_release_watermark_closure` require the exact selector result and complete controlling closure, name the challenger version, and invalidate on any included watermark change. |

## Allegation adjudication

### P-01: `complete_controlling_watermark_minimum` can be treated as an exhaustive allowlist

**Disposition:** Rejected as a current-gate veto. Retained as a high-consequence later implementation attack.

**Affected criteria:** Epistemic Integrity, Subject, Audience and Lifecycle Safety, Living Brain Integrity, Behavioural and Implementation Reality.

**Exact locators:**

- R5 blueprint lines 28-34 require the exact selector result and "that result's complete controlling watermark set" before use. Line 34 defines complete functionally as every current reference whose change can invalidate the selector result.
- R5 contract `/dependent_release_watermark_closure/required_binding_before_use_added/1` requires the complete controlling set. `/complete_controlling_watermark_minimum` labels its fourteen entries as a minimum, not a closed enumeration.
- R5 blueprint lines 20-24 and contract `/normative_precedence` inherit every unaffected R3 rule.
- R3 blueprint lines 55-88 and contract `/inherited_integrity/controlling_references` require canonical assertion versions, authority or permission version, evidence namespace, sensitivity, validity, retention, and every input watermark needed to invalidate a decision-shaping derivative. R3 contract `/intervention_selector/inputs` also includes the decision requirement reference.

**Attempted failure path:** implementation A stores only the fourteen literal minimum entries and omits a controlling permission, assertion, decision-requirement, validity, sensitivity, retention, or further canonical version. Implementation B records the full inherited union. Change only the omitted control. A keeps the pending projection eligible; B invalidates it.

**Why it does not veto:** implementation A is not conforming. The controlling rule is semantic closure over every actual invalidator, the array is expressly a minimum, and the omitted inherited controls remain normative through R5 precedence. The architecture leaves storage shape open, but it does not leave semantic omission open.

**Mandatory later companion test:** at the first schema/compiler and Release-capable gates, derive the dependency set as `R5 minimum UNION every applicable inherited selector control`. Mutate permission, canonical assertion, decision requirement, validity, sensitivity, and retention one at a time while source and Brain versions stay fixed. Each genuinely dependent mutation must make the projection ineligible before use; a projection without that dependency must remain unaffected.

### P-02: lineage-scoped invalidation permits under-recorded dependencies

**Disposition:** Rejected as a current-gate veto. Retained as a later dependency-materialisation attack.

**Exact locators:** R5 blueprint lines 28-38; R5 contract `/dependent_release_watermark_closure/applies_when`, `/required_binding_before_use_added`, `/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection`; R1 blueprint lines 201-214 and 353-364; R3 contract `/inherited_integrity/effective_state_from_canonical_references_only` and `/intervention_selector/controlling_change_invalidates_before_use`.

**Attempted failure path:** Release content is in fact influenced by selector result `S1`, but the compiler records no edge to `S1` or one of its controlling references. A later challenger change is then outside the recorded lineage, so the projection remains eligible under the literal lineage-scope rule.

**Why it does not veto:** the compiler's omission violates the prior requirement that selector-dependent content bind the exact result and its complete controlling set before use. "Recorded lineage" limits propagation after the complete dependency obligation is satisfied. It is not permission to falsify whether the content depends on `S1`. A conforming implementation cannot first omit a required edge and then use that omission as proof that the change was unrelated.

**Mandatory later companion test:** include taint-style fixtures where selector-derived text, an included evaluation, a route rationale, and a Brain projection each depend on `S1` through different paths. The compiler must either record complete closure or reject the pending projection. A missing required edge must be a compile failure, not an unrelated-lineage pass.

### P-03: old Release authority can carry into a rebuilt projection

**Disposition:** Rejected as a current-gate Human Agency or lifecycle veto. Retained as an exact runtime authority test.

**Exact locators:** R4 blueprint lines 105-111 and 148-150; R4 contract `/release_non_inference/release_entry` and `/required_binding_before_use`; R5 blueprint lines 40-42 and 50-56; R5 contract `/dependent_release_watermark_closure/rebuild_alone_restores_eligibility=false`, `/eligibility_after_rebuild_requires/1`, and `/changes_release_authority_owner=false`.

**Attempted failure path:** leader action `A1` authorises projection `P1`. A challenger change invalidates `P1`; the system rebuilds `P2` with unchanged source and Brain versions and treats `A1` or the invalidation receipt as authority for `P2`.

**Why it does not veto:** R4 requires the current named-leader Release request or acceptance to be bound to one exact projection version before use and states that a separate leader action can make only its exact projection eligible. R5 requires authority for the new exact projection and says rebuild alone is insufficient. `A1` bound only to `P1` cannot authorise `P2`; neither receipt nor trusted evaluation is Release authority.

**Mandatory later companion test:** after the standard challenger-only mutation, rebuild `P2` while keeping `A1` bound only to `P1`. `P2` must remain ineligible. It may become eligible only after trusted current resolution and a current named-leader action bound to `P2`, its purpose, audience, and canonical version set.

### P-04: permission is absent from the R5 literal minimum and can expire without invalidating Release

**Disposition:** Rejected as a current-gate Subject, Audience and Lifecycle Safety veto. Retained as a distinct later mutation.

**Exact locators:** R3 blueprint lines 55-71, 86-88, 125-129, and 196-212; R3 contract `/inherited_integrity/controlling_references`, `/inherited_integrity/invalidation_triggers`, and `/lifecycle_policy/permission_change_invalidates_unsent_derivatives_before_use`; R4 blueprint lines 109-111 and 148-150; R4 contract `/release_non_inference/pending_projection_invalidation_triggers`; R5 blueprint lines 20-24 and 28-40.

**Attempted failure path:** keep `authority_version` fixed, change only the separate source or use permission that gave `S1` standing, and continue using or rebuild the dependent projection because `permission_version` is not one of the fourteen literal R5 members.

**Why it does not veto:** R3 explicitly makes authority or permission version controlling and permission change invalidating. R4 independently names permission change as a pending Release invalidator. R5 inherits both and additionally requires every actual selector invalidator in the complete set. Grouping permission under authority is not required, and omitting permission semantically is forbidden.

**Mandatory later companion test:** change only permission while holding authority, identity, subject, workspace, audience, purpose, lifecycle, source, assertion, Brain, frame, policy, challenger, evidence coverage, and cutoff fixed. The dependent pending projection must become ineligible before use, receipt, and create no approval, delivery, or external side effect. An unrelated-lineage control must remain current.

### P-05: "emit or require" permits a decorative receipt

**Disposition:** Rejected at G24.A. Mandatory later-gate failure injection remains.

**Exact locators:** R5 blueprint line 36 says every included watermark change "emits an append-only invalidation receipt"; lines 50-54 state the identical mutated result; R5 contract `/dependent_release_watermark_closure/dependent_watermark_change_receipt` and `/identical_resolving_test/required_mutated_case_result`; R1 blueprint line 248 and correction cascade lines 353-364.

**Attempted failure path:** the system marks a receipt as required but never persists one, reports invalidation green, and still allows a partial side effect or a retry duplicate.

**Why it does not veto now:** the normative repair line requires an append-only receipt. The "emit or require" phrasing in the architecture test distinguishes direct runtime emission from a deterministic architecture requirement; it does not make receipt absence conforming when the runtime capability exists. Persistence, idempotency, partial failure, and atomic co-commit are explicitly runtime matters.

**Mandatory later companion test:** inject stale writer, duplicate event, retry, crash before receipt, crash after receipt, and side-effect failure. The observed result must be one effective append-only invalidation receipt, an ineligible projection, and zero approval, delivery, or external Release effect. A status without the durable receipt fails.

### P-06: the architecture defers the decisive check/use race and therefore cannot clear G24.A

**Disposition:** Rejected as a current-gate Behavioural and Implementation Reality veto. Accepted as the highest-risk later runtime watchpoint.

**Exact locators:** R5 blueprint line 36 defines the required before-use result; line 60 separates deterministic architecture inspection from atomic traversal and use-time enforcement; R5 contract `/identical_resolving_test/architecture_gate_proof` and `/runtime_gate_proof`; R5 delta `/forbidden_interpretations/4`; standard current-gate boundary item 7.

**Attempted failure path:** runtime reads challenger `C1`, passes eligibility, then `C2` commits before use. The stale projection is used before traversal or receipt creation finishes.

**Why it does not veto now:** R5 owns the required semantic outcome and explicitly refuses to claim working atomicity. The standard places atomic check/use and delivery proof later. Pulling a transaction protocol into G24.A would manufacture a gate and conflict with the accepted proof sequence.

**Mandatory later companion test:** execute the frozen challenger-only case under adversarial interleavings at the first Release-capable gate. No schedule may allow stale use after `C2` becomes current. Dependency validation, use authorisation, invalidation, and receipt persistence must share an enforceable atomic boundary or an equivalent fail-closed protocol.

### P-07: invalidation, receipt production, or planner movement can be counted as decision value

**Disposition:** Rejected as a current-gate Consequential Usefulness veto.

**Exact locators:** R3 blueprint lines 175-214 and 254-258; R3 contract `/intervention_selector/hard_precedence/4`, `/binds_to_r1_decision_frame_not_new_value_root`, and `/question_yield/planner_authored_route_mutation_is_sufficient=false`; R5 blueprint lines 36-42, 50-56, and 75-80.

**Attempted failure path:** after `C2`, the system invalidates, emits a receipt, increments a planner metric, and presents the state movement as proof that the leader's decision improved or the Brain compounded.

**Why it does not veto:** the inherited selector must bind expected material effect to the accepted R1 decision frame. Question Yield rejects planner-authored route mutation and state churn as sufficient value. R5 creates no approval, delivery, or external effect and preserves Qualified Judgement Transfer and Question Yield as unproven. The invalidation is a safety consequence, not evidence of decision lift.

**Later proof:** independently observed decision effect against a competent same-evidence baseline remains G24.B/C; real decision lift, customer return, continuation value, and willingness to pay remain G24.F/G.

### P-08: dependency recovery can expose technical machinery or add a second customer intervention

**Disposition:** Rejected as a current-gate Human Comprehension and Access veto.

**Exact locators:** R1 blueprint lines 96-105 and 397-421; R2 blueprint lines 113-155 and 322-335; R3 blueprint lines 216-252 and 273-293; R4 blueprint lines 156-178; R5 blueprint lines 20-24, 28-42, and 75-82; R5 contract `/protected_strengths`.

**Attempted failure path:** invalidation forces the leader to inspect a watermark mismatch, challenger result, lifecycle label, or receipt and choose how to repair the dependency before Release.

**Why it does not veto:** R5 adds no customer surface or customer action. Binding, invalidation, receipts, and trusted re-evaluation remain system-owned and backstage. The inherited product permits one visible question or action, with deeper evidence one layer away, and explicitly says the customer does not administer technical dependencies. An implementation that makes the leader administer watermarks is not conforming.

**Later proof:** G24.D must show a calm stale-projection state with no policy ids, watermark names, lifecycle labels, or receipt administration, using fresh participants and the exact rendered medium.

### P-09: complete lineage creates a shadow validity root or rewrites immutable history

**Disposition:** Rejected as a current-gate Living Brain Integrity veto.

**Exact locators:** R1 blueprint lines 187-248 and 342-364; R3 contract `/object_map` and `/inherited_integrity`; R4 contract `/epistemic_eligibility_binding/owner` and `/release_non_inference/owner`; R5 blueprint lines 20-24, 36-42, and 62-82; R5 contract `/dependent_release_watermark_closure/owner` and `/creates_new_release_or_dependency_root=false`.

**Attempted failure path:** the Release projection copies current policy, challenger, or validity labels into a local record that awards itself standing, overwrites the invalidated projection during rebuild, or becomes a second Release root.

**Why it does not veto:** R5 extends the existing R1 Release object and dependency graph. It creates no new root, requires canonical references, invalidates append-only, and makes rebuild insufficient without trusted current evaluation and exact human Release authority. Published history and prior versions remain immutable under R1; a later valid projection is a successor, not a rewrite.

**Later proof:** prove immutable predecessor and successor bytes, correction and invalidation receipts, full dependency closure, and clean-room import. Do not infer currentness from a static snapshot or copied label.

### P-10: lineage scoping can over-invalidate all same-workspace projections

**Disposition:** Rejected as a current-gate safety or usefulness veto. Retained as a scale and isolation test.

**Exact locators:** R5 blueprint lines 38 and 58; R5 contract `/dependent_release_watermark_closure/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection=false` and `/identical_resolving_test/unrelated_lineage_control_projection_remains_eligible_if_otherwise_current=true`.

**Attempted failure path:** implementation invalidates every pending projection for the customer or workspace when any challenger or policy version changes, creating unnecessary interruption and destroying unaffected work.

**Why it does not veto:** the frozen amendment expressly forbids that result. A same-workspace shortcut is nonconforming. The unresolved issue is whether working traversal honors the written boundary at scale, which is later proof.

## Criterion findings after prosecution

| Criterion | Prosecution finding | Strongest attack | Disposition |
|---|---|---|---|
| Human Agency | holds at G24.A | old `P1` authority or an invalidation receipt authorises rebuilt `P2` | rejected by exact-projection binding and rebuild insufficiency; runtime test retained |
| Epistemic Integrity | holds at G24.A | minimum array omits a genuine inherited control | rejected because minimum is a floor and complete closure plus R3 inheritance is normative |
| Subject, Audience and Lifecycle Safety | holds at G24.A | omitted permission, close, continuation, or rebuild revives eligibility | rejected by inherited permission invalidation, Release non-inference, and exact rebuilt authority |
| Consequential Usefulness | holds at G24.A | safety churn is reported as decision value | rejected by decision-frame binding and non-activity value rules; empirical lift remains later |
| Living Brain Integrity | holds at G24.A | under-recorded dependency or copied labels shed canonical lineage | rejected as nonconforming; physical closure and successor proof remain later |
| Human Comprehension and Access | holds at G24.A | leader must administer watermark recovery | rejected by single-seam precedence and backstage machinery; rendered recovery remains later |
| Behavioural and Implementation Reality | holds at G24.A | TOCTOU race or decorative receipt defeats written semantics | semantic result is fixed now; atomic execution and receipt durability remain later |

The sealed findings remain `PASS_WITH_WATCHPOINTS` exactly as frozen. This history-aware prosecution independently reaches no current-gate break. It does not convert those verdicts to `PASS`, because material implementation, experience, efficacy, and commercial proofs remain open.

## Identical resolving test retained without weakening

Freeze one pending Release projection containing selector-influenced content and all its dependencies. Hold the separate named-leader Release action, identity, subject, workspace, authority, purpose, audience, permission, lifecycle, accepted frame, policy, canonical sources, canonical assertions, canonical Brain versions, decision requirement, evidence coverage, and trusted cutoff fixed. Change only the recorded dependent independent-challenger result from `none_found_within_declared_boundary` to `countercase_found`.

The required result is:

1. the unchanged dependent pending projection is ineligible before use;
2. one append-only invalidation receipt is required;
3. invalidation creates no approval, delivery, or external side effect;
4. an otherwise-current projection with no recorded lineage to that challenger result remains unaffected; and
5. a rebuilt dependent projection remains ineligible until trusted current resolution exists and separate current named-leader Release authority is bound to the new exact projection, purpose, audience, and canonical version set.

At G24.A, the frozen blueprint and machine contract state this identical result. At the first Release-capable runtime gate, the same case must prove complete dependency materialisation, atomic traversal, use-time revalidation, durable receipt behavior, and zero side effects. The current inspection does not claim that runtime pass.

## Later-gate prosecution docket

These obligations are mandatory carry-forwards, not present vetoes:

1. **G24.B/C dependency closure:** derive the actual control union, reject missing required edges, and mutate permission, assertion, decision requirement, validity, sensitivity, retention, policy, and challenger versions independently.
2. **First Release-capable gate:** execute the identical case under concurrent mutation, retries, stale writers, partial failure, and duplicate events. Prove atomic use-time rejection and one effective append-only receipt.
3. **G24.B/C epistemic behavior:** prove policy and challenger authenticity/currentness, bounded none-found semantics, same-root collapse, contradiction preservation, safe-novel behavior, malformed input handling, and model-label non-authority.
4. **G24.D/E comprehension and access:** prove one clear customer action, progressive disclosure, non-technical stale-state recovery, accessibility, one-handed mobile use, and failed-save recovery in the rendered medium.
5. **G24.F/G value:** prove decision-specific lift against a competent baseline, Qualified Judgement Transfer, customer return, continuation value, and willingness to pay. No receipt or planner event counts as this evidence.
6. **Delivery, revocation, erasure, portability, and cutover:** prove atomic delivery revalidation, retention expiry, revocation and erasure traversal, immutable successor releases, export residue and non-recall limits, clean-room import, and zero legacy authority at their named gates.

## Preserved strengths and closed actions

The prosecution found no R5 regression in the protected R1 through R4 architecture. The exact amendment preserves one canonical Brain; all nine R2 objects mapped to R1 owners; immutable source and correction history; current policy and challenger authority; the exact five-output fail-closed selector; the six-state, thirteen-edge lifecycle graph; engagement close separate from Release; one versioned human-facing intervention atom; human-owned purpose, standards, exceptions, judgement, final call, final quality, and exact Release authority; decision-specific material effect; one visible customer action with deeper evidence behind deliberate reveal; pull-only Krish session control; public-only real identity tests; unproven metric status; and headless proof before material interface polish.

All sixteen contract-closed actions remain closed at R5 contract `/authority/closed`:

`production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`.

R5 delta `/external_actions_opened` remains `[]`. This prosecution opens none.

## Final prosecutorial recommendation

No credible current-gate allegation survives. The R4 dependency defect is recovered: selector-dependent pending Release projections must retain the exact selector result and the complete current control closure, including policy and challenger versions, and any included change invalidates before use. A literal-minimum implementation, an under-recorded dependency, authority carry-forward to a rebuilt projection, and customer administration of watermarks are all nonconforming paths, not alternate conforming outcomes.

Recommend the complete exact R1 through R5 architecture to final adjudication for founder lock. Preserve every sealed verdict and historical adjudication unchanged. Do not begin implementation, the headless Crossing, customer-facing design, Release, or any external action unless final adjudication finds no valid veto and Krish locks these exact bytes.
