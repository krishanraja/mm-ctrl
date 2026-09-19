# G24 R4 standards prosecution

**Run:** `g24-r4-architecture-council-003`

**Role:** Non-voting Standards Prosecutor

**Review mode:** History-aware Pack B calibration and Pack C adversarial challenge over the exact frozen R4 bytes

**Recommendation:** `VETO`

## Bottom line

The seven first-pass verdicts remain validly sealed historical records. They cannot be rewritten, and their agreement cannot outvote a valid current-gate defect.

One defect survives prosecution. R4 correctly requires the current independent-challenger result to watermark and invalidate a selector result, but its Release contract does not require a pending Release projection to retain that dependency and does not invalidate the projection when the challenger-result version changes. The same R4 machine contract expressly carries the policy-version change into Release invalidation while omitting the paired challenger-version change. A conforming implementation can therefore invalidate the selector result yet continue to treat an already compiled, separately authorised Release projection containing its decision-shaping content as eligible.

That is a current G24.A semantic choice about whether stale challenged judgement may leave the system. It is not a request for a physical schema, runtime proof, rendered proof, delivery mechanics, revocation traversal, residue handling or non-recall behavior. The smallest repair is one dependency-propagation invariant in the R4 prose and machine contract, followed by the identical frozen semantic test stated below.

The product direction survives. The exact R4 hashes should not receive founder lock until `P-01` is repaired and freshly rechecked.

## Review contract and hash verification

The first run artifact opened was `cross-examination-brief.md`. PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` returned `e7b77bc180726281aaa2e20765d247f058beb1acf449d0cb04f496ed23edfb3c`, exactly matching the required digest.

The accepted standard is `g24-r4-terminal-trust-seam-recheck-v1`, owned by the CTRL permanent council contract and fresh on 12 September 2026. Review authority is limited to this local prosecution record. The submission remained frozen throughout.

All values below are both the declared and recomputed SHA-256 unless explicitly labelled as an observed-only advisory-card identity.

### Run control files

| Artifact | SHA-256 | Result |
|---|---|---|
| `cross-examination-brief.md` | `e7b77bc180726281aaa2e20765d247f058beb1acf449d0cb04f496ed23edfb3c` | match |
| `standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
| `brief.md` | `ce4bc2eb8a28a769684afa72526b9d3e6c2890645621aa0fea5239c9a9fed5e1` | match |
| `input-manifest.json` | `ba748ee84e03c31fc9599a10accd713ba230d30868af324d1c6fec8da2606cc1` | match |
| `sealed-verdicts.json` | `67869c759a68ed7e31745a8c0a9416542ec37016d0509d31ab3eaf2ff4342140` | match |

### Frozen Pack A artifacts

| Set | Artifact | SHA-256 | Result |
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

### Sealed first-pass verdicts

| Specialist record | SHA-256 | Recorded verdict | Result |
|---|---|---|---|
| `human-agency.md` | `a3ebd3a597ad46c4680e1d47f123c961ea5854af76c8cc5008914d8583723deb` | `PASS_WITH_WATCHPOINTS` | match |
| `epistemic-integrity.md` | `81aa488556ebf513f8caebea44591f11b34cb97b2cc433a82fafcbec0061beb3` | `PASS_WITH_WATCHPOINTS` | match |
| `subject-audience-lifecycle-safety.md` | `c2e5d34519ccae56fa2ac6c8f769735052aab2eaf6dfdfe10dccb39a2b210cbf` | `PASS_WITH_WATCHPOINTS` | match |
| `consequential-usefulness.md` | `f53f44653cf34d9210cfcc0f250af1c09181b0e732ec63bf3f3c1cff854fc0` | `PASS_WITH_WATCHPOINTS` | match |
| `living-brain-integrity.md` | `5371e1497d3e22e2ec8e5af1715d59ca6ebfdf5670a5480ca141a3ea1f8bac7d` | `PASS_WITH_WATCHPOINTS` | match |
| `human-comprehension-and-access.md` | `e8417f1c2a993f2c7facd9feee2302e8ac997f6e4dee093a25d74eda661402bd` | `PASS_WITH_WATCHPOINTS` | match |
| `behavioural-and-implementation-reality.md` | `5110086fb863f817b27427aa9e3a17954b8e721a4deb185b0d5c87518bb11379` | `PASS_WITH_WATCHPOINTS` | match |

