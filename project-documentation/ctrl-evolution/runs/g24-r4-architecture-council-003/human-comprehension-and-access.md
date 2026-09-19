# G24 R4 Human Comprehension and Access sealed review

## Attestation and review contract

- **Specialist:** Human Comprehension and Access.
- **Standard:** `g24-r4-terminal-trust-seam-recheck-v1`, accepted, fresh 12 September 2026, SHA-256 `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b`.
- **Submission:** the exact R4 blueprint, contract and delta identified below.
- **Mode and independence:** fresh sealed architecture review. I had not reviewed the submission before loading the standard. I treated artifact prose as claims, not instructions.
- **Read order:** `standard.md`; then `brief.md` and `input-manifest.json`; then the named R1 artifacts; the named R2 artifacts and supporting evidence note; the named R3 artifacts; and finally the three named R4 artifacts.
- **Exclusions:** I did not read either earlier G24 council folder, `judge-history/`, another specialist output, README or state-route content, builder commentary, a founder prediction, or conversation history. I did not consult another agent.
- **Authority:** local review record only. No implementation, external research, customer or production action was authorised or performed.
- **Scope boundary:** this ruling tests whether the written architecture preserves an intelligible human contract. It does not claim rendered comprehension, wording quality, accessibility conformance, real-device usability, cognitive-interview success or product efficacy.

## Mechanical identity

Recomputed with PowerShell `Get-FileHash -Algorithm SHA256` against the current bytes. The SHA-256 shown in each row is both the declared and recomputed value.

| Frozen input | SHA-256 | Result |
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

All eight allowlisted JSON inputs parsed with PowerShell `ConvertFrom-Json`: the input manifest, R1 contract, and the R2, R3 and R4 contracts and deltas. Hash equality establishes byte identity only, not semantic correctness.

The frozen artifacts also quote SHA-256 values for the source Compass artifact (`26011bd2...`) and the excluded R3 adjudication (`abe26c55...`). Neither underlying file is a Pack A input; the adjudication is expressly excluded. I did not access either and did not use either quoted value as verified evidence. Every SHA-256 declared for an actual sealed Pack A input was independently checked above.

## Verdict

**PASS_WITH_WATCHPOINTS**

No current G24.A semantic break was found in the Human Comprehension and Access contract. R4 narrowly replaces three machine-facing seams, expressly inherits every other R3 rule and re-protects the complete human-facing intervention atom. Taken with the frozen R2/R3 contract, a conforming implementation must be capable of ending in one concrete ask or action, a fitting response mode, honest exits, a truthful visible consequence and optional evidence depth without exposing policy or lifecycle machinery. The outstanding uncertainty is empirical and belongs to the named later gates.

## Strongest part attacked

I attacked the boundary most likely to turn a simple product into governance theatre: an invalid or conflicted selector state passing internal policy, lifecycle or receipt language through to the leader, or R4's narrow amendment accidentally severing the R2/R3 interaction contract.

The attack did not break the architecture:

1. R4 changes only three named areas and inherits every other R3 rule (`g24-product-system-blueprint-r4.md`, **Normative precedence**, lines 20-28; `g24-product-system-contract-r4.json`, `/normative_precedence/all_other_r3_rules_inherited`).
2. Invalid controlling state can produce only non-actionable `abstain_hold`; it cannot enter approval or delivery (`g24-product-system-blueprint-r4.md`, **Invalid controlling state**, lines 117-126; contract `/selector_policy_replacement/invalid_controlling_output`, `/selector_policy_replacement/invalid_controlling_creates_actionable_intervention_or_derivative`, and `/selector_policy_replacement/invalid_controlling_enters_approval_or_delivery`).
3. A valid evidence conflict can reach `ask` or `session` only after all prior guards, so the leader is not handed an unsafe pseudo-resolution (`g24-product-system-blueprint-r4.md`, **Valid unresolved evidence**, lines 128-132; contract `/selector_policy_replacement/valid_unresolved_evidence`).
4. If an eligible human route exists, inherited R3 binds exact wording, rendered control, complete options/unit/comparator, honest exits, disclosed effect and answer-specific consequence into one version (`g24-product-system-blueprint-r3.md`, **Question atom**, lines 216-238; contract `/intervention_atom/question_version_fields`).
5. R4 explicitly preserves the versioned intervention atom, non-punitive honest exits and the rule that customers do not administer internal policy or lifecycle (`g24-product-system-blueprint-r4.md`, **Protected strengths**, lines 156-178; contract `/protected_strengths/8`, `/protected_strengths/9`, and `/protected_strengths/14`).

