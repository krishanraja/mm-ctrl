# Human Comprehension and Access verdict

**Run:** `g24-r2-architecture-council-001`

**Verdict:** `PASS_WITH_WATCHPOINTS`

**Decision:** R2 is fit to present as an architecture direction. It materially strengthens the path to a devastatingly simple interaction without flattening the decision beneath it. It does **not** prove that the interaction is intuitive, usable by a child, or even answerable in rendered use. Two bounded contract repairs and fresh observed evidence must remain gate-blocking before any such claim is made.

No comprehension veto applies to the architecture lock because the submission preserves the later experience gate, explicitly says the customer UI is not built, and forbids treating documentation as usability proof. If founder lock is presented as approval of an already-intuitive experience, or if the headless fixture is allowed to stand in for semantic and rendered testing, this verdict becomes `VETO`.

## Review integrity

I reviewed in a fresh specialist context. I loaded the council brief and this judge's durable history before the frozen submission. I did not open any other verdict from this council. The supporting evidence note was treated as evidence rather than authority, in accordance with `brief.md` lines 24–28 and its own source boundary at `question-and-enrichment-evidence-2026-09-12.md` lines 5–18.

Authority remained output-only. No external action, implementation, source artifact or prior ruling was changed.

### Freeze verification

PowerShell `Get-FileHash -Algorithm SHA256` was run from the repository against every R2 input named in `brief.md` lines 11–18 and every R1 baseline artifact named in `g24-product-system-r2-delta.json` at `$.baseline.artifacts`. All expected and observed hashes matched byte for byte.

| Artifact | Verified SHA-256 | Result |
|---|---|---|
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| `question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| R1 `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| R1 `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| R1 `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |

Both R2 JSON files parsed successfully with PowerShell `ConvertFrom-Json`. This establishes file identity and syntax only. It does not establish semantic answerability, cognitive accessibility or rendered usability.

## Standard applied

The durable owned truth is that “a busy non-technical person can understand the immediate state and answer one useful question without decoding product or consulting language” (`judge-history/human-comprehension-and-access.md` line 3).

The controlling refinements are:

- the Brain performs the interpretation; the person supplies one choice, number, explicit threshold, short fact or concrete incident they can know now, with unknown remaining safe (`judge-history/human-comprehension-and-access.md` lines 21–33);
- the question, controls and route effect ask for the same answer type, in ordinary business language, while deeper detail stays optional (`judge-history/human-comprehension-and-access.md` lines 47–54);
- fixed choices cover plausible answers or offer a genuine write-in, without relying on hidden context (`judge-history/human-comprehension-and-access.md` lines 60–65); and
- accessibility must preserve consequential specificity and the full analytical depth beneath the immediate ask (`judge-history/human-comprehension-and-access.md` lines 14–16 and 32–33).

## Criterion findings

### 1. Immediate-state legibility — holds at architecture level

**Evidence:** The leader surface must answer exactly one of four ordinary-language questions first, and the first frame is limited to one short orientation, one focal object and one primary action (`g24-product-system-blueprint-r2.md`, “Four questions the interface must answer” and “Visible choreography”, lines 113–141). The machine overlay independently fixes one focal object, one primary action, one visible question, progressive disclosure and a one-column, one-handed mobile mode (`g24-product-system-contract-r2.json`, `$.experience_intelligence.leader_first_frame`).

**Finding:** This is a real comprehension contract rather than aesthetic advice. It identifies what the person must understand first and prevents explanatory furniture from competing with the answer. It preserves R1's existing customer-simplicity boundary (`g24-product-system-blueprint.md`, “Customer simplicity contract”, lines 397–405).

**Boundary:** Counting objects does not establish that the remaining object is understandable. That is handled by the semantic and observed gates below.

### 2. The system performs the interpretation — holds

**Evidence:** R2 searches accepted Brain material, authorised work, revealed behaviour and public sources before reaching a leader interaction; it asks only after lower-burden truthful sources fail (`g24-product-system-blueprint-r2.md`, “Acquisition order”, lines 195–206). A question is eligible only when its answer can change a named decision property, and profile-filling questions are forbidden (lines 237–251). The wording rule is explicit: “Do the abstraction inside CTRL. The leader supplies a choice, number, threshold, short fact or concrete incident” (lines 310–320).

**Finding:** This directly resolves the durable failure in which the leader had to diagnose causes, synthesize the system's abstractions or predict an unknowable future. The route tree at lines 25–45 also permits research, a prepared conversation or abstention rather than forcing every uncertainty through a micro-question.

### 3. Bounded answerability and honest exits — holds in the written contract

**Evidence:** Each candidate must bind an exact answer grammar, complete options or unit, per-answer effect and defer/unknown/refusal behaviour (`g24-product-system-blueprint-r2.md`, “Question contract”, lines 253–272). The answer table names the information type, matching control and relevant guardrail, including a unit for quantities, bounded period for behaviour, explicit sacrificed alternative for a trade-off, and a recent concrete incident before theory (lines 292–306). Honest unknown, insufficient-information, refusal, defer and scoped write-in states are required where relevant (line 308). Optional notes cannot carry a required value (lines 133–141).