### Durable histories and prior adjudications

| Record | SHA-256 | Result |
|---|---|---|
| `judge-history/human-agency.md` | `6f0a4afecd52b673b155ae3410f4ddd94b79729bcf1ba49cf84cde657b740c1f` | match |
| `judge-history/epistemic-integrity.md` | `b0d14f4f682ac9f619f6537328ba36bd2f45e07bbcd16c20beb53df73db18145` | match |
| `judge-history/subject-audience-lifecycle-safety.md` | `e02294cc4e52a0cc30f2b4d2862ea7ddb2ec0f144f3e256ad0693a55dd6a8415` | match |
| `judge-history/consequential-usefulness.md` | `1333c07c95d2af7528b9a2f21a65791777ce7eccd2684325a3d61560b01a0101` | match |
| `judge-history/living-brain-integrity.md` | `1ee6c9bb19e4138ca6b6b21f461cd11b4f723d062d02cbc3374d156d317755ef` | match |
| `judge-history/human-comprehension-and-access.md` | `c9226e3c56c876b4d5535e9aaae7d0af2e053b61a44be08b33dc2387575f85dc` | match |
| `judge-history/behavioural-and-implementation-reality.md` | `e7671975d37a167b57b5934f9dc314d762a7587f77967d3040835b6fb9c5e5fa` | match |
| R2 `adjudication.md` | `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b` | match |
| R3 `adjudication.md` | `abe26c55559950c749d1f203444fe0cac452812182646478e546b82ed841829a` | match |

PowerShell 7.6.5 `ConvertFrom-Json -Depth 100` parsed the run manifest and all seven Pack A contract and delta JSON files. A deterministic in-memory inspection found six exact R4 lifecycle states, 13 transition rows, five selector outputs, all seven sealed verdict labels equal to `PASS_WITH_WATCHPOINTS`, equality between the R3 and R4 closed-action sets, and zero entries in R4 delta `/external_actions_opened`.

The same inspection reproduced the defect's literal asymmetry. R4 contract `/epistemic_eligibility_binding/invalidation_triggers` contains both `epistemic_policy_version_change` and `independent_challenger_result_version_change`. R4 contract `/release_non_inference/pending_projection_invalidation_triggers` contains the policy change but not the challenger-result change. R4 contract `/release_non_inference/required_binding_before_use` contains neither selector watermark set nor an equivalent dependency reference.

These checks establish byte identity, JSON parseability and enumerated structure only. They do not establish semantic correctness or runtime behavior.

## Materials read and exclusions

I read in full:

- the cross-examination brief, accepted standard, fresh-council brief and input manifest;
- all 13 frozen Pack A dependency and submission artifacts listed above;
- all seven sealed R4 specialist verdicts and `sealed-verdicts.json`;
- all seven current judge histories;
- the R2 and R3 adjudications; and
- exactly the eight just-in-time historical cards routed below.

I did not read any founder-calibration file, any veto-defense file, either prior standards-prosecution file, the quarantined `docs/history/2026-09-07-md (2).md`, builder commentary, a founder prediction, conversation history, or another agent's work. I did not consult another agent.

Outside the evidentiary pack, the mandated CTRL Check and Krish Principles process instructions were read only as workflow constraints. They supplied no substantive evidence or authority for this ruling.

## Just-in-time theory-card routing

All eight permitted triggers materially fired because the assignment required an attack on all seven criteria and specifically on intervention burden, selector purpose, epistemic standing, Brain lineage, lifecycle semantics and compounding value. Every card identified itself as historical. Each was used only as advisory pressure, never as current authority. No ninth card was opened.