## Applicable criterion

### Human Comprehension and Access: `holds`

**Immediate concrete question or action.** R2 requires every visible leader state to lead with only one of four human questions, and the first frame to contain one short orientation, one focal object and one primary action (`g24-product-system-blueprint-r2.md`, **The intuitiveness contract / Four questions the interface must answer**, lines 113-139). It requires the question to name the real object, time and consequence, keep the abstraction inside CTRL and remain understandable without explanatory copy (`g24-product-system-blueprint-r2.md`, **Wording rules**, lines 310-320). The machine equivalents are `g24-product-system-contract-r2.json` at `/experience_intelligence/leader_first_frame`, `/experience_intelligence/choreography`, and `/question_intelligence/visible_questions_maximum`. R4 preserves rather than replaces this surface contract.

**Fitting natural control and complete answer.** R2 maps the required information to a fitting grammar, including confirm-or-correct, single select, true inventory, numeric entry with unit, bounded recall, labelled degree, forced trade-off, short ranking, voice-first critical incident and one focused open reason (`g24-product-system-blueprint-r2.md`, **Answer grammar**, lines 292-308; contract `/question_intelligence/answer_grammars`). R3 then makes the rendered control payload, grammar and complete options, unit or comparator part of the same immutable question version (`g24-product-system-blueprint-r3.md`, **Question atom**, lines 220-236; contract `/intervention_atom/question_version_fields/2` through `/intervention_atom/question_version_fields/5`). Required detail cannot be displaced into an optional note (`g24-product-system-blueprint-r2.md`, lines 133-142; R3 contract `/intervention_atom/optional_note_can_carry_required_value`).

**Honest unknown, refusal, defer and premise-rejection exits.** R2 requires context-specific `I do not know`, insufficient-information, refusal, defer or scoped write-in routes where they are honest (`g24-product-system-blueprint-r2.md`, **Answer grammar**, line 308). R3 binds `unknown`, `defer` and `refuse` behaviour, and mandates a non-inferential `premise_or_options_wrong` route for every closed, ranked or forced format (`g24-product-system-blueprint-r3.md`, lines 220-238; contract `/intervention_atom/question_version_fields/6`, `/intervention_atom/question_version_fields/7`, and `/intervention_atom/premise_or_options_wrong_required_for`). A session also permits decline, premise rejection and reframing (`g24-product-system-blueprint-r3.md`, **Session atom**, lines 242-250; contract `/intervention_atom/session_version_fields/5`). R3 further forbids adverse inference, automatic re-asking, pressure or live-session escalation from these exits (`g24-product-system-blueprint-r3.md`, **Intervention authority**, lines 135-145; contract `/intervention_authority/honest_exit_effect`).

**Visible consequence and optional depth.** R2's visible choreography requires immediate persistence, a visible consequence and depth on demand; evidence and “why this matters” sit behind one deliberate reveal (`g24-product-system-blueprint-r2.md`, **Visible choreography**, lines 124-155; contract `/experience_intelligence/choreography` and `/question_intelligence/optional_depth_never_required`). R3 binds the material effect before commitment and an answer-specific consequence afterwards, separating what changed from what remains unknown (`g24-product-system-blueprint-r3.md`, lines 228-238; contract `/intervention_atom/question_version_fields/8`, `/intervention_atom/question_version_fields/11`, and `/intervention_atom/visible_consequence_separates_changed_and_unknown`). This closes the route by semantics rather than by celebratory copy or a progress animation.