**Finding:** This meets the durable rule that the prompt, control and route effect ask for the same thing. It also protects against the exact G21 regressions of missing units, incomplete options, circular categories and hidden required notes.

**Watchpoint:** “Where relevant” cannot become a loophole that removes an honest escape because it would lower completion. The question plan must record why each escape is or is not applicable, not merely expose a blanket boolean.

### 4. Simplicity without loss of decision sophistication — holds as a design mechanism

**Evidence:** Questions can be earned only by a route, evidence, threshold, boundary, session or learning consequence (`g24-product-system-blueprint-r2.md` lines 237–251). The answer's immediate consequence must be shown in plain language, while reasoning, evidence, standing and history remain available through deliberate progressive disclosure rather than disappearing (lines 124–157 and 333–335). The decision evidence map preserves the exact variable, why it is load-bearing and what would change if it moved (lines 159–174).

**Finding:** R2 does not obtain simplicity by reducing a consequential decision to generic sentiment. It reduces the visible burden while keeping the decision variable, route effect, counter-evidence and uncertainty underneath. This is the right architecture for the protected boundary that accessible does not mean generic or shallow.

**Watchpoint:** The consequence layer must say what changed and what did **not** become known. A celebratory “updated” state would satisfy a transition animation but destroy decision comprehension.

### 5. Atomic preservation of wording, control and effect — breaks in the machine overlay

**Evidence:** The prose says, “Question wording, controls and route effects are one versioned object. Changing one requires a new version of all three” (`g24-product-system-blueprint-r2.md` lines 253–272). However, the exhaustive machine list at `g24-product-system-contract-r2.json` `$.question_intelligence.contract_fields` contains 18 entries for IDs, variable, rationale, answer grammar, options/unit and `per_answer_effect`, but contains no visible question text, explicit version field or visible consequence wording (lines 204–223). `$.experience_intelligence.choreography` requires `show_consequence`, but does not bind the words shown to the answer-specific effect.

**Finding:** The human-readable architecture is correct, but the machine overlay does not preserve its most important comprehension invariant. A candidate can satisfy the listed machine fields while its visible wording is unversioned, semantically mismatched or unable to explain the consequence. This is a bounded contract defect, not evidence that the intended experience is wrong.

### 6. Twelve-year-old comprehension — insufficient evidence, explicitly unproven

**Evidence:** The observed gate requires a fresh participant to understand the language at “approximately a twelve-year-old reading level” without making the decision childish (`g24-product-system-blueprint-r2.md`, “Experience proof requirements”, lines 433–458). The delta explicitly forbids the interpretation that UI intuitiveness is proved by documentation (`g24-product-system-r2-delta.json`, `$.forbidden_interpretations[7]`). The customer UI is absent from the headless gate (blueprint lines 394–411), and R1's QA record likewise says no render was created (`g24-product-system-qa-record.md` lines 41–47).

**Finding:** The claim is properly deferred, so missing proof is not a current failure. But “approximately a twelve-year-old reading level” is not the same as a twelve-year-old understanding the state, answering unaided and retaining the decision's sophistication. Durable history expressly says adult paraphrase screens are not child-usability evidence (`judge-history/human-comprehension-and-access.md` lines 29–33 and 63–65).

**Machine gap:** `g24-product-system-contract-r2.json` `$.evaluation.observed_experience_evidence_required` lists only `cognitive_interview`, `actual_mobile_device`, `fresh_participant_comprehension`, `failed_save_recovery` and `consequence_comprehension` (lines 357–363). It does not encode the blueprint's explicit no-facilitator answer/defer test, child-level language boundary, depth-without-crowding test, actor/state distinction or one-handed completion requirement.

### 7. Prepared live-session access — direction holds; rendered hierarchy is unproven

**Evidence:** A session is withheld for public facts, one closed question, generic rapport, routine progress or machine-preparable work (`g24-product-system-blueprint-r2.md` lines 339–352). The operator receives a nine-part prepared brief (lines 354–368) through a pull-only ranked portfolio and retains schedule, edit, snooze, dismiss and unnecessary controls (lines 370–374; machine fields at `$.session_opportunity`).

**Finding:** The decision-specific route is comprehensible in architecture and avoids an unsolicited task stream. But the operator first-frame contract is not as precise as the leader first-frame contract. Nine brief elements plus five controls could become a dense dossier with competing actions. This is an observed-design watchpoint, not a reason to remove operator depth.

## Strongest challenge

The apparently strongest feature is “only one question is visible at a time.” It is necessary and still dangerously easy to over-credit.

G21 already showed that six short questions could pass a mechanical gate while still requiring synthesis, prediction, an undefined taxonomy, an unnamed choice or a threshold without a unit (`judge-history/human-comprehension-and-access.md` lines 26–33). One incomprehensible question is not made accessible by being alone. Serialising it can also turn a fixed questionnaire into a drip-feed questionnaire.

