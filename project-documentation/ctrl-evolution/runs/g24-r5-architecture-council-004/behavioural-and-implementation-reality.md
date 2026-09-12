# G24 R5 sealed specialist verdict: Behavioural and Implementation Reality

## Review contract

- **Run:** `g24-r5-architecture-council-004`
- **Standard:** `g24-r5-dependent-release-watermark-recheck-v1`, accepted, fresh 12 September 2026, SHA-256 `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109`
- **Submission:** the exact three R5 artifacts and hashes in `input-manifest.json`
- **Mode and independence:** fresh sealed Pack A specialist pass. The accepted standard was read before the frozen submission. Artifact prose was treated as a claim to test.
- **Authority:** local review record only. No implementation, founder lock, release, deployment, external action or mutation of the frozen submission is authorised by this verdict.
- **Owned lens:** Behavioural and Implementation Reality. Cross-architecture checks below test for regression only and do not substitute for the other six specialist rulings.

## Mechanical identity and parse checks

PowerShell `7.6.5` `Get-FileHash -Algorithm SHA256` was run against every one of the 17 paths declared by `input-manifest.json`. Expected and observed hashes were identical in every case.

| Kind | Artifact | Expected and observed SHA-256 | Result |
|---|---|---|---|
| Standard | `runs/g24-r5-architecture-council-004/standard.md` | `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109` | match |
| Submission | `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` | match |
| Submission | `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` | match |
| Submission | `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` | match |
| R1 dependency | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| R1 dependency | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| R1 dependency | `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| R2 dependency | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| R2 dependency | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| R2 dependency | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| R2 dependency | `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| R3 dependency | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| R3 dependency | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| R3 dependency | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| R4 dependency | `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| R4 dependency | `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| R4 dependency | `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

All ten allowlisted JSON files parsed successfully with PowerShell `ConvertFrom-Json`. This proves byte identity and JSON syntax only. It does not prove runtime enforcement or semantic correctness. Embedded references to excluded adjudication records were not dereferenced and remain submission claims.

## Exclusion attestation

I did not read any earlier G24 council folder, `judge-history/`, another specialist output, builder commentary, founder prediction, conversation history or current R4 QA history. The allowlisted R1 QA record and R2 evidence note were hash-checked but their contents were not needed and were not opened. Semantic inspection was confined to the three R5 artifacts and the allowlisted R1 through R4 dependency passages needed to test inherited ownership, controlling references, later-gate boundaries and product regression.

## Verdict

**PASS_WITH_WATCHPOINTS**

No current-gate Behavioural and Implementation Reality break was found. The R5 text determines the dependent-only mutation result and the unrelated-lineage control result without leaving a conforming alternative outcome. It also states that G24.A proves those semantics by deterministic inspection only, while atomic traversal and use-time enforcement remain runtime proof.

This verdict does not certify working code. The most dangerous implementation failure is a concurrent check/use race, and the R5 artifacts correctly leave that to the later Release-capable runtime gate.

## Owned criterion

### BIR-1: deterministic dependent mutation, lineage control and proof boundary

**Disposition: holds**

**Evidence and exact locators:**

- `g24-product-system-blueprint-r5.md`, `## The one repair`, lines 28-42: a dependent pending projection binds the exact selector result and its complete controlling watermark set before use; every included watermark change invalidates it before use, emits an append-only receipt, creates no new Release authority, stays lineage-scoped and cannot be cured by rebuild alone.
- `g24-product-system-blueprint-r5.md`, `## Identical resolving test`, lines 46-60: the only mutation is `C1` to `C2`; the unchanged dependent projection becomes ineligible before use, produces or requires the receipt and creates no approval, delivery or external side effect; the unrelated-lineage control remains unaffected; runtime atomic traversal and use-time enforcement are deferred explicitly.
- `g24-product-system-contract-r5.json`, `/dependent_release_watermark_closure/applies_when`, `/required_binding_before_use_added`, `/complete_controlling_watermark_minimum`, `/invalidation_trigger_added`, `/dependent_watermark_change_result`, `/dependent_watermark_change_receipt`, `/dependent_watermark_change_creates_approval_delivery_or_external_side_effect`, `/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection`, `/rebuild_alone_restores_eligibility`, `/eligibility_after_rebuild_requires` and `/changes_release_authority_owner` encode the same outcome.
- `g24-product-system-contract-r5.json`, `/identical_resolving_test/only_mutation`, `/required_mutated_case_result`, `/rebuild_can_restore_only_after_trusted_resolution_and_new_exact_release_eligibility`, `/unrelated_lineage_control_projection_remains_eligible_if_otherwise_current`, `/architecture_gate_proof` and `/runtime_gate_proof` make the test split machine-readable.
- `g24-product-system-r5-delta.json`, `/added_semantics/0` through `/added_semantics/7`, `/forbidden_interpretations/0` through `/forbidden_interpretations/5` and `/external_actions_opened` bound the amendment and rule out the contrary readings.