| Historical advisory card | Observed SHA-256 | Material trigger | Advisory use |
|---|---|---|---|
| `docs/history/2026-09-07-_INTAKE-HARNESS-SPEC.md` | `a0372ba82a04906ac10c0fccac8d9c1e90bba2b88343afa736b22bf250174d77` | Intervention atom and leader burden challenged | Pressed recognition-first input, optional depth and visible payoff against the inherited human-facing atom. |
| `docs/history/2026-09-07-_INTERROGATION_PROMPT.md` | `850607241dfb31227c13ca8af10273796fe9adc464ec12debb18c1d2fb2bb85e` | Question sequencing and comprehension challenged | Pressed one-question sequencing, adaptive density, input preservation and preserved rationale. Its fixed 22-question artifact was not treated as current product direction. |
| `docs/history/2026-09-07-CTRL-DECISIONING-FRAMEWORK.md` | `74ee5bff759aed9b20427f9fe31b42ba6dbbdeb3fa10b1800ffe48ff0faa37cc` | Consequential effect and selector purpose challenged | Pressed load-bearing decision variables, source-capability ceilings, countercase and the human call. Its old component counts and confidence machinery were not imported. |
| `docs/history/2026-09-07-intel-methodology-critical-thinking.md` | `3fb306aab5443f4feaef0b1f2c4e2b04dab903d1dbdcd3c6f910ebf0e2801803` | Epistemic standing challenged | Pressed decomposition, evidence-tracking confidence, disconfirmation, a real countercase and human-first judgment. Historical runtime claims were not treated as current. |
| `docs/history/2026-09-07-intel-methodology-memory-identity.md` | `492a4c439ca36ce973532d250c517bbc4310f6e99476940151f4f3f2ad351094` | Stored context risked being mistaken for learned judgment | Pressed the distinction between stored context, accepted judgment, correction and observed cold-versus-loaded improvement. Its retired file model was not imported. |
| `docs/history/2026-09-07-AI Memory Systems for Multi-Agent Architectures  The Canonical Reference (2025-2026).md` | `28e182238af0bfa534f91d8113fb635199560dce90465be4d952949a869d9976` | Brain provenance, temporal validity, contradiction and repair challenged | Pressed dependency lineage and the need for a stale or contradicted evaluation not to survive in a downstream projection. Vendor, benchmark and implementation prescriptions remained non-authoritative. |
| `docs/history/2026-09-07-intel-data-lifecycle.md` | `f1b6e9870c2c4bfce7494d555f57dc174ef6580a8752f94f4e7ee9df410ce0dc` | Lifecycle semantics challenged | Pressed the separation of capture, validity, permission, correction, retention and deletion. Its retired-host schema and live-state claims were not imported. |
| `docs/history/2026-09-07-app-data-learning.md` | `bf7e2456d90be5dbc8812ede05c9395f60153680e580de784b0ab41b8d33d6be` | Compounding value challenged | Pressed the distinction between stored activity and a closed outcome-and-correction loop. Its retired application inventory was not treated as current. |

## Earlier failure-class recovery

I attempted to recover each R2 and R3 failure class under the exact R4 bytes. One class partially recurs at a downstream boundary; the rest do not.

| Earlier failure class | Exact R4 disposition |
|---|---|
| R2 shadow ownership and unexplained inheritance | Not recovered. R3 contract `/object_map` still maps all nine R2 objects to R1 owners with `new_canonical_root: false`; R3 `/inherited_integrity` remains inherited through R4 `/normative_precedence/all_other_r3_rules_inherited`. |
| R2 human authority, answer-to-state and open-ended continuation | Not recovered. R3 `/intervention_authority` still separates immutable answer evidence, rebuildable case effect and pending human-owned change. R4 `/lifecycle_policy_replacement` supplies exact actors, preconditions, versions, invalidations and receipts. |
| R2 selector without one total semantic owner | Not recovered. R3 `/intervention_selector` retains the trusted owner, inputs, hard precedence and five outputs. R4 `/selector_policy_replacement` removes the actionable provisional ambiguity and fixes invalid control to `abstain_hold`. |
| R2 machine omission of the human-facing intervention atom | Not recovered. R3 `/intervention_atom` remains inherited, including wording, control payload, answer grammar, complete options or comparator, honest exits, disclosed material effect and visible consequence in one version. |
| R3 unbound policy and challenger authority | Closed at the selector boundary, but partially recovered at the Release boundary as `P-01`. R4 binds both current refs to selector eligibility and invalidates the selector result on either version change, then fails to carry the challenger dependency into its pending Release binding and invalidator list. |
| R3 grouped lifecycle pseudo-states, no preparation exit and close-as-Release | Not recovered. R4 defines six exact states and 13 explicit edges, adds `preparing -> closed`, uses `closed` as the engagement terminal and states that engagement state and close receipt cannot grant, prove or complete Release. |
| R3 undefined actionable provisional route | Not recovered. R4 contract `/selector_policy_replacement/provisional` permits provisional detail only as non-authoritative metadata on an `abstain_hold` receipt and denies intervention, approval, Brain change and invalidation bypass. |

