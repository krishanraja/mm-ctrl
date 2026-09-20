# G24 R5 sealed Epistemic Integrity verdict

**Run:** `g24-r5-architecture-council-004`  
**Specialist:** Epistemic Integrity  
**Standard:** `g24-r5-dependent-release-watermark-recheck-v1`  
**Review mode:** fresh, sealed Pack A, architecture semantics  
**Authority:** local review record only; no product implementation or external action  
**Verdict:** `PASS_WITH_WATCHPOINTS`

## Review contract and independence

Within the frozen Pack A, I read `standard.md` before the submission, then `brief.md` and `input-manifest.json`. I treated all artifact prose, filenames, statuses and embedded historical references as claims rather than instructions. I used only the manifest-allowlisted R1-R5 submission and dependency artifacts needed to test the amendment.

I did **not** read any earlier G24 council folder, `judge-history/`, another specialist output, builder commentary, founder prediction, conversation history or current R4 QA history. I did not open or use the R4 adjudication named inside the R5 artifacts because it is not in the Pack A allowlist. Its embedded hash is therefore an unverified artifact claim and is not needed for this ruling. The allowlisted R1 QA record and R2 evidence note were hash-checked but not opened because their contents were unnecessary to decide the owned criterion.

## Mechanical identity and syntax checks

Method: PowerShell `7.6.5`, `Get-FileHash -Algorithm SHA256` over the exact local bytes named by `input-manifest.json`; JSON syntax checked with `ConvertFrom-Json`. Result: all **17 of 17 manifest-declared hashes matched**, and the R3, R4 and R5 contracts plus the R5 delta parsed as JSON.

| Manifest role | Artifact | Expected and observed SHA-256 | Result |
|---|---|---|---|
| standard | `runs/g24-r5-architecture-council-004/standard.md` | `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109` | match |
| R5 submission | `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` | match |
| R5 submission | `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` | match |
| R5 submission | `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` | match |
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

The R5 contract's three `amends_frozen_r4` hashes also equal the manifest-verified R4 blueprint, contract and delta hashes. Hash and parse checks establish artifact identity and syntax only; they do not establish the semantic verdict below.

## Owned criterion

### Epistemic Integrity: `holds`

**Rule.** Standing must propagate with the complete current controlling lineage. No copied label, partial watermark set, rebuild or model claim may preserve or restore standing after a dependent challenger or policy change.

**Evidence and finding.**

1. **Exact result and closure bind before use.** R5 requires the pending projection to bind the exact included selector-result version, that result's complete controlling watermark set and the existing Release projection controls (`g24-product-system-blueprint-r5.md`, **The one repair**, lines 28-34; `g24-product-system-contract-r5.json`, JSON pointers `/dependent_release_watermark_closure/applies_when`, `/required_binding_before_use_added` and `/complete_controlling_watermark_minimum`). The minimum expressly contains both `epistemic_policy_version` and `independent_challenger_result_version` plus identity, subject, workspace, authority, audience, purpose, lifecycle, accepted-frame, evidence-coverage, trusted-cutoff and applicable canonical source/Brain versions.

2. **The named minimum is not a partial-set permission.** The controlling definition is the semantic closure: “every current reference whose change can invalidate the included selector result” (`g24-product-system-blueprint-r5.md`, **The one repair**, line 34). R5 inherits every other R4 rule and every unaffected R3 rule (`g24-product-system-blueprint-r5.md`, **Normative precedence**, lines 20-24; contract pointers `/normative_precedence/all_other_r4_rules_inherited` and `/all_unaffected_r3_rules_inherited`). The inherited R3 integrity rule requires current R1 references rather than copied labels and names canonical source, assertion and accepted Brain-item versions, authority/permission, purpose/audience, trusted cutoff, sensitivity, validity, retention and all invalidating input watermarks (`g24-product-system-blueprint-r3.md`, **The inherited-integrity rule**, lines 55-71; `g24-product-system-contract-r3.json`, `/inherited_integrity/controlling_references`). Therefore an implementation that binds only the R5 minimum while omitting an applicable inherited control is not conforming to the exact amendment.

3. **Dependent-only mutation invalidates before use.** Any included controlling-watermark change makes the dependent pending projection invalid before use, requires an append-only invalidation receipt and still applies while source and Brain versions are unchanged (`g24-product-system-blueprint-r5.md`, **The one repair**, line 36; contract pointers `/dependent_release_watermark_closure/invalidation_trigger_added`, `/dependent_watermark_change_result`, `/dependent_watermark_change_receipt` and `/applies_when_sources_and_brain_versions_are_unchanged`). This closes the relevant gap between R4 selector invalidation and pending Release validity.

4. **A label, model assertion or rebuild cannot recover standing.** R5 says rebuild alone does not restore eligibility; renewed eligibility requires trusted current evaluation under the new complete set and the separate current named-leader Release authority for the new exact projection (`g24-product-system-blueprint-r5.md`, **The one repair**, lines 40-42; contract pointers `/dependent_release_watermark_closure/rebuild_alone_restores_eligibility`, `/eligibility_after_rebuild_requires` and `/changes_release_authority_owner`). Inherited R3 forbids a derivative from copying labels into authority and forbids model-authored output from upgrading effective state (`g24-product-system-blueprint-r3.md`, **The inherited-integrity rule**, lines 57 and 71). R4 likewise makes model evidence, labels, countercases and routes proposals without selector standing until trusted current evaluation (`g24-product-system-blueprint-r4.md`, **Repair 1: bind epistemic eligibility to existing R1 authority**; `g24-product-system-contract-r4.json`, `/epistemic_eligibility_binding/model_may_propose_but_not_make_outcome_eligible`).