**Finding:** For the standard's identical case, a conforming implementation has only one semantic result. A change to the recorded dependent challenger result version makes the unchanged dependent pending projection ineligible before use, requires an append-only invalidation receipt and causes no approval, delivery or external side effect. A current projection without recorded lineage to that result stays unaffected. Rebuilding cannot restore eligibility without trusted current resolution and separate exact Release authority. Physical ordering, transaction shape and concurrency behavior are not claimed at this gate.

## Strongest attempted failure

### Attempt: incomplete minimum interpreted as complete closure

I tried to construct two implementations from the R5 contract:

1. Implementation A treats `/dependent_release_watermark_closure/complete_controlling_watermark_minimum` as an exhaustive field list and omits an inherited control such as `canonical_assertion_versions` or `authority_or_permission_version`.
2. Implementation B traverses the full inherited dependency set and therefore invalidates when that omitted applicable control changes.

If both conformed, they could disagree materially about validity while source and Brain versions remain fixed.

The attempt does not establish a veto. Implementation A is not conforming because:

- `g24-product-system-blueprint-r5.md`, lines 22-24, replaces only the dependent pending Release watermark seam and inherits every other R4, unaffected R3, R2 and R1 rule;
- line 34 defines complete as every current reference whose change can invalidate the included selector result, not merely the enumerated minimum;
- `g24-product-system-contract-r5.json`, `/normative_precedence/all_other_r4_rules_inherited`, `/all_unaffected_r3_rules_inherited` and `/dependent_release_watermark_closure/required_binding_before_use_added/1` repeat that closure; and
- `g24-product-system-contract-r3.json`, `/inherited_integrity/controlling_references` includes workspace, subject, evidence namespace, accepted frame, canonical source, canonical assertion, accepted Brain, authority or permission, purpose, audience, trusted-as-of, sensitivity, validity, retention and input-watermark references, while `/inherited_integrity/invalidation_triggers` includes correction, permission, audience, identity, freshness and decision-version change.

The word `minimum` therefore permits a physical representation to add applicable inherited controls; it does not permit semantic omission. The implementation watchpoint remains serious because a validator built only from the literal array could still be wrong.

### Attempt: concurrent challenger change between eligibility check and Release use

A runtime could read `C1`, pass eligibility, then allow `C2` to commit before use and still release the stale projection before dependency traversal or receipt creation completes. That is a real implementation hazard, but it is not a current-gate ambiguity. R5 requires invalidation before use at `g24-product-system-blueprint-r5.md` line 36 and `/dependent_release_watermark_closure/dependent_watermark_change_result`, then explicitly assigns atomic traversal and use-time enforcement to the later runtime gate at blueprint line 60 and `/identical_resolving_test/runtime_gate_proof`.

## Current-gate findings

No current-gate defect was found.

| Boundary attacked | Finding | Exact locator |
|---|---|---|
| Exact dependent binding | Holds. The exact selector result version and its complete controlling set bind before use. | R5 blueprint lines 28-35; R5 contract `/dependent_release_watermark_closure/required_binding_before_use_added` |
| Complete current lineage | Holds. Policy and challenger versions are named, the listed set is expressly a minimum, and inherited applicable controls remain binding. | R5 blueprint line 34; R5 contract `/complete_controlling_watermark_minimum`; R3 contract `/inherited_integrity/controlling_references` |
| Mutation consequence | Holds. Any included watermark change invalidates before use, emits a receipt and creates no approval, delivery or external effect even with unchanged sources and Brain. | R5 blueprint line 36 and lines 50-54; R5 contract `/dependent_watermark_change_result`, `/dependent_watermark_change_receipt`, `/dependent_watermark_change_creates_approval_delivery_or_external_side_effect`, `/applies_when_sources_and_brain_versions_are_unchanged` |
| Lineage confinement | Holds. Unrelated same-customer or same-workspace change does not invalidate a projection without recorded dependency lineage. | R5 blueprint line 38 and line 58; R5 contract `/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection` and `/identical_resolving_test/unrelated_lineage_control_projection_remains_eligible_if_otherwise_current` |
| Rebuild and authority | Holds. Rebuild alone does not restore eligibility; trusted reevaluation and separate exact named-leader Release authority are required. | R5 blueprint lines 40-42 and line 56; R5 contract `/rebuild_alone_restores_eligibility`, `/eligibility_after_rebuild_requires`, `/changes_release_authority_owner` |
| Architecture scope | Holds. R5 creates no canonical root and changes no Release owner. | R5 blueprint lines 22-24 and 42; R5 contract `/normative_precedence/new_canonical_root` and `/dependent_release_watermark_closure/creates_new_release_or_dependency_root` |
| Proof boundary | Holds. Inspection proves written semantics only; atomic runtime traversal and use-time enforcement are later proof. | R5 blueprint line 60; R5 contract `/identical_resolving_test/architecture_gate_proof` and `/runtime_gate_proof`; R5 delta `/forbidden_interpretations/4` |