## Attacks by criterion

The dispositions below are prosecution findings over the same sealed bytes. They do not alter the sealed records.

### Human Agency

**Attack:** I chained the strongest authority-laundering path: model-authored epistemic labels attempt to earn a selector route; a question or session attempts to bypass Krish's exact-version control; an answer from the wrong actor attempts to change purpose, standards, exceptions, the human-versus-AI boundary or durable judgment; lifecycle movement attempts to renew permission; and close attempts to confer Release.

**Disposition:** The sealed pass survives on its owned criterion.

**Why:** R4 blueprint `Repair 1`, lines 30-53, and contract `/epistemic_eligibility_binding` deny model proposals selector standing. R4 contract `/selector_policy_replacement/invalid_controlling_output`, `/invalid_controlling_creates_actionable_intervention_or_derivative` and `/invalid_controlling_enters_approval_or_delivery` force invalid control to a non-actionable hold. Inherited R3 contract `/intervention_authority/answer_effect_layers`, `/human_owned_changes_require_named_authority`, `/answer_can_be_authority_event_only_if` and `/honest_exit_effect` keep an answer from silently becoming human authority. R4 `/lifecycle_policy_replacement` and `/release_non_inference` prevent lifecycle and close receipts from granting Release. `P-01` can release stale epistemic content, but it does not transfer the named leader's Release decision or final call to the model, selector or Krish. It is not an independent Human Agency veto.

### Epistemic Integrity

**Attack:** I replayed the prior same-root syndication, scope-mismatched Brain item, observational-to-causal promotion, copied-label, stale-cutoff, contradiction and model-confidence attacks. I then followed an eligible selector result into a pending Release projection and changed only the independently bound challenger result.

**Disposition:** The selector-level pass survives, but the criterion-level pass does not survive because `P-01` is current.

**Why:** R3 contract `/inherited_integrity` still collapses common roots, prohibits derivative-awarded standing and private-reasoning cross-case reuse, and keeps causal standing typed. R4 contract `/epistemic_eligibility_binding/required_current_references`, `/policy_owned_outcomes`, `/challenger_binding`, `/selector_output_watermarks` and `/invalidation_triggers` closes the original selector-production defect. The break begins only after that valid result shapes content included in a pending Release. R4 contract `/release_non_inference/required_binding_before_use` omits the selector's policy and challenger watermarks, while `/pending_projection_invalidation_triggers` includes the policy change but omits `independent_challenger_result_version_change`. A changed live countercase can therefore invalidate the selector result without necessarily invalidating the pending projection that carries its conclusion.

The Epistemic specialist itself identifies this at `epistemic-integrity.md`, `Later-gate watchpoints`, item 5, but classifies it as later because Release is closed. That classification is too late. Runtime exercise is later; the dependency rule is a current architecture choice.

### Subject, Audience and Lifecycle Safety

**Attack:** I tested abandoned preparation, stale transitions, duplicate transition content, unilateral pause and close, reopening under a new purpose, expired grants, close-only completion, separately requested Release, audience narrowing, permission withdrawal and a changed challenger result before Release use.

**Disposition:** The exact engagement graph and close-versus-Release separation survive. The criterion-level pass is nevertheless qualified by the same current `P-01` validity defect, not by a second lifecycle defect.

