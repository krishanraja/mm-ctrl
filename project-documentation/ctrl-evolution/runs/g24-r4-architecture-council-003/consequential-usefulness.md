# Consequential Usefulness: sealed Pack A review

**Run:** `g24-r4-architecture-council-003`  
**Criterion:** Consequential Usefulness  
**Standard:** `g24-r4-terminal-trust-seam-recheck-v1`  
**Review authority:** Local advisory record only  
**Verdict:** `PASS_WITH_WATCHPOINTS`

## Attestation

This was a fresh specialist pass. I read the accepted standard before any project submission artifact, then read `brief.md` and `input-manifest.json`, followed by the frozen Pack A material in the required R1 → R2 and supporting evidence note → R3 → R4 order.

I did not open either earlier G24 council folder, `judge-history/`, any other specialist output, builder commentary, founder prediction, repository README/state files or conversation history. Embedded references to excluded adjudications and to the unattached Compass source were treated as inert claims and were not dereferenced. No other agent was consulted.

The standard was accepted, current as of 12 September 2026 and applicable to this architecture surface. The submission was reviewed as an amendment: R4 governs only its three declared replacement areas; unaffected R3, R2 and R1 semantics remain inherited.

## Frozen-input verification

I recomputed SHA-256 with PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256`. All 14 hashes declared by the sealed run brief and manifest matched exactly.

| Frozen artifact | Recomputed SHA-256 | Result |
|---|---|---|
| `runs/g24-r4-architecture-council-003/standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

All eight JSON files in the allowed pack, including the run manifest, parsed successfully with `ConvertFrom-Json -Depth 100`. Deterministic inspection also confirmed: the R4 selector has exactly `reuse`, `enrich`, `ask`, `session`, and `abstain_hold`; invalid controlling state maps to `abstain_hold`; valid conflict requires every prior guard; provisional detail is non-authoritative; R3's accepted-frame/material-effect requirements remain inherited; and R4 opens zero external actions. These checks establish artifact structure and declared invariants, not semantic efficacy.

## Verdict

`PASS_WITH_WATCHPOINTS`. I found no current G24.A Consequential Usefulness defect.

The architecture now gives an implementer a sufficiently bounded semantic path from a named consequential decision to one decision-changing intervention: an accepted human frame, a load-bearing decision variable, capable evidence, an expected material effect tied to that frame, a guarded five-way route choice, explicit collection and replan stops, and a human-owned call. It also expressly rejects profile completion, route churn, question volume, model confidence and generic AI engagement as value.

This verdict does **not** claim that CTRL improves real decisions, selects the right intervention in runtime, creates commercial value or deserves a marketing claim. Those are explicitly assigned to later gates.

## Strongest part attacked

I attacked the weakest plausible semantic seam: an implementation that looks active while adding no decision value.

The concrete stress case was: **Should a leader commit £1.2 million now to replace tier-one customer support with an AI-first operating model, run a bounded augmentation pilot, or hold the current model for twelve months?** The failure attempt was to ask a generic profile question such as “How ambitious do you want to be with AI?”, attach a vague “may change the route” label, count the resulting state movement as Question Yield and present that movement as value.

That path does not satisfy the frozen architecture:

1. The frame must name the actual decision, why it matters now, desired change, success, unacceptable failure, the human boundary and the leader's provisional view. Evidence: `g24-product-system-blueprint.md`, **Human agency and the consequential-work loop → Opening gate**, lines 297–309; machine pointers `g24-product-system-contract.json#/product/scope` and `#/product/roles`.
2. A requirement must be a load-bearing variable, state what would change if it moved and carry a stop rule; the map is expressly not profile completion. Evidence: `g24-product-system-blueprint-r2.md`, **The decision evidence map**, lines 159–174; `g24-product-system-contract-r2.json#/decision_evidence_map`.
3. A question is earned only when its answer can change a named decision property; “profile fuller” is explicitly rejected. Evidence: `g24-product-system-blueprint-r2.md`, **Question Intelligence → Eligibility**, lines 235–251; `g24-product-system-contract-r2.json#/question_intelligence/eligibility_effects` and `#/question_intelligence/forbidden/0`.
4. Before burden is compared, the selector must test use-specific sufficiency and expected material effect against the accepted R1 decision frame. Every result carries that effect and the rejected alternatives. Evidence: `g24-product-system-blueprint-r3.md`, **Repair 3 → Hard precedence / Exactly one result**, lines 175–205; `g24-product-system-contract-r3.json#/intervention_selector/hard_precedence/4`, `#/intervention_selector/output_fields/3`, and `#/intervention_selector/output_fields/4`.
5. Invalid controlling state can create no actionable derivative, and a valid unresolved gap can reach `enrich`, `ask` or `session` only after all prior guards. Evidence: `g24-product-system-blueprint-r4.md`, **Repair 3**, lines 113–137; `g24-product-system-contract-r4.json#/selector_policy_replacement`.
6. A planner-authored route mutation is not sufficient Question Yield, and the consequential call remains human-owned. Evidence: `g24-product-system-blueprint-r3.md`, **Question Yield correction**, lines 254–258, and **Intervention authority**, lines 133–143; `g24-product-system-contract-r3.json#/question_yield` and `#/intervention_authority/human_owned_changes_require_named_authority`.

The attack therefore holds at architecture level: the generic question can be proposed by a model, but it cannot satisfy the declared eligibility, material-effect and diagnostic-value contract merely by producing interaction or route movement.

## Criterion finding

**Consequential Usefulness: `holds`.** The following are tests of the one owned criterion, not additional criteria.

