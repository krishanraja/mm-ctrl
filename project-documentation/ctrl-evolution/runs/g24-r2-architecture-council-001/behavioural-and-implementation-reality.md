# Behavioural and Implementation Reality verdict

**Run:** `g24-r2-architecture-council-001`

**Judge:** Behavioural and Implementation Reality

**Date:** 12 September 2026

**Verdict:** **VETO**

**Veto:** `REALITY-PLANNER-01`

## Ruling

R2 is a strong statement of desired behaviour, but it is not yet a lockable implementation contract for the planner at its centre.

The submission says CTRL will choose among accepted context, supplied work, public enrichment, one asynchronous question, a prepared session and abstention. It does not bind the predicates, budgets, state transitions or independent semantic oracle that make that choice reproducible. The next implementer would therefore have to invent the architecture while coding it. A hand-authored Crossing could then produce the eight expected receipts and still conceal ontology duplication, unbounded research delay, a growing Krish-operated queue and a selector that works only because the fixture names disclose the answer.

This veto is narrow. It does not reject the longer relationship, the least-burden principle, adaptive answer controls, the pull-only operator boundary, the observed experience gate or R1. It blocks founder lock of the current R2 bytes and blocks the stated headless implementation step until the planner has one executable semantic boundary.

## Frozen review record

### Submission identity

PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` reproduced every hash in the council brief:

| Frozen artifact | Declared and observed SHA-256 | Result |
|---|---|---|
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | pass |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | pass |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | pass |
| `question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | pass |

The three R1 files also reproduced the baseline hashes frozen in `g24-product-system-r2-delta.json`:

| R1 artifact | Declared and observed SHA-256 | Result |
|---|---|---|
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | pass |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | pass |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | pass |

Node 24.13.0 parsed both R2 JSON files without error, and the baseline paths and hashes in the contract matched those in the delta. These checks prove byte identity and JSON syntax only.

### Mechanical structure finding

A Node key inventory found the R2 contract's planner sections, but no contract entries named `logical_objects`, `intervention_selection`, `enrichment_receipt`, `answer_receipt` or `intervention_delivery`. A literal ripgrep 15.2.0 search for those five quoted keys returned no matches. This is notable because the blueprint names the latter three receipts/delivery records and nine logical objects as things trusted application code will validate and persist. The machine contract instead carries enumerated principles and field-name lists. It does not provide object schemas or a selector schema. Evidence: frozen blueprint, “Logical objects added by this extension,” lines 376-392; frozen contract, top-level `/decision_evidence_map`, `/enrichment_planner`, `/question_intelligence`, `/session_opportunity` and `/evaluation`, lines 125-365.

### Independence and authority

This was a fresh delegated review. The council brief and hashes were loaded before the frozen submission; the durable Behavioural and Implementation Reality history was loaded only after the submission; no other verdict from this council was read. The supporting evidence note was treated as non-normative, exactly as it describes itself at lines 5-18. Authority was limited to this verdict file. No database, model, customer, connector, message, deployment, merge, release or legacy system was touched.

## Criterion findings