**Why:** R4 blueprint `Universal transition envelope`, `Exact transition graph`, `Closed-state capability` and `Release non-inference`, mirrored at contract `/lifecycle_policy_replacement` and `/release_non_inference`, close the original grouped-state, abandoned-preparation and close-as-Release failures. Permission, audience and included source or Brain changes are declared Release invalidators. The missing challenger dependency is different: the Release can remain within the same subject, audience, purpose and named-leader authority while its epistemic validity has changed. Safety history consistently treats validity as distinct and persistent across states. Whether that change blocks pending use must be fixed semantically before a later runtime can test it.

### Consequential Usefulness

**Attack:** I attempted to satisfy the system with a generic profile question, a lifecycle state change, an impressive receipt, a planner-authored route mutation and an activity metric, none tied to a material effect on the accepted decision frame.

**Disposition:** The sealed pass survives.

**Why:** R2 blueprint `The decision evidence map` and `Question Intelligence: Eligibility`, plus R2 contract `/decision_evidence_map` and `/question_intelligence/eligibility_effects`, reject profile completion and require a load-bearing variable. R3 blueprint lines 175-214 and contract `/intervention_selector/hard_precedence`, `/output_fields`, `/binds_to_r1_decision_frame_not_new_value_root` require expected material effect against the accepted R1 frame. R3 `/question_yield/planner_authored_route_mutation_is_sufficient: false` prevents state churn from becoming value. High-value and low-value fixtures, a competent same-evidence baseline, independently observed effect, real decision lift and commercial efficacy remain later proof. No separate current Usefulness defect was found.

### Living Brain Integrity

**Attack:** I attempted a shadow standing ledger, copied model labels, common-root inflation, private reasoning reuse, overwrite of correction history, lifecycle receipt as memory authority and a portable projection that outlives the evaluation that made its content eligible.

**Disposition:** The canonical Brain core survives, but the criterion-level pass does not survive `P-01`.

**Why:** R1 blueprint `Canonical kernel`, `Brain-item standing`, `Runtime and storage` and `Learning, correction and self-healing`; R3 contract `/object_map` and `/inherited_integrity`; and R4 `/normative_precedence` preserve one canonical, versioned and correction-ready Brain. R1 blueprint line 214 requires every release an item influenced to remain traceable. Lines 353-364 require affected releases to participate in dependency repair. R1 line 225 also makes decisions and evaluations part of the portable release. R4 then creates a new decision-shaping challenger watermark but does not place that dependency in `/release_non_inference/required_binding_before_use` or its invalidation list. That permits a downstream projection to outlive the selector result it contains without a source, Brain or policy version necessarily changing.

The Living Brain specialist identifies the same risk at `living-brain-integrity.md`, `Later-gate watchpoints`, item 4, including the warning that the R4 Release trigger list must not become a narrower escape hatch. Calling the carry-through a later implementation decision concedes the semantic choice that G24.A must close.

### Human Comprehension and Access

**Attack:** I attempted to leak `abstain_hold`, policy identifiers, lifecycle labels and receipt language to the leader; make an optional note carry a required answer; remove unknown, defer, refusal or premise-rejection routes; and separate visible consequence from the question version.

**Disposition:** The sealed pass survives.

**Why:** R2 blueprint `The intuitiveness contract`, `Answer grammar`, `Wording rules` and `Experience proof requirements`, together with R2 contract `/experience_intelligence` and `/question_intelligence`, keep one concrete human moment and optional depth. Inherited R3 contract `/intervention_atom` binds wording, control, complete options or comparator, honest exits, pre-commitment effect and answer-specific consequence into one version. R4 blueprint final paragraph under `Protected strengths` keeps policy identifiers, lifecycle labels and receipts off the customer surface. Whether fresh participants understand the rendered result, can use it one-handed, recover from failure or meet accessibility requirements remains G24.D/E evidence. No current semantic defect was found.

### Behavioural and Implementation Reality

**Attack:** I tested undeclared lifecycle endpoints, grouped pseudo-states, abandoned preparation, stale edges, duplicate transition content, missing or malformed selector controls, invalid-frame holds, valid evidence conflicts, provisional side effects, hard-coded fixture answers and the release-use path after a challenger-version change.