## Later-gate watchpoints

These are not G24.A vetoes.

1. **Atomic check and use:** The first Release-capable implementation must show there is no schedule in which a challenger or policy version changes after eligibility is read but before use succeeds. The receipt, invalidation and blocked use must share an enforceable atomic boundary or an equivalent fail-closed protocol.
2. **Complete lineage materialisation:** Schema and validators must derive every applicable dependency, not hard-code only the R5 minimum array. Tests should mutate inherited permission, audience, canonical assertion, decision-frame, validity and retention controls while source and Brain versions remain fixed.
3. **Receipt idempotency and failure:** Retry, duplicate event, stale writer and partial failure tests must prove exactly one effective append-only invalidation outcome and zero Release side effects. A green invalidation status without a durable receipt is failure.
4. **Unrelated-lineage isolation:** Large same-workspace graphs must prove that traversal follows recorded edges and does not degrade into customer-wide or workspace-wide invalidation.
5. **Delivery, revocation and erasure:** These remain later runtime and data gates, including atomic delivery revalidation, retention expiry, revocation and erasure traversal, export residue and non-recall limits. Exact inherited locator: `g24-product-system-contract-r3.json`, `/later_gate_requirements/delivery_data_and_cutover`.
6. **Comprehension and interaction:** Fresh participant comprehension, progressive disclosure, consequence comprehension, failed-save recovery and one-handed phone use remain G24.D evidence, not architecture facts. Exact inherited locator: `g24-product-system-contract-r3.json`, `/later_gate_requirements/g24_d`.
7. **Decision and commercial value:** Session usefulness, decision-quality delta, return, continuation value and willingness to pay remain founder and pilot proof. Exact inherited locator: `g24-product-system-contract-r3.json`, `/later_gate_requirements/founder_and_pilot`.

## Preserved strengths and closed actions

The amendment is confined to one seam by `g24-product-system-blueprint-r5.md` lines 20-24, `g24-product-system-contract-r5.json` `/normative_precedence` and `g24-product-system-r5-delta.json` `/allowed_repair_areas`. The following protected architecture remains intact on inspection:

- the one canonical Brain and existing R1 Release object, with no new validity, evidence, policy, challenger or dependency root;
- human ownership of purpose, standards, exceptions, judgement, final call, final quality and exact Release authority;
- the exact six-state, thirteen-edge engagement graph and its separation from Release;
- the exact five selector outputs, fail-closed invalid control and guarded handling of valid unresolved evidence;
- immutable history, correction and dependency lineage;
- decision-specific material effect and the one versioned human-facing intervention atom;
- one visible customer question or action with policy, watermark, receipt and lifecycle machinery backstage;
- thirty days as an intensive proof window, explicit human continuation, quiet and abstention, pull-only Krish session control, and headless proof before material interface polish; and
- Qualified Judgement Transfer and Question Yield remaining unproven hypotheses.

Exact R5 locators are blueprint lines 62-82, contract `/protected_strengths` and delta `/preserved`. Exact inherited anchors include R4 blueprint lines 55-111 and 113-178, R3 contract `/inherited_integrity`, `/intervention_atom` and `/later_gate_requirements`, and R1 blueprint lines 187-248 and 582-595.

The R5 and R4 machine contracts contain the same ordered 16-item `/authority/closed` array, mechanically compared with no additions or removals. The preserved closed actions are: `production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release` and `legacy_backend_deletion`. `g24-product-system-r5-delta.json` `/external_actions_opened` is an empty array.

## Veto repair and resolving test

Not applicable. No current-gate defect was found, so no veto or amendment repair is proposed. The later runtime gate must run the identical resolving test already frozen at `g24-product-system-blueprint-r5.md` lines 44-60 and `g24-product-system-contract-r5.json` `/identical_resolving_test`, including an adversarial concurrent schedule. Passing architecture inspection must not be reported as passing that runtime test.

## Owner decision

No Behavioural and Implementation Reality break was identified under the exact accepted standard and frozen hashes. Advance this specialist result as `PASS_WITH_WATCHPOINTS`; the council and founder retain the decision, and the later gates retain every implementation, usability, efficacy, commercial and external-action proof.
