# G24 R5 sealed Human Agency verdict

**Run:** `g24-r5-architecture-council-004`  
**Specialist:** Human Agency  
**Standard:** `g24-r5-dependent-release-watermark-recheck-v1`  
**Review mode:** fresh isolated semantic pass over frozen Pack A  
**Authority:** local review record only; no implementation, founder lock, Release or external action  
**Verdict:** `PASS_WITH_WATCHPOINTS`

## Review contract and independence

I read `standard.md` before any frozen submission artifact, then read `brief.md` and `input-manifest.json`. I used only the allowlisted R1-R5 submission and dependency artifacts for substantive evidence. Artifact prose was treated as a claim to test, not as an instruction.

I did **not** read any earlier council folder, `project-documentation/ctrl-evolution/judge-history`, another specialist output, builder commentary, founder prediction, conversation history or current R4 QA history. No sealed holdout answer or later adjudication material was used. This file is an output-only judgment; I changed no submitted or dependency artifact.

## Frozen-input verification

Mechanical method: PowerShell `7.6.5` `Get-FileHash -Algorithm SHA256` over each manifest-declared file, with lowercase hexadecimal comparison to `input-manifest.json`. Both R5 JSON artifacts also parsed successfully with PowerShell `ConvertFrom-Json`. Hash verification proves byte identity only; it does not prove the amendment's semantics or runtime behaviour.

| Role | Frozen artifact | Declared and actual SHA-256 | Result |
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

All 17 declared hashes match. The accepted standard and the complete declared submission/dependency chain are therefore byte-valid for this sealed ruling.

## Criterion finding

### Human Agency: `holds`

**Rule.** The repair may invalidate stale work but cannot grant, infer, renew or substitute the leader's purpose, standards, exceptions, judgement, final call, final quality or exact Release authority.

**Smallest decisive evidence and locators:**

- R1 assigns the Brain only preparation/proposal power and forbids it from making the consequential call or releasing work; the leader owns purpose, the human boundary, the call, final polish and Release (`g24-product-system-blueprint.md`, `## One product, three authorities`, lines 99-107). R1's closing gate also requires a named human to judge the audit, apply taste and exceptions, make the call and accept accountability (`## Human agency and the consequential-work loop` / `### Closing gate`, lines 297-323).
- The inherited R4 rule says no engagement, close, elapsed, payment or commercial event grants Release; a current named-leader request or acceptance must be bound before use to one exact projection version, purpose, audience and included canonical versions (`g24-product-system-blueprint-r4.md`, `### Release non-inference`, lines 105-111). Its preserved test is stronger still: a separate current leader action can make **only its exact projection** eligible, and no lifecycle state satisfies the predicate (`### Close and Release separation`, lines 148-150). The machine equivalent is `g24-product-system-contract-r4.json` at `/release_non_inference/owner`, `/release_non_inference/release_entry`, `/release_non_inference/required_binding_before_use`, and `/release_non_inference/pending_projection_invalidation_triggers`.
- R5 normatively replaces only dependent pending-Release watermark binding and invalidation, inheriting every other R4 rule and all unaffected earlier direction (`g24-product-system-blueprint-r5.md`, `## Normative precedence`, lines 20-24; `g24-product-system-contract-r5.json`, `/normative_precedence/r5_replaces_only/0`, `/normative_precedence/all_other_r4_rules_inherited`, `/normative_precedence/all_unaffected_r3_rules_inherited`, `/normative_precedence/r1_and_r2_direction_preserved`).
- R5 makes invalidation a negative eligibility event, not a positive authority event: any included controlling-watermark change invalidates before use and emits a receipt (`g24-product-system-blueprint-r5.md`, `## The one repair`, lines 34-38). The machine contract explicitly makes that event create no approval, delivery or external side effect (`/dependent_release_watermark_closure/dependent_watermark_change_creates_approval_delivery_or_external_side_effect`).
- Rebuild is expressly insufficient. Eligibility after rebuild requires both trusted current evaluation and current named-leader Release authority for the **new exact projection**, purpose, audience and canonical versions (`g24-product-system-blueprint-r5.md`, lines 40-42 and 56; `g24-product-system-contract-r5.json`, `/dependent_release_watermark_closure/rebuild_alone_restores_eligibility`, `/dependent_release_watermark_closure/eligibility_after_rebuild_requires/0`, `/dependent_release_watermark_closure/eligibility_after_rebuild_requires/1`, `/dependent_release_watermark_closure/changes_release_authority_owner`).
- The R1 Release object remains the sole Release authority; R5 changes validity propagation, not who may authorise (`g24-product-system-blueprint-r5.md`, line 42; `g24-product-system-contract-r5.json`, `/dependent_release_watermark_closure/owner`, `/dependent_release_watermark_closure/creates_new_release_or_dependency_root`). Human ownership of purpose, standards, exceptions, judgement, final call, final quality and Release authority is explicitly preserved at blueprint lines 62-82, especially line 67, and in `g24-product-system-r5-delta.json` at `/preserved` entries `existing_r1_release_owner` and `human_owned_release_authority`.