**Disposition:** The lifecycle and selector passes survive at their declared current boundary. The overall criterion-level pass does not survive `P-01`.

**Why:** Deterministic inspection confirms six exact states, 13 explicit edges, five selector outputs, non-actionable invalid hold and no sixth provisional route. Exact compare-and-set behavior, content-bound idempotency, malformed-input totality, race handling, hidden semantic oracles and actual side-effect inventories are later runtime proofs. The Release defect is different. R4 has already chosen an explicit Release binding and invalidation list, but the list is asymmetric with the selector's paired epistemic watermarks. Two implementations can follow the written contract and disagree on whether a changed challenger invalidates the pending projection. That is precisely the consequential implementer choice the G24.A standard forbids.

The Behavioural specialist's `Later-gate watchpoints`, item 2, requires a challenger change to race against Release use, but the current machine contract does not first state that the challenger change is a Release invalidator. Runtime cannot prove a semantic rule that the architecture did not require.

## Surviving current-gate defect

### P-01: a pending Release can drop the independent-challenger dependency

**Affected criteria:** Epistemic Integrity, Subject, Audience and Lifecycle Safety, Living Brain Integrity, and Behavioural and Implementation Reality.

**Current-gate rule:** `standard.md`, `Gate question`; `Current-gate pass boundary` items 1, 3, 6 and 7; and the four owned criteria named above. The candidate must leave no consequential unsafe or contradictory semantic choice to the implementer. Current challenger authority must govern selector-eligible epistemic outcomes, and downstream Release must remain a validity-bound projection of canonical truth rather than an escape hatch from invalidation.

**Exact locators:**

1. `g24-product-system-blueprint-r4.md:51` states that both policy and challenger versions travel in selector inputs, output watermarks and invalidation, and that either version change invalidates the prior selector result before use.
2. `g24-product-system-contract-r4.json#/epistemic_eligibility_binding/selector_output_watermarks` contains `epistemic_policy_version` and `independent_challenger_result_version`.
3. `g24-product-system-contract-r4.json#/epistemic_eligibility_binding/invalidation_triggers` contains `epistemic_policy_version_change` and `independent_challenger_result_version_change`.
4. `g24-product-system-blueprint-r4.md:109-111` requires a pending Release to bind one exact projection, purpose, audience and included source and Brain versions, then enumerates identity, permission, audience, validity, policy and included-source changes as invalidators. It does not bind or invalidate on the challenger result.
5. `g24-product-system-contract-r4.json#/release_non_inference/required_binding_before_use` contains only `release_projection_version`, `purpose`, `audience`, `included_canonical_source_versions` and `included_canonical_brain_versions`.
6. `g24-product-system-contract-r4.json#/release_non_inference/pending_projection_invalidation_triggers` contains `epistemic_policy_version_change` but not `independent_challenger_result_version_change` or an equivalent complete-selector-watermark dependency.
7. R1 `g24-product-system-blueprint.md:214`, `:225`, `:248` and `:353-364` require influence lineage, include decisions and evaluations in Release, watermark state transitions and repair every affected release.

**Conforming failure path:**

1. Under accepted policy version `P1` and current challenger result `C1`, bound to requirement `D1`, coverage `E1`, cutoff `T1` and policy `P1`, trusted evaluation produces selector result `S1`. `C1` records `none_found_within_declared_boundary`, so `S1` is eligible.
2. A pending Release projection `R1` is compiled after a separate current named-leader Release action. It includes a decision, evaluation or Brain projection influenced by `S1`. It binds the exact projection version, purpose, audience and included canonical source and Brain versions, exactly as R4 requires. The frozen Release contract does not require `C1`, `S1` or the selector's complete controlling watermark set to be a Release dependency.
3. A new current challenger result `C2` is issued for the same `D1`, `E1`, `T1` and `P1`, and finds a material countercase. Nothing else changes: identity, permission, audience, validity, policy version, included source versions and included Brain versions remain identical.
4. R4 invalidates `S1` before selector use because the challenger-result version changed. The explicit Release invalidation list does not fire, because it omits that change and no source, Brain or policy version moved. No correction event is guaranteed because the new challenger result is itself the changed evaluation input.
5. A conforming implementation may therefore keep `R1` eligible and complete its later authorised use. No lifecycle state granted Release, and the leader's separate Release authority can remain current, so the other R4 Release clauses do not stop the path.
6. The portable projection now carries decision-shaping content whose current challenger result rejects or materially contests the standing under which it was compiled. That violates current epistemic validity, Brain lineage and fail-closed behavior.