| Criterion | Disposition | Finding and exact evidence |
|---|---|---|
| Lowest-burden behavioural direction | **holds as direction** | The route from accepted context through enrichment, question, session and abstention is explicit in the frozen blueprint, “The amendment in one minute,” lines 25-47. Questions must change a named decision effect, not profile completeness, at lines 239-272, and are re-evaluated after each answer at lines 322-335. |
| Executable intervention selection | **breaks** | The branch predicates in lines 25-47 are natural-language questions such as “already known?”, “obtainable” and “would a prepared conversation change the decision?”. The priority expression at lines 274-290 has factors but no value domains, comparison procedure, threshold, tie rule, missing-value rule or fail-closed output. The exact next action nevertheless requires `intervention selection` at line 476. The machine overlay has no `intervention_selection` contract. |
| Typed and bounded AI work inherited from R1 | **breaks for the R2 addition** | R1 requires AI tasks to be “typed, bounded, independently evaluated” before the architecture passes: R1 blueprint, “Acceptance criteria for this architecture,” lines 597-613. R2 lists candidate fields and allowed answer grammars in contract `/question_intelligence`, lines 192-265, but does not bind a total input/output type for the selector, its deterministic validator, or its failure states. |
| Single canonical ontology | **breaks** | R1 already locks durable records for engagement, question plan, answer event, intervention candidate, interruption decision, delivery intent, receipt and response: R1 blueprint, “Logical data domains,” lines 233-248. R2 then names nine domain objects, including `engagement_period`, `question_plan`, `answer_receipt`, `session_opportunity` and `intervention_delivery`, without saying which extend R1 records, which are derived projections and which are canonical: frozen blueprint lines 376-392. The frozen machine overlay does not encode that mapping. |
| Bounded latency and cost | **breaks** | The enrichment objective says to stop when further collection is not worth its “cost, sensitivity or delay,” and its acquisition order may traverse eight source classes: frozen blueprint lines 189-206. `enrichment_plan` is said to choose a budget at line 385. Yet contract `/enrichment_planner`, lines 153-190, has no wall-clock deadline, request/source/token/cost cap, retry cap, cancellation rule, concurrency rule or stale-result rule. R1's capped retrieval policy at lines 282-295 is not explicitly bound to this new cross-route planner. R1's own QA record left cost and performance unverified at lines 41-48; R2 has not closed that gap. |
| Operable without clerical load | **breaks at architecture lock** | Pull-only routing and Krish's schedule/edit/snooze/dismiss controls protect agency: frozen blueprint lines 370-374 and contract `/session_opportunity/krish_controls`, lines 297-306. But the operator proof asks Krish to reach a prepared session “without assembling context manually” only at frozen blueprint lines 448-456. There is no queue lifecycle, deduplication or coalescing key, maximum open work, expiry behaviour, fairness rule, backpressure, or workload acceptance signal. An indefinite `continuing` state at lines 67-95 combined with enrichment triggers at lines 223-231 can accumulate work while the only route is a portfolio Krish must inspect. |
| Semantic evaluation rather than ceremony | **breaks** | The deterministic proof pre-announces the desired choice for each evidence quadrant and seven other dynamics at frozen blueprint lines 394-411. The receipt is required to explain the choice, but no independent oracle binds the meaning of the input to the selected route. “Question Yield” counts any named gap or pre-registered route/evidence/boundary change at lines 413-429; the same planner is required to author “what each answer changes” at lines 253-272. A bookkeeping change can therefore satisfy the metric without useful decision movement. Durable judge history warns that ordered labels do not prove state semantics and that a green finite gate proves only its enumerated baselines and attacks: judge history lines 26-32 and 57-64. |
| Closed external actions and human control | **holds** | The frozen blueprint closes external actions at lines 15-17; contract `/authority/closed`, lines 27-48, makes the boundary machine-readable; delta `/forbidden_interpretations`, lines 76-85, forbids autonomous push and external implementation. Trusted application code, not a model, must persist state, and no model can message or schedule a person: frozen blueprint lines 376-392. |
| Honest experience standing | **holds** | R2 does not claim that architecture prose proves intuitiveness. It requires cognitive interviews, fresh-participant comprehension, an actual phone, save-failure recovery and consequence comprehension: frozen blueprint lines 433-458 and contract `/evaluation/observed_experience_evidence_required`, lines 357-363. The evidence note also calls the relevant claims hypotheses requiring observed tests at lines 39-48. |

## Strongest challenge

The apparently strongest part is the headless Crossing. It is exactly the right medium to test intelligence before UI polish, and it includes research-not-question, supplied-work-not-research, an adaptive question, a live session, abstention, invalidation and transfer. That breadth should be preserved.

But as currently written, it is also an answer sheet. The architecture itself says:

- high external and low internal becomes public enrichment;
- low external and high internal becomes supplied or observed work;
- high/high becomes a forced trade-off; and
- low/low becomes abstention plus a session opportunity.

Those expected outcomes are at frozen blueprint lines 398-407 and contract `/first_crossing_extension/cases` plus `/required_choices`, lines 308-327. An implementation can switch on the fixture quadrant, produce a polished explanation and pass all eight demonstrations. That would prove neither that the planner inferred the evidence state nor that the selected route survives a new case.

This is the same class of error the durable judge history already caught: identifiers, counts and plausible prose can remain green while semantic roles trade places. See judge history lines 45-53. A readable receipt becomes implementation evidence only when it is derived from a frozen semantic input, the expected route is hidden from the planner, mutations that preserve labels but reverse meaning fail, and a safe novel case passes.

## Required repairs before recheck

### 1. Bind one executable planner contract

Add one versioned contract for a total planner boundary. Do not create another conceptual layer. It must bind:

- input identifiers and version watermarks for the decision, requirement, evidence coverage, permissions, freshness and current intervention state;
- the permitted source and action set;
- wall-clock, source-call, retrieval-hop, token/cost and interruption budgets;
- exactly one output from a finite route enum such as reuse, enrich, ask, session or abstain;
- stable reason codes, the unresolved gap, expected material effect, rejected alternatives and expiry;
- deterministic precedence for permission, audience, freshness, sensitivity and decision deadline;
- tie, ambiguity, missing-data and invalid-input behaviour;
- cancellation and replanning when a source, answer, correction or decision version changes; and
- the rule that a model may propose a candidate but trusted code validates the transition and canonical write.

The predicates represented by “known”, “obtainable”, “answer cleanly” and “conversation would change the decision” must resolve either to deterministic guards or to a typed provisional judgement with an explicit evaluator. They cannot remain unversioned prose.

### 2. Collapse the R2 object list onto R1

Add a mapping for every R2 logical object to the frozen R1 domains. For each, state whether it is canonical, append-only event, proposed record or rebuildable projection; its owning aggregate and key; its actor and authority; its allowed state transitions; its version/invalidation rule; and its retention, correction and deletion dependency.

