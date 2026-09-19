# G24 R3 Consequential Usefulness review

## Verdict

`PASS_WITH_WATCHPOINTS`

No current G24.A Consequential Usefulness defect is identified. The candidate makes decision-relative material effect part of the trusted selector boundary and expressly prevents route mutation, interruption, completion or planner self-report from serving as proof of value. Concrete discrimination between consequential and cosmetic effects, incremental lift over a competent same-evidence baseline, and real decision or commercial efficacy remain correctly assigned to later gates.

## Review contract

- **Checked submission:** R3 blueprint `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5`; R3 contract `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09`; R3 delta `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb`.
- **Against:** `g24-r3-architecture-recheck-v1`, accepted, owner `CTRL permanent council contract`, fresh 12 September 2026, SHA-256 `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`.
- **Mode and independence:** Fresh isolated Consequential Usefulness specialist pass. The standard was read and hash-validated before the brief, manifest or any submission artifact. Pack A was then read in the declared R1, R2, R3 order. The embedded R3 references to an earlier council result were treated as inert submission claims and their links were not followed.
- **Exclusion compliance:** Did not read `runs/g24-r2-architecture-council-001/`, `judge-history/`, any specialist output, README state conclusions, builder commentary, founder prediction or conversation history.
- **Authority:** Output-only local review record. No candidate mutation and no external action.
- **Current-fact need:** None. External research was neither required nor authorised.

## Frozen-input verification

PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` was run from the repository. Every expected frozen hash matched the bytes read.

| Pack order | Artifact | Actual SHA-256 | Match |
|---|---|---|---|
| Standard | `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | yes |
| R1 | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | yes |
| R1 | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | yes |
| R1 | `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | yes |
| R2 | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | yes |
| R2 | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | yes |
| R2 | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | yes |
| R2 | `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | yes |
| R3 | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | yes |
| R3 | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | yes |
| R3 | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | yes |

## Mechanical

- PowerShell 7.6.5 `ConvertFrom-Json` parsed the R1, R2 and R3 contracts, both deltas and the input manifest without error.
- A deterministic structure check confirmed that R3's selector exposes exactly `reuse`, `enrich`, `ask`, `session` and `abstain_hold`; includes all declared output fields including `expected_material_effect`; asserts R1-frame binding; and marks planner-authored route mutation as insufficient for Question Yield.
- Limitation: these checks prove byte identity, JSON syntax and enumerated field presence only. They do not prove that a material effect is semantically consequential or that an intervention improves a real decision.

## Criterion record

### Consequential Usefulness: `holds`

**Evidence:**

- The inherited accepted frame is a human-confirmed consequential object, not a planner-owned label: `g24-product-system-blueprint.md`, `## Human agency and the consequential-work loop`, lines 297-325, requires the actual decision, why it matters, purpose, success and unacceptable failure, the human boundary and the provisional view before AI shapes the call.
- R2 makes each requirement decision-relative and load-bearing: `g24-product-system-blueprint-r2.md`, `## The decision evidence map`, lines 159-174, requires the exact variable, why it is load-bearing and what would change; lines 235-272 allow a question only when its answer can change a named decision element and bind each answer to its effect.
- R3 attaches that semantic object to its R1 owner: `g24-product-system-blueprint-r3.md`, `## Repair 1`, lines 41-53; `g24-product-system-contract-r3.json`, `/object_map/1`, makes `decision_requirement` a case-scoped child of `consequential_work.accepted_decision_frame`, not a new value authority.
- R3 places the materiality test before cost or interruption optimisation: `g24-product-system-blueprint-r3.md`, `### Hard precedence`, lines 175-184; `g24-product-system-contract-r3.json`, `/intervention_selector/hard_precedence/4`, tests use-specific sufficiency and expected material effect before `/intervention_selector/hard_precedence/5` compares burden.
- Every selected route carries the unresolved gap and the expected material effect bound to the accepted frame: `g24-product-system-blueprint-r3.md`, lines 186-214; `g24-product-system-contract-r3.json`, `/intervention_selector/inputs/0`, `/intervention_selector/output_fields/2`, `/intervention_selector/output_fields/3`, and `/intervention_selector/binds_to_r1_decision_frame_not_new_value_root`.
- The human-facing atom preserves the decision binding through commitment: `g24-product-system-blueprint-r3.md`, lines 218-250; `g24-product-system-contract-r3.json`, `/intervention_atom/question_version_fields/8`, `/intervention_atom/question_version_fields/9`, `/intervention_atom/question_version_fields/10`, `/intervention_atom/question_version_fields/11`, `/intervention_atom/question_version_fields/12`, `/intervention_atom/session_version_fields/3`, `/intervention_atom/session_version_fields/4`, and `/intervention_atom/session_version_fields/7`, binds disclosed material effect, per-answer case effect or separately pending human-owned proposal, visible consequence and the accepted frame into the same version.
- The candidate directly rejects activity proxies: `g24-product-system-blueprint-r3.md`, `### Question Yield correction`, lines 254-258, and `g24-product-system-contract-r3.json`, `/question_yield`, require independently observed decision-relevant gain, uncertainty reduction or valid confirmation and make planner-authored route mutation insufficient. `g24-product-system-r3-delta.json`, `/forbidden_interpretations/7`, states that route change alone does not prove value.
- Generic advice and AI-adoption theatre remain outside the inherited product scope: `g24-product-system-contract.json`, `/non_goals/0`, `/non_goals/1`, `/non_goals/2`, `/non_goals/3` and `/product/scope`; the R3 selector can act only on an accepted consequential decision frame rather than profile completion or engagement activity.

