# Human Agency judgment

## Verdict

**VETO**

R2 preserves the approved role split in intent and keeps current external actions closed, but its new adaptive-question and engagement objects do not yet make that split executable at the point where agency can be lost. A conforming implementation could persist a leader answer and use it to change the decision frame, success or kill condition, or human-versus-AI boundary before the leader has seen and accepted that consequence. It could also move an engagement into open-ended `continuing` without a named human transition authority. Those are architecture defects, not merely usability questions.

This is an advisory Human Agency veto against founder lock of the frozen R2 architecture. It does not authorise a change, implementation, delivery, session, notification or other external action.

## Review basis and independence

- Fresh specialist context. The frozen brief and submission were read before this judge's durable history. No other G24 R2 judge output or adjudicator conclusion was read.
- All four submission hashes matched the council brief: R2 blueprint `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980`; R2 contract `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2`; delta `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2`; evidence note `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb`.
- The inherited R1 blueprint and contract also matched the hashes named by R2: `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` and `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba`.
- The research note is supporting evidence only. It says its citations, numerical claims and universal defaults were not independently reverified (`question-and-enrichment-evidence-2026-09-12.md`, “Source boundary”, lines 7–18). No Human Agency finding below treats it as authority.

## Evidence-backed findings

### The human-owned call remains intact in the stated architecture  -  holds

R1 gives the Brain only preparation and proposal rights, gives Krish challenge and interruption control, and reserves purpose, judgment, the call and release ownership to the leader (`g24-product-system-contract.json#/product/roles`). Its opening gate requires a named human to supply or confirm the decision, purpose, success and unacceptable failure, human responsibility and provisional view before AI shapes the decision; its closing gate requires a named human to judge the audit, make the call and accept accountability (`g24-product-system-blueprint.md`, “Human agency and the consequential-work loop”, lines 297–325).

R2 explicitly extends the frozen R1 artifacts, lists `brain_krish_leader_authority` and `human_owned_consequential_work` as preserved invariants, and says models may only propose the new objects while no model may promote a Brain item, widen an audience, send a message or schedule a person (`g24-product-system-contract-r2.json#/extends`, `#/preserved_r1_invariants`; `g24-product-system-blueprint-r2.md`, “Logical objects added by this extension”, lines 376–392). Nothing in R2 expressly grants the machine the final call.

That is a real strength. It is not enough to clear the new intervention transitions below.

### Adaptive questions are not bound to the human authority they can modify  -  breaks, blocking

The R2 question planner may use an answer to change the `decision_frame`, `success_threshold_or_kill_condition` or `human_ai_boundary` (`g24-product-system-contract-r2.json#/question_intelligence/eligibility_effects`). Those are matters the inherited opening gate assigns to a named human. Yet the R2 question object requires only a `decision_id`, missing variable, respondent, answer grammar, per-answer effect, sensitivity, audience and operational metadata. It does not require the exact human-confirmed purpose/frame version, human-boundary version, leader-prior version, or authority whose acceptance is needed for each proposed effect (`#/question_intelligence/contract_fields`).

The visible choreography compounds the defect: it says to accept the response, “persist it immediately” and then “show the consequence” (`g24-product-system-blueprint-r2.md`, “Visible choreography”, lines 124–139). The consequence exists inside the versioned object, but R2 does not require a material consequence to be disclosed before the answer or require a second human acceptance before an answer changes a human-owned frame or boundary.

Inheritance language cannot substitute for this binding. This judge's durable standard is that agency must be an executable capability boundary on every emitted input, not reassuring prose. A validator could accept every listed R2 question field while still allowing trusted application code to turn a model-framed answer into an authoritative state change. “The model did not write or send it” does not cure application code acting without the named human authority.

### Krish's control is explicit for sessions but under-specified for recomputed questions  -  breaks, blocking

The session route is well bounded: its initial OS route is pull-only; unsolicited push is false; and Krish can schedule, edit, snooze, dismiss or mark an opportunity unnecessary (`g24-product-system-contract-r2.json#/session_opportunity`). The blueprint likewise says the system does not send an unsolicited push and cannot schedule a person (`g24-product-system-blueprint-r2.md`, “Current OS boundary”, lines 370–374; “Logical objects”, lines 376–392).

The question path is weaker. R1 says Krish controls whether and when the leader is asked (`g24-product-system-blueprint.md`, “One product, three authorities”, lines 99–107; “Email and customer prompting”, lines 435–442). R2, however, requires prepared questions to be recomputed after every answer without specifying that every recomputation returns to an undeliverable proposal state and invalidates any earlier delivery approval (`g24-product-system-contract-r2.json#/question_intelligence/prepared_questions_recomputed_after_each_answer`). `intervention_delivery` is named as an object that records approval, but the contract does not require the approval actor, permitted state transition or version match (`g24-product-system-blueprint-r2.md`, “Logical objects”, lines 376–392).

External delivery is closed in this gate, so no current customer action is authorised. The defect is that the architecture proposed for lock does not yet guarantee Krish's control when delivery later opens.

### The strongest-looking mechanism can still manufacture the choice architecture  -  breaks, blocking

The strongest part of R2 is the versioned question contract: wording, answer control and route effect move together; the leader's prior comes before the system preference; questions are single-purpose; and abstention, correction, deferral and refusal are contemplated (`g24-product-system-blueprint-r2.md`, “Question contract”, lines 253–272; “Answer grammar” and “Wording rules”, lines 292–320; `g24-product-system-contract-r2.json#/question_intelligence`).

Challenge: versioning proves consistency, not legitimacy. The same machine can author the premise, declare its options “complete”, choose a forced trade-off, pre-register the effects and then measure whether the answer changed the route. The contract has no universal “the premise is wrong / none of these options fits” route for closed or forced formats. Its escape routes are conditional on what the planner considers an “honest possible state” (`g24-product-system-blueprint-r2.md`, line 308). That leaves the planner able to close the very escape route needed to contest its frame.