At minimum, settle whether:

- `engagement_period` extends the R1 engagement or creates a new root;
- `question_plan` extends the existing question plan;
- `answer_receipt` is the R1 answer event;
- `session_opportunity` is an intervention-candidate subtype; and
- `intervention_delivery` is the already locked intervention/delivery record.

The engagement lifecycle also needs an allowed-transition table with actor, precondition and receipt. A list of six states in contract `/engagement_lifecycle/states`, lines 66-81, is not runtime continuation semantics.

### 3. Make time, failure and operator capacity part of the architecture

Encode a budgeted execution envelope and a bounded queue policy in the machine overlay. It must cover:

- a fast path from accepted current Brain evidence;
- deadline-aware switching rather than serially exhausting the enrichment ladder;
- adapter timeout, bounded retry, partial result and circuit-open behaviour;
- cancellation and stale-result rejection after a new answer or correction;
- deduplication/coalescing, maximum active work, expiry and suppression across continuing engagements;
- snooze and dismissal semantics that prevent immediate reappearance; and
- operator-load telemetry that distinguishes necessary judgement from context assembly and queue gardening.

No external research or model spend is needed for this repair. Deterministic delayed, failed and contradictory adapters are sufficient for the headless gate.

### 4. Replace the demonstration oracle with a semantic oracle

Extend the Crossing proof so that:

- fixture inputs do not expose expected route labels or evaluator answers to the planner;
- a canonical verifier binds lifecycle role, evidence meaning and allowed output separately from arbitrary-input validation;
- relabelled, reordered and semantically reversed inputs fail even when identifiers and counts remain valid;
- malformed and wrong-type inputs fail closed without throwing;
- at least one safe novel identifier and one novel combination pass on meaning rather than allowlisted prose;
- an answer's claimed route effect is compared with the independently observed state diff, not the planner-authored `per_answer_effect`;
- deadline, adapter failure, cancellation, duplicate opportunity and stale-result cases are exercised; and
- the inherited held-out comparator remains outside planner inputs.

Question Yield may remain an internal diagnostic, but it needs a denominator, attribution window, independently observed qualifying state change and guardrails for false negatives, time/cost and operator load. It must not count a state change the planner created solely to make its own prediction true.

### Recheck threshold

The veto can lift when the revised frozen blueprint and machine contract make the four repairs above mechanically inspectable and a deterministic headless run demonstrates:

1. one total selector over valid, invalid and safe-novel inputs;
2. no parallel canonical object for an already locked R1 record;
3. bounded fallback under slow, failed and stale enrichment;
4. a deduplicated, expiring operator portfolio that requires no manual context assembly; and
5. rejection of semantic substitutions that preserve fixture labels, counts and polished receipt prose.

Passing those checks would justify `PASS_WITH_WATCHPOINTS`, not a claim of product efficacy.

## Improvements that are not part of the veto

- Preserve the one-question, quiet-state and immediate-consequence choreography. It is a useful customer projection once the underlying state change is real: frozen blueprint lines 97-157 and 322-335.
- Preserve pull-only routing for the first implementation. The repair should remove clerical labour without removing Krish's judgement over whether a consequential intervention reaches a person.
- Keep physical table names, vendors, model choice and UI concepts outside this lock. The veto asks for semantic ownership and executable boundaries, not premature infrastructure decisions.
- Keep the explicit distinction between source-backed public material and private personhood at frozen blueprint lines 176-187 and 208-231.

## What remains unproven after the repairs

Even a repaired headless gate will not establish:

- that the planner identifies the right load-bearing decision variables for unfamiliar real decisions;
- that source alternatives can be found with acceptable freshness, latency, cost and failure rates;
- that a chosen question is clearer or less burdensome than the best unasked alternative;
- that voice lowers burden or yields better critical incidents;
- that the visible consequence is understood as real decision movement rather than interface acknowledgement;
- that session opportunities are useful often enough to justify Krish's attention across several continuing engagements;
- that the operator portfolio stays quiet under real multi-customer volume;
- that permission expiry, pause, reopen, correction and deletion behave correctly in runtime state;
- that a learned judgement improves a later materially different decision;
- customer willingness to return or pay; or
- production safety, deployment readiness, migration readiness or legacy-backend retirement.

The supporting evidence note already labels the key interaction and operator claims as hypotheses at lines 39-48. Those remain for cognitive interviews, actual-device testing, a writable isolated service proof, the founder account and an assisted pilot. A repaired architecture must preserve that standing.

## Owner decision and handoff

Do not present these exact R2 bytes as ready for founder lock, and do not begin the stated headless planner implementation from them. Preserve the direction, make the bounded contract repairs, issue new frozen hashes and return the revision to this judge.

Founder authority remains intact. This verdict neither opens nor recommends any external research run, model spend, database branch, customer-data use, message, connector, deployment, merge, release or legacy deletion.