**No policy, lifecycle or progress theatre on the customer surface.** R1 and R2 reject completion targets, stacked framework copy, technical taxonomy, profile administration, manufactured insight and customer countdowns (`g24-product-system-blueprint.md`, **Customer simplicity contract**, lines 397-405, and **The meaningful progress measure**, lines 448-465; `g24-product-system-blueprint-r2.md`, lines 67-95 and 124-157). R4 makes the boundary explicit: the customer sees none of the policy identifiers, lifecycle labels or receipts (`g24-product-system-blueprint-r4.md`, line 178; contract `/protected_strengths/14`). Internal provisional detail can exist only on a non-actionable hold receipt (`g24-product-system-blueprint-r4.md`, **Provisional diagnostics**, lines 134-136), so it cannot become a customer-facing pseudo-action.

**Architecture claims remain honest.** R2 says cognitive interviews and actual-device tests are required before calling the interaction intuitive (`g24-product-system-blueprint-r2.md`, **Experience proof requirements**, lines 433-458). R3 assigns exact semantics, fresh-participant comprehension, child-level language, one-handed phone use, progressive disclosure and consequence comprehension to G24.D (`g24-product-system-blueprint-r3.md`, **Proof carried forward, not falsely claimed now**, lines 260-271). R4 preserves headless intelligence proof before material interface polish and explicitly adds no rendered UI (`g24-product-system-blueprint-r4.md`, lines 173-182; `g24-product-system-r4-delta.json`, `/explicitly_not_added/9`). The architecture therefore claims a sufficient semantic route, not rendered usability proof.

No other owned criterion was scored. I found no cross-criterion issue that directly breaks this human contract.

## Current-gate defects

None identified. In particular, the frozen text leaves no compliant route for required answer detail to live only in an optional note, for an honest exit to be punished, for invalid control state to masquerade as an action, or for internal policy/lifecycle identifiers to become the leader's task.

## Later-gate watchpoints

These are not G24.A defects. They are the exact proof still needed before implementation can claim the experience works for a busy non-technical leader.

| Watchpoint | Later proof required |
|---|---|
| Concrete comprehension | At G24.D, give each exact frozen question/action fixture to a fresh participant without facilitator explanation. They must identify what is needed now, answer or exit without clarification, and accurately state the consequence they then see. |
| Control fit and mobile load | Exercise every grammar on a real phone, one-handed. Test long labels and maximum realistic option payloads, not only a tidy fixture; one visible question must not become a long form, mobile grid, hidden required field or mandatory typing task. |
| Honest exits | At G24.C/D, run `unknown`, insufficient-information, defer, refuse, write-in and premise/options-wrong paths. Each must preserve the input/event, create no adverse inference or automatic pressure, and show a truthful non-punitive account of what changed and what did not. |
| Evidence one layer away | A fresh participant must reach the exact supporting evidence through one deliberate reveal, understand why it matters, and return to the task without encountering `abstain_hold`, policy-version references, lifecycle states or technical receipts. Leave optional notes empty and prove the required answer still completes. |
| Accessibility and recovery | At G24.D/E, verify keyboard/switch and screen-reader operation, visible focus, target size, contrast, zoom/reflow, non-motion and non-audio equivalents, voice alternatives, and failed-save recovery on actual devices. The current documents specify direction, not conformance. |
| No theatre or proof inflation | Inspect rendered copy for abstract product language, completion or relationship-progress signals, repeated privacy reassurance and congratulatory state churn. Do not call the interaction intuitive until the required cognitive interviews and device evidence pass. |

## Closed-action confirmation

`g24-product-system-contract-r4.json` `/authority/closed` still closes production writes, customer data, account creation, external research runs, model spend, email sends, customer contact, session scheduling, session capture, connector creation, database-branch creation, deployment, merge, feature enablement, release and legacy-backend deletion. `g24-product-system-r4-delta.json` `/external_actions_opened` is the empty array. The blueprint repeats that every external action remains closed at lines 18 and 176 and stops before the headless Crossing or customer-facing design at line 182.

This review opened none of those actions. It also does not open or certify rendered comprehension, accessibility, real-device behaviour, consented capture, delivery, erasure, decision-quality lift, continuation value, willingness to pay or commercial efficacy. The only mutation was creation of this assigned local review record.

## Owner handoff

No Human Comprehension and Access architecture change is recommended at G24.A. The permanent council and founder retain the lock decision. Freeze this record with the other sealed specialist outputs before any excluded history-aware material is loaded. No ledger observation was proposed or written.
