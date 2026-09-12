# G24 R5 sealed specialist verdict: Living Brain Integrity

**Run:** `g24-r5-architecture-council-004`  
**Specialist:** Living Brain Integrity  
**Review mode:** Fresh, isolated, frozen Pack A semantic review  
**Authority:** Local review record only; no implementation, founder lock, release or external action  
**Verdict:** `PASS_WITH_WATCHPOINTS`

## Review contract and independence

The accepted standard was read before the frozen submission. The standard is `g24-r5-dependent-release-watermark-recheck-v1`, owned by the CTRL permanent council contract, accepted for this run and fresh on 12 September 2026. Its SHA-256 matches the manifest.

The submission is the exact R5 blueprint, machine contract and delta identified below. The review tested the amendment as prose and machine-readable claims, not as instructions. It used only the local Pack A standard, brief, manifest and allowlisted R1–R5 submission/dependency artifacts needed to trace canonical ownership, inherited integrity, correction, Release authority and dependency lineage.

**Exclusion attestation:** I did not open or use any earlier council folder, `project-documentation/ctrl-evolution/judge-history`, another specialist output, builder commentary, founder prediction, conversation history, or current R4 QA history. I did not inspect any R4 adjudication artifact; the adjudication hash and status embedded in the frozen R5 submission were treated only as unverified submission claims and were not needed for this verdict. No sealed holdout answer or expected verdict was loaded.

## Mechanical identity and parse checks

**Hash tool:** `Get-FileHash -Algorithm SHA256`, Microsoft.PowerShell.Utility 7.0.0.0 under PowerShell 7.6.5.  
**Scope:** Every `standard`, `submission` and `dependencies` entry declared by `input-manifest.json` (17 files).  
**Result:** 17/17 present and byte-identical to the declared SHA-256.

