# Epistemic Integrity review

**Run:** `g24-r2-architecture-council-001`

**Judge:** Epistemic Integrity

**Date:** 12 September 2026

**Verdict:** **VETO**

## Ruling

G24 R2 has the right epistemic intent, but it is not safe to founder-lock as written. The strongest mechanism, the decision evidence map and least-burden acquisition planner, can still award `supported`, `current` or reusable standing from model-authored labels rather than from a trusted, content-bound evidence receipt. It also has no single trusted evidence cutoff, no enforceable independent-source rule, no causal-standing rule and no machine-complete abstention state.

Those are architecture defects, not final schema-name questions. They leave an implementation free to satisfy every named R2 field while promoting a public statement into private personhood, counting syndicated copies as corroboration, accepting future-dated evidence, or upgrading association into causation. This repeats the class of defect preserved in the judge history under `G21-INTERNAL-RANGE-FREEZE-004` and `-005`: a structurally valid receipt cannot earn meaning that the evidence design did not earn.

The veto is bounded. Keep the product direction and add the semantic trust invariants below before founder lock. No external action is opened by this review.

## Review basis

The four submission hashes in [`brief.md`](./brief.md) were recomputed and matched exactly:

| Frozen artifact | SHA-256 result |
|---|---|
| [`g24-product-system-blueprint-r2.md`](../../g24-product-system-blueprint-r2.md) | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980`, match |
| [`g24-product-system-contract-r2.json`](../../g24-product-system-contract-r2.json) | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2`, match |
| [`g24-product-system-r2-delta.json`](../../g24-product-system-r2-delta.json) | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2`, match |
| [`question-and-enrichment-evidence-2026-09-12.md`](../../research/question-and-enrichment-evidence-2026-09-12.md) | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb`, match |

The R1 blueprint, contract and QA hashes embedded in the delta also matched. This was a fresh specialist review. No other G24 R2 judge verdict or adjudication was read. The evidence note was treated as supporting evidence, not authority. Its underlying Compass artifact is not one of the four reviewed artifacts, and the note itself says its citations and universal defaults were not independently re-verified.

Authority remains output-only. Production writes, customer data, external research, model spend, accounts, connectors, messages, deployment, merge, release and deletion remain closed under R2 contract field `authority.closed` and blueprint section `Authority`.

## Findings

### EI-R2-01: Claim standing is declared but not earned

**Disposition:** Blocking.

R2's prose correctly requires the system to distinguish company fact from public company claim, public statement from private judgement, stated preference from observed behaviour, intention from commitment and missing fact from an unknowable future. It also says that public specificity never authorises private personhood. See blueprint sections [`The decision evidence map`](../../g24-product-system-blueprint-r2.md#the-decision-evidence-map) and [`External research scope`](../../g24-product-system-blueprint-r2.md#external-research-scope), plus contract fields `decision_evidence_map.separations` and `enrichment_planner.public_specificity_never_authorises_private_personhood`.

The machine contract does not make those distinctions enforceable. Its exhaustive `decision_evidence_map.requirement_fields` includes generic `standing`, `freshness`, `best_source_class` and `capable_knower`, but omits:

- a trusted decision or run `as_of` cutoff;
- canonical source and assertion identifiers;
- the exact source content hash and span that earned the claim;
- a typed claim kind and the source capability permitted to support that kind;
- a content-bound semantic or derivation receipt;
- supporting and contradicting assertion identifiers;
- independent root-source identity; and
- a use-specific sufficiency rule and result.