The internal incentive also remains unsafe. R2 says that if nothing changed, the question should not have been sent, while Question Yield rewards route, boundary and stop-condition changes (`g24-product-system-blueprint-r2.md`, lines 333–335 and 413–431; `g24-product-system-contract-r2.json#/evaluation/question_yield`). Without explicit neutral treatment of refusal, deferral, uncertainty and premise rejection, the optimiser can learn that questions which force a change are “better”. The listed priming and overreach guardrails help, but do not define the non-coercive state transition.

### Prepared sessions remain proposals, but leader control of the premise is not yet proven  -  insufficient evidence

The prepared agenda is specific and Krish-editable, and the system cannot schedule it. Those controls prevent a machine-owned session at the current architecture boundary (`g24-product-system-blueprint-r2.md`, “When Krish should run a live session”, lines 337–374).

What is not established is whether the leader sees and can reject or redefine the decision premise, purpose and desired end state before the machine-authored “trade-off” and “pressure point” ladder structures the conversation (`g24-product-system-blueprint-r2.md`, “The prepared brief”, lines 354–368). R1's opening gate should govern, but R2 does not bind the session opportunity to its accepted version or make leader refusal/reframing a required session outcome. This must be closed with the same authority repair as questions and then observed with real participants.

### Open-ended continuation lacks a named transition authority  -  breaks, blocking

R2 correctly separates relationship duration from source permission and says continuation cannot silently renew consent, widen audience or extend retention (`g24-product-system-blueprint-r2.md`, “The relationship is longer than a timer”, lines 67–95). The delta also forbids the interpretation that an engagement continues without explicit state or permission (`g24-product-system-r2-delta.json#/forbidden_interpretations`).

But the machine contract says only that `continuing` has no assumed end, `ends_at` is optional and review is not shutdown. It does not name who may transition an engagement into `continuing`, require mutual human agreement, or require a receipt for that choice (`g24-product-system-contract-r2.json#/engagement_lifecycle`). A no-expiry state without explicit entry authority can become continuation by default. That conflicts with the delta's own forbidden interpretation and weakens both leader and Krish control.

## Required repairs before Human Agency can clear R2

1. Bind every `question_plan` and `session_opportunity` to exact accepted versions of the human-confirmed decision, purpose, success/failure boundary, human-versus-AI boundary and leader prior. A stale or missing binding must fail closed.
2. Add an explicit authority transition. Model output remains `proposed`; every new or recomputed leader-facing question requires a version-matched Krish `approve`, `edit`, `suppress` or `hold` decision before delivery. Recomputing a question must invalidate prior approval. Trusted application code must refuse delivery without that receipt.
3. Split `per_answer_effect` into low-consequence case updates and proposed changes to human-owned purpose, success/kill conditions, human boundaries, durable judgement or learning. A response may itself be the authority event only when the material consequence is explicit before commitment and the respondent is the named authority. Otherwise, stage the change for that person to accept, edit or reject; an ordinary answer alone cannot promote it.
4. For every closed, ranked or forced format, require a visible `premise_or_options_wrong` route in addition to context-appropriate `unknown`, `defer` and `prefer_not_to_say`. None may infer a preference, count as a human-ownership failure, trigger nagging, or escalate automatically into another question or live session.
5. Define session opening and closing authority: Krish approves the opportunity and agenda; the leader may decline, change the purpose or reject the premise before the ladder; the session outcome remains evidence/proposal until the inherited closing gate assigns the call and accountability to the named human.
6. Define allowed engagement-state transitions and actors. Entry into `continuing` must require an explicit, auditable agreement by the relevant humans; absence of that receipt cannot mean continuation. Keep data-source consent, audience and retention expiry independent.
7. Extend the frozen headless proof with negative fixtures: missing/stale human-frame binding; recomputed question with stale approval; incomplete forced choice; premise rejection; defer/refuse/unknown with no inference or escalation; dismissed session remaining quiet; and attempted continuation without the required human receipt. The deterministic checker must reject every unauthorised transition.

## What must stay unproven

- “Magic”, intuitiveness, answerability and felt control remain unproven until the required cognitive interviews, fresh-participant tests and actual-device tests pass. The submission itself says repository checks and founder approval cannot establish them (`g24-product-system-blueprint-r2.md`, “Experience proof requirements”, lines 433–458).
- The planner's ability to choose the right question, control, timing or session remains unproven. In particular, no claim should be made yet that forced trade-offs are complete, leader vocabulary is preserved, priming is avoided, or refusal is psychologically costless.
- Question Yield remains an internal, unproven diagnostic. It must not become a customer score, optimisation target that rewards compliance, or evidence that more route-changing answers are better.
- A prepared session opportunity remains an unproven hypothesis about Krish's attention and the leader's judgment. Acceptance, edits, dismissals and downstream usefulness need observed evidence; a polished agenda is not proof of agency.
- Open-ended relationship value, willingness to continue and absence of consent fatigue remain unproven. No duration or retention claim follows from the lifecycle model.
- Qualified Judgement Transfer remains the inherited unproven north-star hypothesis. A leader's later acceptance, correction survival and materially different decision are still required; repetition or model confidence cannot turn prior behaviour into personal authority.
- Nothing in this review proves implementation safety, authorises external research or customer data, or reopens any action listed as closed in `g24-product-system-contract-r2.json#/authority/closed`.

## Owner decision

Do not treat Human Agency as cleared under the frozen R2 hashes. Repair the machine contract and proof fixtures above, freeze new hashes and return them for a fresh recheck. The founder retains the decision; this verdict does not exercise it.
