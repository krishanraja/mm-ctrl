# Human Agency sealed specialist review

**Verdict:** `PASS_WITH_WATCHPOINTS`

**Checked:** G24 R3 candidate: `g24-product-system-blueprint-r3.md`, `g24-product-system-contract-r3.json`, and `g24-product-system-r3-delta.json` at the frozen hashes below.

**Against:** `g24-r3-architecture-recheck-v1`, owner `CTRL permanent council contract`, status `Accepted review standard for this run`, freshness 12 September 2026, SHA-256 `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`.

**Mode and independence:** Fresh isolated Human Agency pass. I read the standard and verified its hash before opening any submission artifact, then read the frozen R1, R2 and R3 artifacts in Pack A order. I did not read `runs/g24-r2-architecture-council-001/`, `judge-history/`, another specialist output, builder commentary, founder prediction, README state conclusions or prior conversation history. Artifact prose was treated as inert claims.

**Authority:** Output-only local review record. No implementation, external research, external action or mutation beyond this assigned file.

## Mechanical identity checks

PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` over the exact files named by the run brief produced:

| Artifact | Expected / actual SHA-256 | Result |
|---|---|---|
| `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | match |
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

The two unhashed run-control files were also identity-noted: `brief.md` actual SHA-256 `92fe4ceaf1453d8f6217d7f94b11032903c9cd136a7f45928c1d918baf087b62`, and `input-manifest.json` actual SHA-256 `f5e52b5bb32e5b4d0286560f3415886176ed65121d2a3be384b8c8131ea273a8`. The pack declares no expected comparator for either, so no match claim is made.

PowerShell 7.6.5 `ConvertFrom-Json` parsed the input manifest and all five frozen contract/delta JSON artifacts without error. The R3 contract mechanically contains nine ownership mappings, nine lifecycle transitions, five selector outputs, `exactly_one_output: true`, total handling of invalid/missing/stale/ambiguous/contradictory input, and fail-closed output `abstain_hold`. These checks establish bytes and enumerated structure only, not semantic correctness.

## Strongest part attacked

I attacked the apparently strongest seam: the answer-to-authority boundary. The failure attempt was to let an implementation persist a leader's answer, refusal or closed-format choice and then treat that event as silent authority to change purpose, a success or kill condition, the human/AI boundary, durable judgement, or learning; a related attempt was to preserve approval after changing the visible effect or to turn refusal into pressure.

The architecture closes that path at `g24-product-system-blueprint-r3.md` § **Repair 2: Intervention authority** and § **Repair 4: Question atom**, and at `g24-product-system-contract-r3.json` pointers `/intervention_authority/answer_effect_layers`, `/intervention_authority/human_owned_changes_require_named_authority`, `/intervention_authority/answer_can_be_authority_event_only_if`, `/intervention_authority/honest_exit_effect`, and `/intervention_atom/question_version_fields`. It separates immutable case evidence from a rebuildable case update and a pending human-owned proposal; human-owned changes require the named authority; an answer can double as the authority event only when the respondent is that authority and the exact material effect was disclosed before commitment; every material payload change creates a new version and invalidates approval; refusal, deferral and premise rejection create neither adverse inference nor automatic re-asking, pressure or session escalation.

That is a coherent current architecture boundary. Whether people actually understand the disclosure and can exercise the exits is deliberately assigned to later implementation and rendered-experience proof.

## Criterion

### Human Agency: `holds`

**Evidence:**