R2's prose answers this challenge well, but its next headless proof asks for only “one correctly typed asynchronous question” (`g24-product-system-contract-r2.json`, `$.first_crossing_extension.required_choices[2]`; blueprint lines 394–411 and 474–476). With no frozen visible wording in the machine contract, that fixture can prove route mechanics while missing the exact semantic regression this judge has repeatedly found. The headless receipt must therefore remain intelligence evidence only; it cannot clear human comprehension.

## Required repairs

These are required before the implementation can claim the R2 question contract or experience gate has passed. They do not require changing the product spine.

1. **Make the atomic question contract machine-preservable.** Add an explicit visible question payload and version identity to `$.question_intelligence.contract_fields`, plus the rendered control payload and answer-specific visible consequence contract, or an equally deterministic representation. The verifier must reject a question plan when wording, control, escape routes and per-answer effect do not share one version.
2. **Mirror the full observed comprehension gate into the machine overlay.** Preserve, by explicit fields or test IDs, the blueprint requirements to answer or defer without facilitator clarification; find depth without crowding the first view; distinguish a question, Brain interpretation and owned decision; complete the flow one-handed on a real phone; and meet the child-level language boundary without flattening the decision.
3. **Freeze exact semantic fixtures before accepting the intelligence proof.** At minimum include a confirm/correct interpretation, an exhaustive bounded choice with a real write-in where needed, a numeric threshold with unit and comparator, a forced trade-off with the sacrificed alternative, a concrete incident route, and honest unknown/defer/refusal states. Each fixture must include the exact visible wording, controls, route effect and consequence copy. A fresh isolated reviewer must assess every frozen item for bounded answerability; a structural validator is insufficient.
4. **Carry negative comprehension fixtures forward.** The verifier/review pack should explicitly reject undefined abstractions, requests for user synthesis, unsupported prediction, missing units or comparators, incomplete fixed choices, hidden required notes and circular/non-role options. Those are observed regressions from the durable history, not hypothetical style preferences.
5. **Operationalise “simple without childish.”** In the rendered test, the participant should be able to state, without facilitator rescue: the decision at stake, the single answer requested, what their answer changed, and what remains uncertain. Reading-level tooling may screen copy; it cannot substitute for this comprehension check. If the founder-facing claim is literally “a twelve-year-old can understand it,” use appropriately authorised child evidence or narrow the claim honestly to tested child-level language.
6. **Give the session opportunity a first-frame hierarchy.** The ranked portfolio card should identify the customer/decision, say why live time is worth it now in one sentence, and expose one primary next action. The nine-part brief and non-primary controls should disclose progressively. This preserves the operator's necessary depth without making Krish decode a dossier before acting.

## Blocking defects, improvements and proof boundary

**Blocking at the present architecture-direction gate:** none. The written architecture contains the correct human-comprehension mechanism, the R1 experience gate remains in force, the UI is explicitly outside the headless gate, and the submission disclaims documentation-only proof.

**Blocking before G24.C can be cited as question-quality evidence:** repairs 1, 3 and 4. Without exact versioned visible wording and independent semantic review, the headless fixture proves routing, not human answerability.

**Blocking before G24.D or any founder/customer claim of intuitiveness:** repairs 2 and 5 plus observed rendered evidence. Repository checks, founder approval, a readability score and adult paraphrase are not sufficient.

**Improvement/watchpoint rather than veto:** repair 6. It should be resolved in divergent operator concepts and actual-device testing unless the design can demonstrate an equally clear hierarchy.

## What remains unproven

- That any actual generated question is understandable and answerable without explanation. No frozen user-visible question exists in this submission.
- That one-question delivery feels calm rather than like an opaque drip-feed questionnaire over time.
- That prepared choices remain complete across real decisions and do not force nuance into an optional note.
- That a visible consequence is understood as a route change rather than mistaken for certainty, recommendation or approval.
- That progressive disclosure preserves access to evidence without hiding decision-critical uncertainty.
- That voice reduces burden for critical incidents; the evidence note labels this a hypothesis (`question-and-enrichment-evidence-2026-09-12.md` lines 39–48).
- That the ranked session opportunity helps Krish without becoming another noisy queue; the same evidence note labels this a hypothesis (lines 39–48).
- That a real phone flow is one-handed, resilient under failed save and accessible with assistive technology.
- That the language is genuinely comprehensible to a twelve-year-old, or that child-level language preserves an adult leader's understanding of the consequential decision.

## Owner handoff

The call is `PASS_WITH_WATCHPOINTS` for founder presentation of the architecture direction, not for an intuitive product claim. The sharper boundary is: lock the least-burden, decision-linked interaction doctrine; repair its machine preservation before implementation evidence is accepted; then require fresh semantic and rendered proof before saying it is simple.

Krish retains the decision to lock, repair or reject the revision. All external actions remain closed. No ledger write is proposed from this review.