**Why this is current rather than later:** The physical representation of the dependency, transactional invalidation, delivery check, revocation traversal, residue and non-recall behavior remain later. The binary semantic choice, whether a changed controlling challenger result invalidates a dependent pending projection before use, belongs to G24.A. R4 already makes that choice for policy changes and for the selector result. Omitting the paired challenger dependency cannot be cured by an implementation test without letting the implementer decide the expected result.

**Smallest sufficient repair:**

1. Add one sentence to R4 blueprint `Release non-inference`: "When included content depends on a selector result or trusted epistemic evaluation, the pending Release projection carries that result's complete controlling watermark set, and any change to an included watermark, including the independent-challenger result version, invalidates the projection before use and emits a receipt."
2. Add the same semantic requirement to `g24-product-system-contract-r4.json#/release_non_inference/required_binding_before_use`, for example `included_selector_result_versions_and_controlling_watermarks_when_applicable`.
3. Add the matching invalidator to `/release_non_inference/pending_projection_invalidation_triggers`, for example `included_selector_controlling_watermark_change`. This may be expressed as the complete dependency-set rule rather than a growing list of individual fields. No new Release root, policy root, schema, numeric value or delivery mechanism is required.

**Identical resolving test:** Freeze one pending Release projection containing content influenced by selector result `S1`, with a separate exact named-leader Release action and fixed identity, purpose, audience, permission, validity, policy, source, assertion, Brain, decision, evidence-coverage and trusted-cutoff versions. Run the test once with `C1 = none_found_within_declared_boundary`; only the exact current projection may be eligible. Re-run the identical test changing only the current challenger-result version to `C2 = countercase_found`. The unchanged pending projection must become ineligible before use and require an invalidation receipt. Rebuilding under `C2` must not restore eligibility unless trusted current policy resolves the countercase and a new exact projection satisfies the same separate Release authority. Changing an unrelated challenger result outside the projection's dependency lineage must not invalidate it.

At the G24.A recheck, resolution is established by identical blueprint and machine semantics plus deterministic inspection that the complete dependent watermark rule is present. The same fixture is then executed at the later Release-capable runtime gate.

## Allegations rejected as current-gate vetoes

### Invalid-frame `abstain_hold` output fields

Inherited R3 blueprint lines 196-204 and contract `/intervention_selector/output_fields` say every result carries an expected material effect bound to an accepted frame. R4 contract `/selector_policy_replacement/invalid_controlling_dimensions` correctly permits a missing or invalid `accepted_frame` to produce `abstain_hold`. The Behavioural verdict flags the eventual unavailable or not-evaluable representation.

This is not a current veto. R4 already fixes the semantic result, the reason and repair trigger, non-actionability, approval/delivery exclusion and provisional side-effect ban. Whether the later schema uses null, a tagged unavailable value or variant-specific fields is a physical representation decision, provided it cannot fabricate standing or action. That exact representation belongs to G24.B/C.

### Atomic `none -> preparing` and transition races

R4 blueprint line 70 says every edge consumes the exact current `from` version; the graph uses `none` only as the initial sentinel and contract `/lifecycle_policy_replacement/stale_or_invalid_transition` rejects without state change. The semantics therefore require an absent current engagement, not a blind insert. Compare-and-set mechanics, concurrent opens, content-bound idempotency and receipt transactionality are later implementation proof.

### Pause, close and last-moment queued work