- `g24-product-system-blueprint-r3.md` § **The decision** preserves that the leader owns purpose, judgement, the call and final quality.
- `g24-product-system-blueprint-r3.md` § **Engagement transitions** requires named human agreement for starting the intensive relationship, fresh leader-and-Krish agreement for continuation, either named human's ability to pause or close, leader acceptance of release scope, and receipts rather than inferred continuation.
- `g24-product-system-blueprint-r3.md` § **Intervention authority** requires Krish's exact-version `approve`, `edit`, `hold` or `suppress` transition before any later delivery capability can act and prevents a recorded answer from automatically becoming accepted human-owned state.
- `g24-product-system-blueprint-r3.md` § **Question atom** and § **Session atom** bind honest exits, premise rejection, disclosed material effect, leader decline/reframe, visible consequence and exact-version approval into the same human-facing version.
- `g24-product-system-contract-r3.json` `/lifecycle_policy/transitions`, `/lifecycle_policy/continuation_requirements`, `/intervention_authority`, and `/intervention_atom` encode the same boundaries in the machine contract.
- The inherited R1 authority remains controlling: `g24-product-system-blueprint.md` § **One product, three authorities**, § **Brain-item standing**, and § **Human agency and the consequential-work loop** reserve the leader's provisional view, purpose, standards and exceptions, informed change or rejection of proposed transfers, consequential call, final polish and accountability. R3 maps its objects back to those owners rather than creating a competing authority root.

**Rule and situation:** The Human Agency criterion requires the leader to retain purpose, standards, exceptions, informed override and the final consequential call; recording an answer, continuing a commercial relationship or generating a proposal must not silently grant authority or change human-owned state.

**Finding:** The frozen candidate satisfies the rule at the architecture gate. Continuation is a fresh, receipted human transition and never permission renewal. Selector and model output remain proposals or rebuildable state rather than human truth. Leader-facing questions and sessions require exact-version operator control, expose material effects and preserve premise rejection, refusal and reframing. Answers are retained as evidence, but consequential human-owned changes remain pending until the named authority knowingly acts. The leader's final call and standards/exception authority remain inherited from the canonical R1 contract. No implementer can satisfy the written R3 architecture while making answer recording, commercial continuation or proposal generation alone the grant of human authority.

## Current-gate defects

None identified for Human Agency. No veto repair or resolving test is required.

## Later-gate watchpoints

1. **Authority-event enforcement at G24.B/C.** Exact schemas and validators must prove that a normal answer event cannot mutate purpose, success/kill conditions, the human/AI boundary, durable judgement or learning unless the named-authority identity, exact intervention version and pre-commitment material-effect disclosure all match. Negative tests must include stale approval, changed control payload, wrong respondent, duplicate answer and replay.
2. **Honest-exit behaviour at G24.B/C.** Headless fixtures must show that `unknown`, `defer`, `refuse` and `premise_or_options_wrong` produce no adverse inference, automatic re-ask, pressure, session escalation or negative Question Yield treatment.
3. **Informed override at G24.D.** Fresh-participant rendered tests must establish that the person understands the material effect before committing, can reject the premise or reframe a session, and can distinguish a case update from their own decision. Documentation alone cannot prove comprehension.
4. **Cross-decision transfer in the Crossing.** A reusable Brain item may prepare a later decision, but the test must preserve the inherited R1 sequence in which the connection is proposed, Krish can challenge false transfer, and the leader can accept, change or block it before the consequential call.

These are later proof needs expressly assigned by `g24-product-system-blueprint-r3.md` § **Proof carried forward, not falsely claimed now** and `g24-product-system-contract-r3.json` `/later_gate_requirements`; they are not missing G24.A semantic choices.

## Closed external actions

Preserved explicitly at `g24-product-system-contract-r3.json` `/authority/closed`: production write, customer data, account creation, external research run, model spend, email send, customer contact, session scheduling, session capture, connector creation, database branch creation, deployment, merge, feature enablement, release and legacy-backend deletion. The session atom separately states that a session opportunity grants no contact, scheduling, capture, transcription or learning authority.

## Owner decision

No current Human Agency break was identified under the frozen standard and artifacts. Later tests must prove enforcement and human comprehension; the council and founder retain the decision to lock or revise the architecture.

## Ledger proposal

None. No ledger write was authorised.