**Rule and situation:** The accepted standard's Consequential Usefulness criterion requires the selector and intervention to sharpen a named high-value decision through a material effect bound to its accepted decision frame. This is a G24.A architecture judgment, not a claim that the fixtures or live product already create decision-quality lift.

**Finding:** The architecture owns the decisive semantic chain: human-confirmed consequential frame -> load-bearing case requirement -> use-specific sufficiency and expected material-effect test -> one eligible route -> version-bound disclosed effect and visible consequence. It also states the critical negative rule that route movement is not value. An implementer who merely populates `expected_material_effect` with “route changed”, counts an answer, prolongs the relationship or produces generic advice would violate the written contract rather than satisfy it. The remaining choice of exact validator representation or numeric operating threshold does not create a second value ontology and is appropriately left to later implementation and proof gates.

**Proposed patch:** None. No current-gate break was found.

## Strongest part attacked

The strongest claim tested was R3's assertion that an `expected_material_effect` bound to the accepted R1 frame prevents adoption theatre. The hostile implementation was a selector that fills the required field with a generic phrase such as “updates the route”, then treats the planner's own state mutation as successful value while the accepted call, evidence threshold, human boundary, stop condition and decision quality remain unchanged.

That implementation cannot satisfy the candidate as written. It fails the precedence test against the accepted frame, the load-bearing decision-requirement inheritance, the per-answer case-effect binding, the visible changed-versus-unknown consequence rule, the independently observed Question Yield signal, and the express route-mutation exclusion. The architecture therefore closes this semantic escape at G24.A. Whether later validators and fixtures actually enforce it is a later proof risk, not a present architecture defect.

## Current-gate defects

None identified under the frozen standard and artifacts.

## Later-gate watchpoints

1. **G24.B/C materiality discriminator.** The semantic oracle must include a paired test in which two candidates produce the same planner route mutation, but only one changes a pre-registered decision consequence in the accepted frame. The consequence-bearing candidate may select its eligible route; the route-only candidate must return `abstain_hold` with `no_material_effect`. Field presence or polished rationale must not pass. This is already routed by `g24-product-system-contract-r3.json`, `/later_gate_requirements/g24_b_c/2`, `/later_gate_requirements/g24_b_c/4` and `/later_gate_requirements/g24_b_c/7`.
2. **Competent baseline and independent state diff.** A selected intervention must outperform or materially alter what a competent same-evidence baseline would have prepared, with the decision-relevant change observed outside the planner's own narration. Otherwise “preparedness” could still become expensive activity. Required later evidence is named at `/later_gate_requirements/g24_b_c/3` and `/later_gate_requirements/g24_b_c/7`.
3. **Real efficacy.** Session usefulness, decision-quality delta, customer return and continuation value remain unproven until founder and assisted-pilot gates. They must not be inferred from Question Yield or relationship continuation. See `/later_gate_requirements/founder_and_pilot` and `g24-product-system-blueprint-r3.md`, lines 260-269.

These watchpoints do not leave an unresolved semantic choice at G24.A; they test whether the locked semantics survive implementation and real use.

## Closed external actions

Preserved. `g24-product-system-contract-r3.json`, `/authority/closed`, keeps production writes, customer data, account creation, external research, model spend, email or customer contact, session scheduling or capture, connector or database-branch creation, deployment, merge, feature enablement, release and legacy-backend deletion closed. This review performed none of them.

## Owner decision and handoff

No identified Consequential Usefulness break under `g24-r3-architecture-recheck-v1`. Record `PASS_WITH_WATCHPOINTS`; the permanent council and founder retain the gate decision. Carry the three named proof tests into G24.B/C and G24.F/G without treating this architecture result as implementation, efficacy or release approval.