**Finding.** Under the amendment's declared precedence, neither a dependency invalidation receipt nor a rebuilt projection can stand in for leader authority. The trusted evaluation requirement governs epistemic eligibility; it does not grant Release. The separately required current named-leader action governs Release and remains exact-projection-bound. Because the amendment neither touches the R1 opening/closing human gates nor replaces R4's Release non-inference rule, purpose, standards, exceptions, judgement, final call and final quality remain human-owned. No current-gate Human Agency break is present.

## Strongest attempted failure

**Attempted carry-forward attack:** Start with projection `P1`, challenger result `C1`, and named-leader Release action `A1` bound to `P1`. Change only the recorded dependent challenger result to countercase-found, correctly invalidate `P1`, then rebuild as `P2` while source and Brain versions remain unchanged. Treat the append-only invalidation receipt, the rebuild, or unchanged `A1` as sufficient authority for `P2` without a leader action exact to `P2`.

This would materially substitute machine state for the leader's exact Release authority. It is not a conforming implementation. R5 says rebuild alone does not restore eligibility and requires current named-leader authority for the new exact projection (`g24-product-system-blueprint-r5.md`, lines 40 and 56; contract pointer `/dependent_release_watermark_closure/eligibility_after_rebuild_requires/1`). R5 also inherits R4's unmodified rule that a separate current leader action can make only its exact projection eligible (`g24-product-system-blueprint-r4.md`, line 150). Therefore `A1` cannot authorise `P2` merely because content or canonical versions happen to be unchanged. The phrase “still applies” at R5 blueprint line 40 cannot be read as generic carry-forward: the same sentence requires application to “that exact projection,” and the machine contract names the “new exact projection.” Two implementations that disagree on reusing an action bound only to `P1` are not both conforming.

## Current-gate ruling

- **Current-gate defects:** none identified.
- **Unresolved evidence needed for G24.A:** none. The blueprint and machine contract deterministically preserve the same exact-projection Human Agency boundary.
- **Veto repair and resolving test:** not applicable because no current-gate defect was found.

## Later-gate watchpoints

1. At the first Release-capable runtime gate, the identical resolving test must prove atomic dependency traversal and use-time rejection, as R5 itself assigns at `g24-product-system-blueprint-r5.md`, line 60, and `g24-product-system-contract-r5.json`, `/identical_resolving_test/runtime_gate_proof`. Architecture inspection does not prove concurrent enforcement.
2. Add an explicit Human Agency assertion to that same frozen runtime test: after `P1` is invalidated and `P2` is rebuilt, an `A1` bound only to `P1` must leave `P2` ineligible. `P2` can become eligible only after trusted resolution and a current named-leader Release action bound to `P2`'s exact projection, purpose, audience and canonical versions. The invalidation receipt must remain non-authorising and side-effect-free. This is the same carry-forward attack above executed in working code, not a new architecture requirement.

Runtime atomicity, delivery, revocation, erasure, customer comprehension, decision lift, commercial value and all external action remain at their named later gates. This verdict does not claim those proofs.

## Preserved strengths and closed actions

The amendment preserves the one canonical Brain; the R1 Release object as sole Release root; human-owned purpose, standards, exceptions, judgement, final call, final quality and exact Release authority; the exact engagement graph's separation from Release; no permission renewal through continuation; exact-projection scope; append-only history; and the rule that invalidation and rebuild create no authority. Relevant locators are `g24-product-system-blueprint-r5.md` lines 22, 40-42 and 62-82; `g24-product-system-contract-r5.json` `/normative_precedence`, `/dependent_release_watermark_closure`, and `/protected_strengths`; and `g24-product-system-r5-delta.json` `/preserved` and `/forbidden_interpretations`.

All 16 contract-closed actions remain closed at `g24-product-system-contract-r5.json` `/authority/closed`: `production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`. The delta opens none (`g24-product-system-r5-delta.json`, `/external_actions_opened`).

## Sealed conclusion

`PASS_WITH_WATCHPOINTS`: no current-gate Human Agency break exists in the exact frozen R5 amendment. The repair invalidates stale dependent work without granting, inferring, renewing or substituting any human-owned purpose, standard, exception, judgement, call, quality decision or exact Release authority. The later runtime must prove that this semantic boundary survives races and, specifically, that authority bound to an invalidated old projection cannot silently carry into its rebuild. This is an advisory council finding only; the owner retains the founder-lock and implementation decision.