The frozen semantics make lifecycle state a controlling selector input, invalidate controlling changes before use, block new decision-shaping work in paused/closing/closed and explicitly invalidate unsent interventions. Whether delayed jobs, queue claims and transport retries are atomically cancelled or quarantined is mandatory G24.B/C and delivery-gate proof. No external research, capture or delivery capability is currently open. I found no additional current edge or authority choice that must be added.

### Exact policy, challenger and source mechanics

Policy authenticity, immutable version storage, trusted-clock enforcement, exact source-capability matrices, adequate search boundaries, evaluator implementation, numeric thresholds, model/provider selection and malformed-input validators remain G24.B/C. R4 already assigns current semantic ownership to the accepted R1 policy and independent challenger. `P-01` concerns only the missing downstream dependency, not those later mechanics.

### Rendered comprehension and accessibility

Exact question copy, fresh-participant comprehension, twelve-year-old language, one-handed mobile use, keyboard and screen-reader behavior, target size, contrast, zoom/reflow, motion/audio alternatives and failed-save recovery remain G24.D/E. The current architecture preserves the semantic intervention atom and does not claim observed usability.

### Decision lift, compounding value and commercial efficacy

High-value and low-value discrimination, a competent same-evidence baseline, independently observed material effect, Qualified Judgement Transfer, Question Yield, session usefulness, customer return, decision-quality lift and willingness to pay remain G24.C and G24.F/G as already assigned. No architecture prose can prove them.

### Release execution mechanics

Atomic use-time revalidation, exact delivery, revocation traversal, retention expiry, erasure, prior-customer-held residue and non-recall limits remain at the first Release/data capability and G24.H. `P-01` does not pull those mechanics forward. It supplies the expected semantic result that those later mechanisms must enforce.

## Later proof preserved

The following proof remains later and is not demanded as a repair to the frozen architecture:

| Gate | Required later evidence |
|---|---|
| G24.B/C | Exact schemas and validators; immutable and attributable policy/challenger versions; trusted clock; source-root, subject, audience, causal and cross-case attacks; all invalid and valid-conflict selector variants; hidden semantic oracle; safe-novel and malformed cases; exact transition compare-and-set, idempotency and race behavior; independently observed state and side-effect inventories; bounded slow, failed, duplicate and stale execution; high-value and low-value decisions against a competent same-evidence baseline. |
| G24.D | Exact semantic question fixtures; fresh-participant comprehension; one-action and one-handed mobile use; progressive disclosure; premise rejection; visible-consequence comprehension; accessibility; failed-save recovery; operator queue legibility and clerical-load evidence. |
| First consented capture/customer-data gate | Sensitive-purpose disclosure; participant and modality permission; multi-speaker treatment; withdrawal; real-data subject and audience enforcement. |
| G24.E and first Release/data capability | End-to-end stateful slice; dependency repair; the `P-01` runtime fixture; atomic use-time Release revalidation; clean-room portability; correction successors; retention, erasure, residue and non-recall behavior. |
| G24.F/G | Founder and assisted-pilot evidence for specific value, session usefulness, decision-quality lift, continued relationship value, customer return, Qualified Judgement Transfer and willingness to pay. |
| G24.H | Capability-by-capability cutover, zero legacy readers/writers, retention and DSAR proof, rollback window and founder Release approval. |

## Closed-action confirmation

R4 contract `/authority/closed` still closes all 16 actions inherited from R3:

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

R4 delta `/external_actions_opened` is `[]`. This prosecution performed no external action, opened no implementation step, changed no frozen artifact, verdict, history or gate state, and grants no Release authority.

## Recommendation

`VETO` the exact R4 candidate for the single current-gate defect `P-01`.

Hold founder lock and headless implementation on blueprint `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a`, contract `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` and delta `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85`.

Apply only the dependency-propagation repair above. Preserve the exact state graph, selector partition, intervention atom, human authority, one canonical Brain, customer-hidden machinery, all deferred proof boundaries and every closed external action. Freeze new bytes, rerun the identical resolving test, obtain fresh sealed specialist verdicts, then conduct fresh prosecution, defense and adjudication. The seven current verdicts remain immutable history and cannot certify repaired bytes.