| Manifest role | Artifact | Declared and observed SHA-256 | Result |
|---|---|---|---|
| standard | `runs/g24-r5-architecture-council-004/standard.md` | `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109` | match |
| submission | `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` | match |
| submission | `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` | match |
| submission | `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` | match |
| dependency R1 | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| dependency R1 | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| dependency R1 | `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| dependency R2 | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| dependency R2 | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| dependency R2 | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| dependency R2 evidence | `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| dependency R3 | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| dependency R3 | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| dependency R3 | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| dependency R4 | `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| dependency R4 | `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| dependency R4 | `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

**JSON parse tool:** `ConvertFrom-Json`, Microsoft.PowerShell.Utility 7.0.0.0.  
**Scope:** `input-manifest.json` and all nine allowlisted JSON submission/dependency artifacts.  
**Result:** 10/10 parsed without error.  
**Limitation:** These mechanical checks establish byte identity and JSON syntax only. They do not establish semantic completeness, runtime traversal, concurrency safety or enforcement.

## Strongest attempted failure

### Attempt: dependency laundering through a superficially complete Release projection

I attempted to construct a conforming implementation that records selector result `S1` but omits one of the actual controls that gave `S1` standing, for example permission, decision-requirement or canonical-assertion version, because those three literal names do not appear in the R5 contract's fourteen-element `complete_controlling_watermark_minimum`. Such an implementation could rebuild or use the pending Release after an omitted control changed, while still claiming that the enumerated minimum was present. That would discard governing lineage, split current validity from the canonical Brain/evidence history, and allow two implementations to reach materially different eligibility outcomes.

The attack does **not** survive the exact amendment:

1. R5 requires the exact included selector result **and that result's complete controlling watermark set**, not merely the enumerated examples (`g24-product-system-blueprint-r5.md`, lines 28–34; contract `/dependent_release_watermark_closure/required_binding_before_use_added`).
2. The definition is universal: the set includes **every current reference whose change can invalidate the included selector result** (blueprint line 34). The contract deliberately calls its enumeration a `complete_controlling_watermark_minimum`, not an exhaustive set (`/dependent_release_watermark_closure/complete_controlling_watermark_minimum`).
3. R5 inherits every other R4 rule and every unaffected R3 rule (blueprint line 22; contract `/normative_precedence/all_other_r4_rules_inherited` and `/normative_precedence/all_unaffected_r3_rules_inherited`). R3 expressly makes permission, decision-frame/requirement, canonical assertion, freshness, validity and other input-version controls part of selector standing and invalidation (`g24-product-system-contract-r3.json`, `/inherited_integrity/controlling_references`, `/inherited_integrity/invalidation_triggers`, `/intervention_selector/inputs`, and `/intervention_selector/controlling_change_invalidates_before_use`).
4. R5 then requires **any** included controlling-watermark change to invalidate before use, including when source and Brain versions are unchanged (blueprint line 36; contract `/dependent_release_watermark_closure/invalidation_trigger_added`, `/dependent_release_watermark_closure/dependent_watermark_change_result`, and `/dependent_release_watermark_closure/applies_when_sources_and_brain_versions_are_unchanged`).

Therefore omission of an actual selector control is non-conforming; it is not a second permissible interpretation. The residual risk is implementation completeness, appropriately reserved for the later runtime gate.

## Owned criterion

### Living Brain Integrity: `holds`

**Rule:** The one canonical Brain, immutable history, corrections and projection lineage must survive. R5 may not create a second Release, challenger, policy or validity root, and a derivative may not discard the lineage governing its standing.

**Evidence and exact locators:**

- R1 defines one seven-concept canonical kernel in which `correction_and_repair` is append-only and `release` is a verified portable projection (`g24-product-system-blueprint.md`, lines 187–199; `g24-product-system-contract.json`, `/canonical_kernel`). It also requires every durable Brain item to record the releases it influenced (blueprint lines 201–214).
- R1 makes retrieval projections disposable and rebuildable rather than authoritative, requires every state transition to carry input-version watermarks and append-only before/after history, and assigns Release compilation to deterministic code (`g24-product-system-blueprint.md`, lines 220–248 and 275–280; contract `/runtime_layers` and `/model_tasks`).
- R1's correction cascade preserves the original source and prior interpretation, never overwrites history, traverses dependencies through releases, quarantines affected projections and emits repair receipts; published releases stay immutable and corrections create successors (`g24-product-system-blueprint.md`, lines 342–364).
- R3 maps all nine R2 objects to existing R1 owners with `new_canonical_root: false` (`g24-product-system-contract-r3.json`, `/object_map`) and requires derivatives to resolve standing from canonical references rather than copied labels (`g24-product-system-blueprint-r3.md`, lines 37–88; contract `/inherited_integrity/effective_state_from_canonical_references_only` and `/inherited_integrity/derivative_can_award_standing`).
- R4 keeps the existing R1 governance and independent-challenger authority as the sole epistemic owners (`g24-product-system-contract-r4.json`, `/epistemic_eligibility_binding/owner` and `/epistemic_eligibility_binding/creates_new_evidence_policy_or_challenger_root`) and the existing R1 Release object as the sole Release owner (`/release_non_inference/owner` and `/release_non_inference/creates_new_release_root`).
- R5 changes only dependent pending-Release watermark binding and invalidation; it expressly creates no new Brain, policy, challenger or Release root (`g24-product-system-blueprint-r5.md`, lines 20–24 and 42; contract `/normative_precedence/new_canonical_root`, `/dependent_release_watermark_closure/owner`, `/dependent_release_watermark_closure/creates_new_release_or_dependency_root`, and `/dependent_release_watermark_closure/changes_release_authority_owner`).
- The derivative cannot discard governing lineage: it must bind the exact selector-result version and complete controlling watermark set before use; any included change invalidates it and emits an append-only receipt (`g24-product-system-blueprint-r5.md`, lines 28–38; contract `/dependent_release_watermark_closure/required_binding_before_use_added`, `/dependent_release_watermark_closure/dependent_watermark_change_receipt`, and `/dependent_release_watermark_closure/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection`).
- Rebuild cannot manufacture current standing. Eligibility requires trusted current evaluation under the new complete set and separate exact named-leader Release authority (`g24-product-system-blueprint-r5.md`, lines 40–42; contract `/dependent_release_watermark_closure/rebuild_alone_restores_eligibility` and `/dependent_release_watermark_closure/eligibility_after_rebuild_requires`).
- The delta constrains the amendment to the single seam, preserves one canonical Brain and the R1 Release owner, opens no external action and forbids a new Release root or architecture-level runtime claim (`g24-product-system-r5-delta.json`, `/allowed_repair_areas`, `/preserved`, `/external_actions_opened`, and `/forbidden_interpretations`).

**Finding:** R5 extends the existing canonical dependency graph into pending Release validity without creating another source of truth. The Release remains a derivative portable projection of canonical accepted state; the selector result retains the full lineage that conferred standing; invalidation is append-only and lineage-scoped; and rebuild cannot overwrite, erase or self-renew standing. Corrections and prior versions remain governed by inherited R1 history and repair semantics. No credible pair of conforming implementations can differ on the current challenger-only mutation or on whether an actually controlling inherited watermark must remain bound.

## Complete-amendment regression probes

These probes support the owned criterion; they do not substitute for the other six specialist verdicts.

| Probe | Exact evidence | Current-gate finding |
|---|---|---|
| Exact selector result and complete lineage bind before use | R5 blueprint lines 28–34; contract `/dependent_release_watermark_closure/required_binding_before_use_added` | holds |
| Policy and challenger versions propagate with inherited identity, scope, authority, frame, evidence and canonical controls | R5 blueprint line 34; contract `/dependent_release_watermark_closure/complete_controlling_watermark_minimum`; inherited R3 `/inherited_integrity/controlling_references` | holds |
| Dependent-only change invalidates before use, receipts, and creates no side effect | R5 blueprint lines 36 and 46–54; contract `/dependent_release_watermark_closure/dependent_watermark_change_result`, `/dependent_release_watermark_closure/dependent_watermark_change_receipt`, `/dependent_release_watermark_closure/dependent_watermark_change_creates_approval_delivery_or_external_side_effect` | holds |
| Unrelated lineage remains unaffected | R5 blueprint lines 38 and 58; contract `/dependent_release_watermark_closure/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection` and `/identical_resolving_test/unrelated_lineage_control_projection_remains_eligible_if_otherwise_current` | holds |
| Rebuild cannot revive standing or replace Release authority | R5 blueprint lines 40–42 and 56; contract `/dependent_release_watermark_closure/rebuild_alone_restores_eligibility`, `/dependent_release_watermark_closure/eligibility_after_rebuild_requires`, `/dependent_release_watermark_closure/changes_release_authority_owner` | holds |
| Single-seam precedence and inherited architecture remain intact | R5 blueprint lines 20–24 and 62–82; contract `/normative_precedence`; delta `/allowed_repair_areas` and `/preserved` | holds |
| Architecture does not claim runtime proof | R5 blueprint line 60; contract `/identical_resolving_test/architecture_gate_proof` and `/identical_resolving_test/runtime_gate_proof`; delta `/forbidden_interpretations/4` | holds |

## Current-gate findings

**No current-gate defect identified.** The exact R5 text determines the required validity, authority and safety outcome for both the dependent challenger mutation and the unrelated-lineage control. It preserves the inherited canonical Brain and Release ownership, immutable receipt/history model, correction traversal and projection lineage. It does not open an alternate validity root.

The standard's identical resolving test is stated in both prose and machine form. Holding every dependency fixed and changing only the recorded dependent challenger result from `none_found_within_declared_boundary` to `countercase_found` makes the unchanged pending projection ineligible before use, requires an append-only invalidation receipt, produces no approval/delivery/external side effect, leaves an unrelated control projection unaffected, and prevents rebuild-only renewal (`g24-product-system-blueprint-r5.md`, lines 44–60; `g24-product-system-contract-r5.json`, `/identical_resolving_test`).

## Later-gate watchpoints

These are not G24.A defects and do not weaken the verdict:

1. At the later first Release-capable runtime gate, prove that the stored dependency closure is complete, not merely that the fourteen named minimum members exist, including inherited permission, decision-requirement, assertion, freshness, validity, sensitivity, retention and any further input watermark that actually governs the selector result.
2. Prove atomic traversal and use-time revalidation under concurrent challenger/policy/correction changes: no pending projection may pass use while its invalidation receipt is absent or racing.
3. Prove lineage isolation with adversarial fixtures: the dependent projection invalidates, an otherwise-current unrelated projection does not, and no shared workspace/customer shortcut widens the invalidation set.
4. Prove immutable-event behavior and correction survival across rebuild, successor Release creation and clean-room import. Published releases must remain immutable; correction must produce a successor plus changelog rather than silently rewriting prior bytes.
5. Keep delivery, revocation, erasure, residue/non-recall, comprehension, decision lift, commercial value and all external action at their named later gates. R5 itself expressly reserves runtime proof (`g24-product-system-blueprint-r5.md`, line 60).

## Preserved strengths and closed actions

The amendment preserves one canonical Brain; all nine R2 objects mapped to existing R1 owners; the existing R1 Release owner; immutable history, corrections, audience limits, portability and self-healing; human-owned purpose, judgement, final quality and Release authority; exact selector and lifecycle semantics; backstage technical machinery; decision-specific material effect; unproven status for Qualified Judgement Transfer and Question Yield; and headless proof before material UI (`g24-product-system-blueprint-r5.md`, lines 62–82; contract `/protected_strengths`; delta `/preserved`).

All external actions remain closed. The machine contract explicitly closes production write, customer data, account creation, external research runs, model spend, email send, customer contact, session scheduling/capture, connector or database-branch creation, deployment, merge, feature enablement, release and legacy-backend deletion (`g24-product-system-contract-r5.json`, `/authority/closed`). The delta opens none (`g24-product-system-r5-delta.json`, `/external_actions_opened`).

## Verdict rationale

`PASS_WITH_WATCHPOINTS` is warranted. No current-gate Living Brain Integrity break remains, and no unresolved Pack A evidence is needed to decide the architecture question. The amendment makes dependent standing propagation mandatory, retains one canonical validity lineage and one Release authority, and keeps immutable correction/receipt history intact. The named watchpoints concern physical completeness, atomic enforcement and operational proof at later gates, exactly where the standard places them.

No repair is proposed because no veto is found. The unchanged identical resolving test in `standard.md` remains the required later implementation test.
