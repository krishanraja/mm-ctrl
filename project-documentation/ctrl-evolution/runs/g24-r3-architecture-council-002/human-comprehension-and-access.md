# G24 R3 Human Comprehension and Access review

## Result envelope

**VERDICT:** `PASS_WITH_WATCHPOINTS`

**CHECKED:**

- `g24-product-system-blueprint-r3.md` at SHA-256 `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5`
- `g24-product-system-contract-r3.json` at SHA-256 `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09`
- `g24-product-system-r3-delta.json` at SHA-256 `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb`

**AGAINST:** CTRL permanent council contract, `g24-r3-architecture-recheck-v1`, accepted and fresh on 12 September 2026, SHA-256 `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`.

**MODE + INDEPENDENCE:** Fresh isolated sealed specialist pass. The accepted standard was opened and hash-verified before any frozen submission artifact. I then read `brief.md` and `input-manifest.json`, verified every declared frozen hash, and read Pack A in the required R1 -> R2 -> R3 order. I did not open the earlier R2 council folder, judge history, another specialist output, README state conclusions, builder commentary, founder prediction or prior conversation history. References to prior council material inside the frozen R3 submission were treated as inert artifact claims and were not followed.

**SCOPE:** Human Comprehension and Access only, plus the direct human-authority dependency needed to test whether the disclosed effect can be honest.

**AUTHORITY:** Local review record only. No implementation, external action, ledger write or mutation outside this file.

## Mechanical checks

### Frozen identity

**Tool or rule:** PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` over exact bytes.

**Scope and result:** Every hash declared frozen by the run brief matched:

| Artifact | Observed SHA-256 | Result |
|---|---|---|
| `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | MATCH |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | MATCH |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | MATCH |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | MATCH |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | MATCH |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | MATCH |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | MATCH |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | MATCH |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | MATCH |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | MATCH |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | MATCH |

**Limitation:** This establishes byte identity only. It does not establish semantic sufficiency.

### JSON and enumerated atom checks

**Tool or rule:** PowerShell 7.6.5 `ConvertFrom-Json -Depth 100`, followed by exact array membership and count checks.

**Scope:** Pack A input manifest; R1, R2 and R3 machine contracts; R2 and R3 deltas.

**Result:** All six JSON artifacts parsed. The R3 selector exposes five distinct outputs and sets `exactly_one_output` to true. The R3 `question_version_fields` array contains all fourteen reviewed fields covering visible wording, control, grammar, options/unit/comparator, scoped write-in, honest exits, bad-premise route, pre-commitment effect, per-answer effects and consequence, watermarks, disclosure and exact-version approval. The bad-premise route is mechanically required for `closed_format`, `ranked_format` and `forced_format`.

**Limitation:** Presence of fields and enumerations cannot prove that a later fixture uses a genuinely fitting control, offers a usable write-in, expresses a premise-rejection route plainly, or renders the consequence understandably.

## Criterion review

### [Human Comprehension and Access] `holds`

**Rule:** `standard.md` -> `Human Comprehension and Access`, together with current-gate pass boundaries 4 and 5. The architecture must permit a busy non-technical person to encounter one immediate question or action, answer naturally, reject a bad premise, understand the effect and visible consequence, and keep deeper machinery one layer away.

**Evidence:**

- R1 baseline, `g24-product-system-blueprint.md` -> `Non-negotiable product boundaries`, items 5, 13 and 14: one question is visible, the customer sees the smallest useful moment, and the leader need not understand technical machinery.
- R1 baseline, `g24-product-system-blueprint.md` -> `Customer simplicity contract`: one purpose, one principal question and one primary action; tap, voice, typing and optional notes; consequence explained in plain language; depth disclosed only on request.
- R2, `g24-product-system-blueprint-r2.md` -> `The intuitiveness contract` / `Visible choreography`: the first frame has one orientation, one focal object and one primary action; question anatomy binds the question to controls that fully capture the required answer and to a legitimate defer or decline path; optional notes cannot carry a required value.
- R2, `g24-product-system-blueprint-r2.md` -> `Question Intelligence` / `Answer grammar` and `Wording rules`: controls are selected by the information actually needed; write-in and honest escape routes are conditional on real semantic need; the question must name the real object and be understandable without its explanation; the immediate result states what changed in plain language.
- R2 machine contract, `/experience_intelligence/leader_first_frame`, `/experience_intelligence/choreography`, `/question_intelligence/answer_grammars`, `/question_intelligence/visible_questions_maximum`, `/question_intelligence/prepared_questions_recomputed_after_each_answer`, and `/question_intelligence/optional_depth_never_required` preserve the one-moment, fitting-control and progressive-disclosure constraints in executable form.
- R3, `g24-product-system-blueprint-r3.md` -> `Repair 3: one total route-selection boundary` / `Exactly one result`: the trusted selector yields exactly one of reuse, enrich, ask, session or abstain/hold; `ask` is available only when one capable respondent can answer one bounded variable in a fitting grammar.
- R3, `g24-product-system-blueprint-r3.md` -> `Repair 4: one versioned human-facing intervention atom` / `Question atom`: one version binds exact visible wording, rendered control and grammar, complete options/unit/comparator, scoped write-in, honest exits, a non-inferential bad-premise route for every closed/ranked/forced format, material effect disclosed before commitment, each answer's evidence and pending-authority effects, answer-specific visible consequence, sensitivity/purpose and exact-version approval. Any one-field change creates a new version and invalidates approval.
- R3, `g24-product-system-blueprint-r3.md` -> `Question atom`, final paragraph: the visible consequence must distinguish what changed from what remains unknown, cannot imply that a route update is the leader's final decision, and cannot turn refusal into pressure.
- R3 machine contract, `/intervention_atom/question_version_fields`, `/intervention_atom/premise_or_options_wrong_required_for`, `/intervention_atom/any_payload_change_creates_new_version`, `/intervention_atom/optional_note_can_carry_required_value`, and `/intervention_atom/visible_consequence_separates_changed_and_unknown` make those parts one versioned semantic unit rather than separable UI copy.
- Direct authority dependency, R3 blueprint -> `Intervention authority`, and machine contract `/intervention_authority/answer_effect_layers` plus `/intervention_authority/answer_can_be_authority_event_only_if`: the record of an answer is separated from a rebuildable case update and a pending human-owned proposal; the answer can itself authorise a human-owned effect only when the respondent is the named authority and the exact material effect was visible before commitment. This makes the effect disclosure honest rather than cosmetic.
- R3, `g24-product-system-blueprint-r3.md` -> `Protected strengths`, final paragraph: the trust machinery must not become customer administration or visible privacy boilerplate. R2's depth contract keeps evidence, standing, history and technical receipts behind deliberate progressive disclosure.