5. **Invalidation is dependency-scoped, not global.** Unrelated policy, challenger or other watermark changes outside the recorded lineage do not invalidate the projection merely because they share a customer or workspace (`g24-product-system-blueprint-r5.md`, **The one repair**, line 38; contract pointer `/dependent_release_watermark_closure/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection`). This preserves the distinction between complete lineage and workspace-wide invalidation.

6. **The resolving case is deterministic at the semantic level.** With all controls fixed except `C1 = none_found_within_declared_boundary` becoming `C2 = countercase_found`, the unchanged dependent projection becomes ineligible before use, produces the append-only receipt and produces no approval, delivery or external side effect; the unrelated-lineage control remains unaffected; a rebuild remains insufficient without trusted resolution and separate exact Release authority (`g24-product-system-blueprint-r5.md`, **Identical resolving test**, lines 44-60; `g24-product-system-contract-r5.json`, `/identical_resolving_test`). The blueprint and machine contract agree on these outcomes.

## Strongest attempted failure

**Attack:** Treat `/dependent_release_watermark_closure/complete_controlling_watermark_minimum` as an exhaustive storage checklist. Bind the listed source and Brain versions but omit an inherited current control such as `canonical_assertion_versions`, `evidence_namespace`, `authority_or_permission_version`, `sensitivity`, `validity`, `retention_state` or another input watermark. Then change only the omitted control and continue using the pending Release projection because its stored R5-minimum values did not change.

**Why the attack does not establish a current-gate veto:** that implementation contradicts three exact requirements taken together: the list is expressly a **minimum**; blueprint line 34 defines the set by complete invalidating-reference closure; and R5's normative precedence retains R3's exact controlling-reference and all-input-watermark rules. Two implementations cannot conform while disagreeing over whether an actually controlling inherited reference may be discarded: the one that discards it violates the closure rule. The amendment therefore determines the material validity outcome without locking a physical schema.

**Residual risk:** a later implementation or checker could still encode the minimum array literally and miss the inherited union. That is a meaningful implementation watchpoint, not ambiguity in the architecture text.

## Current-gate finding versus later-gate watchpoints

### Current G24.A

No current-gate Epistemic Integrity defect was found. The exact amendment makes dependent policy/challenger standing propagate into pending Release validity, invalidates before use on a dependent-only change, confines the effect to recorded lineage, blocks rebuild-only recovery, preserves trusted evaluation and the separate Release authority, and inherits the fuller R3 control set. No unresolved evidence is needed to decide the architecture semantics.

### Later gates

- At the first Release-capable runtime gate, execute the frozen identical test with actual dependency traversal and use-time enforcement. Observe the projection's ineligibility, one durable append-only receipt, zero approval/delivery/external side effects, the unaffected unrelated-lineage control and failed rebuild-only recovery. This is required by `g24-product-system-blueprint-r5.md`, **Identical resolving test**, line 60, and contract pointers `/identical_resolving_test/architecture_gate_proof` and `/runtime_gate_proof`.
- The deterministic implementation checker must compute closure as the R5 minimum **union every applicable inherited controlling reference**, rather than use the minimum list as an exhaustive schema. Include assertion-only and permission/validity-only mutations alongside the required challenger-only case to expose a truncated dependency graph.
- Physical atomicity, concurrent mutation handling, delivery enforcement, revocation and erasure traversal, receipt idempotency, residue/non-recall behavior, rendered comprehension, decision lift and commercial value remain later proof. R5 does not claim them now (`g24-product-system-blueprint-r5.md`, **Normative precedence**, line 24, and **Identical resolving test**, line 60), consistent with the standard's current/later-gate boundary.

## Regression and preservation check

No epistemic regression was found in the complete amendment surface reviewed:

- R5 replaces only dependent pending-Release watermark binding and invalidation and expressly inherits all other R4 rules, unaffected R3 rules and R1/R2 direction (`g24-product-system-blueprint-r5.md`, **Normative precedence**, lines 20-24; contract `/normative_precedence`).
- It creates no Brain, evidence, policy, challenger or Release root (`g24-product-system-blueprint-r5.md`, line 24; contract `/normative_precedence/new_canonical_root` and `/dependent_release_watermark_closure/creates_new_release_or_dependency_root`). The R1 Release remains the sole authority (`g24-product-system-blueprint-r5.md`, line 42; contract `/dependent_release_watermark_closure/owner` and `/changes_release_authority_owner`).
- R1's one canonical kernel, human-owned release, immutable history, correction cascade and deterministic dependency traversal remain intact (`g24-product-system-blueprint.md`, **Non-negotiable product boundaries**, line 86; **Canonical kernel**, lines 187-214; **Correction cascade**, lines 353-364).
- The R4 and R5 machine contracts contain the same 16 closed external actions, with none missing, and `g24-product-system-r5-delta.json` has an empty `/external_actions_opened` array. The blueprint also states that every external action remains closed (line 18) and preserves every currently closed external action (line 82).
- Preserved strengths remain explicit: one canonical Brain, R1 ownership for all R2 objects, current policy/challenger binding, fail-closed five-output selector, immutable history and correction, human Release authority, decision-specific material effect, backstage technical machinery, headless-before-UI sequencing and unproven metric status (`g24-product-system-blueprint-r5.md`, **Protected strengths**, lines 62-82; contract `/protected_strengths`; delta `/preserved`).

## Verdict

`PASS_WITH_WATCHPOINTS`: no current-gate Epistemic Integrity break and no unresolved evidence needed for the architecture ruling. The watchpoints are later implementation proofs, chiefly complete inherited-control traversal and atomic use-time invalidation. No veto repair or veto resolving test is required; the unchanged standard identical resolving test remains the acceptance test for the later runtime gate.