The same gap appears in `question_intelligence.contract_fields`. `source_alternatives_checked` and `proposal_provenance` can be model-authored summaries rather than references to verified acquisition and coverage receipts. Blueprint section [`Logical objects added by this extension`](../../g24-product-system-blueprint-r2.md#logical-objects-added-by-this-extension) says trusted application code validates model proposals, but the frozen architecture never states what semantic equality or evidence capability that validation must enforce.

R1 supplies useful foundations in [`Universal source envelope`](../../g24-product-system-blueprint.md#universal-source-envelope) and [`Brain-item standing`](../../g24-product-system-blueprint.md#brain-item-standing): source hash, subject, epistemic type, source span, audience, lineage and independent standing axes. That does not close the R2 gap. The new coverage, enrichment, question and session objects are not required to resolve to those canonical assertions, and R1 does not establish one trusted cutoff against which all internal valid and recorded times plus external publication and retrieval times must be checked.

This directly conflicts with the durable ruling in [`Epistemic Integrity judge history`](../../judge-history/epistemic-integrity.md): time, source identity, source capability, claim kind, subject, content meaning and chronology must earn trust together, and future evidence must be rejected before emission.

### EI-R2-02: The strongest mechanism fails its adversarial case

**Disposition:** Blocking. This is the strongest challenge.

The decision evidence map looks like the proposal's strongest protection. It names the variable, why it is load-bearing, the best source class, capable knower, sensitivity, audience, acquisition path and stop rule. The enrichment ladder then prefers accepted Brain context, authorised work and revealed behaviour before public research or interruption. See blueprint sections [`The decision evidence map`](../../g24-product-system-blueprint-r2.md#the-decision-evidence-map) and [`The enrichment planner`](../../g24-product-system-blueprint-r2.md#the-enrichment-planner), and contract fields `decision_evidence_map.*` and `enrichment_planner.*`.

Adversarial case: a current public job advert names an AI transformation role. A model extracts the legitimate public fact that the role was advertised, then produces the stronger sentence, "AI transformation is the leader's top private priority and caused the recent restructuring." It marks the requirement `supported`, `current`, names the job advert as `primary_public_source`, and reuses the claim by reference in a second case. Nothing required by the frozen R2 machine fields binds the supported meaning to the exact public span, rejects the private-priority inference, rejects the causal addition, or limits the advert's source capability to the fact it can actually establish. The boolean prohibition on private personhood expresses policy but cannot prove compliance.

A second failure is source multiplication. Blueprint section [`Efficient enrichment`](../../g24-product-system-blueprint-r2.md#efficient-enrichment) permits public claims to be reused by reference and retrieval to stop when a variable is "supported." Contract field `enrichment_planner.efficiency_rules` does not require independent provenance roots. A company release, an article repeating it and a database repeating the article can therefore appear to be three confirmations of one claim. R1 mentions lineage and corroboration, but R2 does not say that all derivatives collapse to one evidential root before sufficiency is judged.

The acquisition order also confuses low burden with adequate evidence unless a pre-registered sufficiency rule controls it. An accepted Brain item with compatible audience, scope and freshness is a candidate, not proof that it can answer this decision variable. Reuse may preserve the source pointer; it must never carry forward the prior case's standing, inference, contradiction resolution or sufficiency result.

### EI-R2-03: Research standing, causality and precision are inconsistent

**Disposition:** Blocking for founder lock; repairable without changing the product spine.

The evidence note is admirably candid in [`Source boundary`](../../research/question-and-enrichment-evidence-2026-09-12.md#source-boundary): citations, numerical claims and universal defaults were not independently re-verified and therefore inform hypotheses rather than current normative claims. It then labels ten rules "Evidence-supported working principles" and says historical intake work "demonstrated" that recognition, pre-filled choices, optional enrichment and visible payoff reduce effort in [`Product-specific synthesis`](../../research/question-and-enrichment-evidence-2026-09-12.md#product-specific-synthesis). The reviewed pack contains no claim-to-source spans, source dates, capability assessment, independence analysis or counterevidence for that causal statement.

R2 nevertheless moves some of those propositions into a proposed founder lock. Contract field `question_intelligence.answer_grammars` fixes five-or-seven-point scales and a five-item ranking threshold, while blueprint section [`Revised gate decision`](../../g24-product-system-blueprint-r2.md#revised-gate-decision) says approval locks the answer grammar. Those exact numbers may be sensible prototypes, but the frozen evidence does not earn their precision. The architecture-level principle "match the control to the construct" is supportable; the exact control defaults must remain provisional until observed comparison or verified research supports them.

Causal standing is also absent. Blueprint section [`Timing and delivery`](../../g24-product-system-blueprint-r2.md#timing-and-delivery) says an outcome-time answer can distinguish luck, causation and transferable judgement. Contract field `evaluation.question_yield` counts whether an answer changed a gap, route, boundary, session need or learning proposal, but it does not distinguish process change from better judgment or causal effect. A single outcome, retrospective explanation, accepted session or self-report cannot establish that the question or session caused the result. The architecture needs explicit causal claim kinds, admissible evidence designs, confounder and countercase handling, and a rule that observational evidence remains observational.

### EI-R2-04: Abstention is present in prose but incomplete as state

**Disposition:** Blocking because abstention is part of the promised Crossing proof.

The intent holds. R1 says silence and abstention are successful states in [`Non-negotiable product boundaries`](../../g24-product-system-blueprint.md#non-negotiable-product-boundaries). R2's opening decision tree ends in "hold the gap and abstain," and contract field `first_crossing_extension.required_choices` requires abstention when no route is earned.

The machine overlay does not define what an abstention must preserve or block. `evidence_coverage` is described only as recording supported, missing, stale, private or unknowable status, while `intervention_delivery` records suppression. There is no required abstention reason, prohibited downstream claim or promotion, unresolved evidence set, expiry, re-open trigger, or receipt showing that a session opportunity did not smuggle in the withheld diagnosis. Blueprint section [`Extension to the first Crossing`](../../g24-product-system-blueprint-r2.md#extension-to-the-first-crossing) combines "abstains from diagnosis" with a prepared session opportunity, which can be valid, but only if diagnostic abstention and intervention selection are represented as separate states.

The stop rule also needs tightening. "Stop when contradicted" must mean stop silent resolution and preserve the contradiction, not stop all targeted inquiry or choose whichever source arrived first.

## Required repairs

1. Add one non-negotiable trusted evidence invariant to both blueprint and machine overlay. Every `supported`, `contradicted`, `current`, `reused` or `answered externally` result must resolve to canonical assertion and source receipts that bind exact content hash and span, claim meaning and kind, subject, source capability, audience, derivation, contradiction set and one trusted decision `as_of`. Reject any internal valid or recorded time and any external publication or retrieval time after that cutoff.
2. Make sufficiency use-specific and pre-registered. Each decision requirement needs the admissible source capabilities, minimum independent provenance roots where corroboration is needed, counterevidence treatment and stop rule. Collapse syndicated or derivative sources to one root. Reusing a public source or assertion must trigger a fresh applicability, freshness, contradiction, audience and sufficiency decision for the new case.
3. Bind every question and session opportunity to the exact versioned evidence-coverage and enrichment receipts that made lower-burden routes fail. Free-text `source_alternatives_checked` and `proposal_provenance` are not enough.
4. Add causal standing. A claim must distinguish direct fact, attributable statement, observation, association, mechanism hypothesis, causal estimate and unknown. Observational outcomes, retrospective answers and session acceptance cannot promote themselves to causal or transferable judgement. Require an explicit countercase and the evidence design that could raise standing.
5. Reconcile the research note's standing. Either provide a frozen claim-evidence matrix with exact primary spans, dates, capability, independence and counterevidence, or relabel the derived defaults as proposed, unverified implementation hypotheses. Keep semantic answer-control matching, but do not founder-lock five-versus-seven scales, the five-item threshold or claims that a prepared choice, recognition, voice or visible consequence improves outcomes.
6. Define a first-class abstention receipt: gap and reason, claims and promotions blocked, evidence considered, contradiction state, smallest admissible next evidence, expiry or re-open trigger, audience, and proof that no withheld diagnosis travelled inside a question or session brief.
7. Add deterministic adversarial fixtures for: future-dated internal and public evidence; a public job advert mutated into private and causal meaning; multiple sources with one upstream root; a stale reused assertion; source-type relabelling; cross-subject reuse; contradiction that remains unresolved; and abstention that blocks downstream learning until its re-open condition is met.

These repairs define semantic invariants. They do not require final table names, vendors, external research, model spend, customer data or deployment.

## Improvements after the veto is cleared

- Replace `session_opportunity.os_source_verified: "2026-09-12"` with an auditable repository revision, path and exact ruling locator. A date alone is not source verification.
- Resolve the tension between "strongest available evidence" in the planner objective and "easiest truthful source" in the evidence note. The lowest-burden source wins only after it meets the requirement's capability and sufficiency rule.
- Revise the statement that a question which changes nothing should not have been sent. A well-posed answer can reduce material uncertainty or confirm a pre-registered boundary without changing the chosen route. Measure epistemic reduction separately from route movement.

## Protected strengths

The repair must preserve these parts:

- the explicit public fact versus public claim, public statement versus private judgement, preference versus behaviour, intent versus commitment and missing versus unknowable separations;
- social posts as statements rather than proof of behaviour, and search summaries as discovery rather than sources;
- R1's source envelope, source spans, lineage, independent Brain standing axes and correction history;
- public-only real identities, fictional internal depth and no simulated consent;
- the ban on decimal priority theatre and the explicit `internal_unproven_diagnostic` standing for Question Yield;
- one-question re-evaluation, leader prior before system preference, honest refusal routes and quiet as a valid outcome; and
- founder authority, human-owned consequential calls and every closed external action.

## What must stay unproven

Until later evidence earns a narrower claim, the following must remain explicitly unproven:

- that the proposed experience feels intuitive or magical to fresh participants;
- that one-question moments, prepared choices, voice incidents, visible consequence or five/seven-point controls reduce burden or improve answer quality;
- that the enrichment acquisition order is optimal across decisions or people;
- that Question Yield predicts decision quality, trust, retention or commercial value;
- that a prepared live session causes a better decision, rather than merely being selected for harder or more promising cases;
- that one observed outcome distinguishes luck from causation or earns transferable judgement;
- that Qualified Judgement Transfer creates incremental value;
- that synthetic and public-only fixtures generalise to consented real high-internal evidence; and
- that any public fact, public pattern or attributable statement establishes private personhood.

The last item is not merely awaiting better inference. It remains prohibited unless the person supplies or explicitly authorises the private judgement through the proper evidence and authority path.

## Owner decision

Do not founder-lock the frozen R2 artifacts as epistemically complete. Repair the seven items above, freeze new hashes and return the revision to this judge. Krish retains the decision on product direction and may explicitly accept risk, but the current artifact cannot claim Epistemic Integrity approval. No ledger write or external action is authorised.