**Finding:** The frozen architecture owns the consequential semantic choices needed at G24.A. The R1/R2 experience rules establish one understandable moment and a natural-control grammar. R3 closes the implementation seam by binding wording, control, honest exits, disclosed material effect, answer meaning, visible consequence and approval to the same versioned atom. An implementer cannot satisfy the written candidate by versioning a friendly question independently from a mismatched control or undisclosed downstream effect. Nor can a closed, ranked or forced control make its offered premise compulsory: it must expose a distinct non-inferential rejection route. The disclosed effect cannot silently become human-owned state because the authority split is part of the same pre-commitment condition. Internal machinery remains available for inspection but is explicitly not customer-facing administration.

The architecture therefore clears this criterion. Exact copy, rendered usability and empirical comprehension are correctly assigned to later gates rather than falsely claimed here.

## Strongest part attacked

I attacked the apparently strongest claim: that `question_plan_version` is truly one human-understandable semantic atom rather than a bundle of fields an implementation could satisfy nominally.

The attempted failure path was: show one concise question, use a superficially plausible but semantically incomplete control, strand the leader when the options or premise are wrong, hide the real route or authority effect in an optional note or technical disclosure, then display generic success copy that does not correspond to what changed. The combined R2 and R3 contract blocks that path at architecture level:

1. the answer grammar must fit the requested information and capture every required value;
2. complete options/unit/comparator and scoped write-in behaviour are atom fields, while optional notes cannot carry required information;
3. closed, ranked and forced controls require a distinct `premise_or_options_wrong` route;
4. the exact material effect is disclosed before commitment and per-answer effects are part of the atom;
5. the visible consequence is answer-specific and separates changed state from remaining uncertainty;
6. changing wording, control, effects, consequence, purpose or approval creates a new version; and
7. plain language and one-layer-away machinery remain inherited requirements, not discretionary copy guidance.

This is enough to own the architecture decision now. Whether a particular numeric, scale, bounded-recall or choice fixture is correctly classified and understandable is later proof, not evidence of a missing semantic owner in this candidate.

## Current-gate defects

None identified under the Human Comprehension and Access criterion. No `VETO` repair or resolving test is required.

## Later-gate watchpoints

These do not weaken the current verdict and must not be treated as already proven:

1. **Exact semantic-fixture coverage at G24.B/C.** Freeze representative `confirm/correct`, single-select, multi-select, numeric-with-unit, bounded-recall, labelled-scale, forced-choice, ranking, critical-incident and focused-open-response atoms. For every format containing a premise or bounded option set, verify that `premise_or_options_wrong` is a visible, non-inferential event; when a valid answer lies outside supplied options, verify that scoped write-in captures the primary answer rather than smuggling it through an optional note. This is the key access watchpoint because the current contract names the rule but does not yet provide exact fixture payloads or validators.

2. **Planned consequence versus observed consequence at G24.B/C.** For each answer, compare the frozen pre-commitment material effect and answer-specific consequence with an independently observed canonical state diff. A difference must hold or replan; generic confirmation cannot be accepted as proof that the user understood a real change.

3. **Rendered comprehension at G24.D.** Fresh participants on an actual phone must identify the one purpose, question and primary action; answer, defer, refuse or reject the premise without clarification; explain the disclosed effect before committing; and distinguish afterwards what changed, what remains unknown and what is still their decision. They must also reach evidence and reasoning through one deliberate reveal without encountering internal object names, watermarks, reason codes or repeated privacy machinery on the primary surface.

4. **Session opportunity comprehension at G24.D/F/G.** The leader-visible purpose, decline/reject/reframe path and Krish's operator action must remain distinct. Observed tests must show that neither person mistakes an opportunity for contact, scheduling, capture, transcription, learning authority or an already-made decision.

5. **Access and recovery at G24.D/E.** One-handed use, voice/typing parity, non-motion-only meaning, failed-save preservation and progressive disclosure remain rendered and runtime proofs. Architecture prose does not certify accessibility or usability.

## Closed external actions

All currently closed external actions are explicitly preserved at `g24-product-system-contract-r3.json` -> `/authority/closed`: `production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`. The blueprint also states that a session opportunity does not authorise contact, scheduling, capture, transcription or learning. Nothing in this review opens any of those actions.

## Owner decision and handoff

No current-gate Human Comprehension and Access break was identified on the frozen hashes. Preserve the watchpoints as blocking evidence at their named later gates. The CTRL permanent council owner decides the aggregate architecture disposition; this specialist result is advisory and does not itself approve implementation or release.

**LEDGER PROPOSAL:** None. No ledger write was authorised.