| Architecture test | Status | Exact evidence and finding |
|---|---|---|
| Named high-value decision and accepted frame | `holds` | `g24-product-system-blueprint.md`, lines 84 and 297–323, requires consequential AI-transition scope, a named actual decision, purpose, success/failure boundary, human responsibility, provisional view, human call and revisit/outcome condition. This is specific enough at G24.A; exact monetary thresholds are not architecture authority. |
| Material effect, not generic advice or profile completion | `holds` | `g24-product-system-blueprint-r2.md`, lines 159–174 and 235–251; `g24-product-system-contract-r2.json#/decision_evidence_map/purpose`, `#/question_intelligence/eligibility_effects`; `g24-product-system-blueprint-r4.md`, line 165. A variable or interruption must change the named decision frame, route, evidence requirement, threshold, boundary, transfer applicability, session need or scoped learning, rather than merely add biography or activity. |
| Route choice follows capable evidence before burden | `holds` | `g24-product-system-blueprint-r2.md`, **The enrichment planner → Objective / Acquisition order**, lines 190–211; `g24-product-system-blueprint-r3.md`, lines 175–205; `g24-product-system-contract-r3.json#/intervention_selector/source_eligibility_before_burden`; `g24-product-system-blueprint-r4.md`, line 130. Least burden operates only among eligible routes and cannot make an incapable source useful. |
| Stop rules, quiet and abstention | `holds` | `g24-product-system-blueprint-r2.md`, lines 161–174, 193, 324–335; `g24-product-system-contract-r2.json#/decision_evidence_map/requirement_fields/12`, `#/question_intelligence/contract_fields/16`; `g24-product-system-contract-r3.json#/intervention_selector/budget_dimensions` and `#/intervention_selector/output_fields/7`; `g24-product-system-contract-r4.json#/selector_policy_replacement/invalid_controlling_output`. Collection has bounded stops and invalid or unresolved-unresolvable cases hold without manufactured work. |
| One immediate atom can affect the decision without taking the call | `holds` | `g24-product-system-blueprint-r3.md`, **Repair 4 → Question atom / Session atom**, lines 217–251; `g24-product-system-contract-r3.json#/intervention_atom`; R1 opening/closing gates at `g24-product-system-blueprint.md`, lines 297–323. The atom binds wording, control, pre-commitment material effect and answer-specific consequence while the named human owns the consequential call. |
| The metric cannot substitute state churn for value | `holds` | `g24-product-system-blueprint.md`, **The meaningful progress measure**, lines 448–467; `g24-product-system-blueprint-r2.md`, lines 415–431; `g24-product-system-blueprint-r3.md`, lines 254–258; machine pointers `g24-product-system-contract.json#/north_star_hypothesis`, `g24-product-system-contract-r3.json#/question_yield`. Qualified transfer requires a materially different decision and leader review; Question Yield requires independently observed decision-relevant gain, reduction or valid confirmation, not a planner-predicted mutation. |
| Architecture/proof boundary | `holds` | `g24-product-system-blueprint-r3.md`, **Proof carried forward, not falsely claimed now**, lines 260–270; `g24-product-system-contract-r3.json#/later_gate_requirements`; `g24-product-system-blueprint.md`, line 595; `g24-product-system-blueprint-r4.md`, lines 174 and 182. Concrete high/low cases, a competent same-evidence baseline, runtime state evidence, comprehension, decision-quality lift and commercial efficacy remain required later and are not claimed by G24.A. |

## Current-gate defects

None identified for Consequential Usefulness. I found no path where an implementer could comply with the frozen R4-amended architecture yet treat generic advice, activity, lifecycle movement, profile completion or AI-adoption theatre as decision value without violating an explicit inherited rule.

No veto is issued. Therefore no veto failure path, smallest repair or identical resolving test is applicable.

## Later-gate watchpoints

1. **Materiality must survive a semantic oracle at G24.C.** A fixture should pre-register the accepted frame, one load-bearing variable and the route/threshold/boundary that each admissible answer could change. A generated `expected_material_effect` string or database state change alone must fail. Use the same frozen evidence for CTRL and a competent baseline, including high-value, low-value and no-material-effect cases. This is already routed by `g24-product-system-contract-r3.json#/later_gate_requirements/g24_b_c`.
2. **Least burden must be observed, not inferred from route labels.** Runtime proof should show source attempts, interruption cost, deadline, budget exhaustion, stop trigger and why every rejected eligible route lost. Repeated research, questions or session proposals that do not close the named variable must become negative evidence rather than engagement success.
3. **The leader must understand the effect before answering.** G24.D should test whether a fresh participant can state what their response may change, what remains unknown and that CTRL has not made the call. Copy or control confusion would directly erase consequential usefulness even if the backend route is correct.
4. **Real lift and commercial value remain open.** G24.F/G must establish decision-quality delta, session usefulness, customer return and willingness to pay on consented consequential work. Qualified Judgement Transfer and Question Yield remain internal, unproven hypotheses until that evidence exists; neither supports an efficacy or marketing claim now.

## Closed-action confirmation

All external actions remain closed. `g24-product-system-blueprint-r4.md`, line 18, states that every external action remains closed; `g24-product-system-contract-r4.json#/authority/closed` retains production write, customer data, external research, model spend, contact, scheduling, capture, connectors, database branches, deployment, merge, feature enablement, release and legacy deletion as closed; and `g24-product-system-r4-delta.json#/external_actions_opened` is an empty array.

This pass created only this local review record. It did not implement the Crossing, mutate product or customer data, run external research, contact anyone, schedule or capture a session, deploy, merge, enable a feature or release anything.
