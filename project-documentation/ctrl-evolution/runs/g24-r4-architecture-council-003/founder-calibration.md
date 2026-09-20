# G24 R4 founder calibration

**Run:** `g24-r4-architecture-council-003`

**Role:** non-voting Founder Calibration

**Standing:** labelled inference from durable founder evidence. This is not an eighth verdict, a majority calculation, a veto override, simulated founder approval or an implementation gate.

**Non-voting recommendation:** `LIKELY_FOUNDER_ALIGNED`. If, and only if, final adjudication finds that no valid current-gate veto survives cross-examination, the next founder decision should be one exact, dependency-closed G24 architecture lock. Implementation remains closed until Krish gives that lock. If the lock includes execution authority, it should open only the bounded local headless Crossing proof, not rendered experience, efficacy, customer data or any external action.

## Review boundary and hash verification

The first project artifact read was `cross-examination-brief.md`. Its expected SHA-256 was `e7b77bc180726281aaa2e20765d247f058beb1acf449d0cb04f496ed23edfb3c`; the independently recomputed SHA-256 was the same. Result: **match**.

PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` was used against the exact local bytes. The review-control records all matched their frozen identities:

| Record | Recomputed SHA-256 | Result |
|---|---|---|
| `standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
| `brief.md` | `ce4bc2eb8a28a769684afa72526b9d3e6c2890645621aa0fea5239c9a9fed5e1` | match |
| `input-manifest.json` | `ba748ee84e03c31fc9599a10accd713ba230d30868af324d1c6fec8da2606cc1` | match |
| `sealed-verdicts.json` | `67869c759a68ed7e31745a8c0a9416542ec37016d0509d31ab3eaf2ff4342140` | match |
| `cross-examination-brief.md` | `e7b77bc180726281aaa2e20765d247f058beb1acf449d0cb04f496ed23edfb3c` | match |

Every frozen R1 to R4 dependency named by `brief.md` also matched:

| Set | Artifact | Recomputed SHA-256 | Result |
|---|---|---|---|
| R1 | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| R1 | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| R1 | `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| R2 | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| R2 | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| R2 | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| R2 evidence | `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| R3 | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| R3 | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| R3 | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| R4 | `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| R4 | `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| R4 | `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

The seven sealed verdict files matched `sealed-verdicts.json` exactly:

| Specialist | Sealed verdict | Recomputed SHA-256 | Result |
|---|---|---|---|
| Human Agency | `PASS_WITH_WATCHPOINTS` | `a3ebd3a597ad46c4680e1d47f123c961ea5854af76c8cc5008914d8583723deb` | match |
| Epistemic Integrity | `PASS_WITH_WATCHPOINTS` | `81aa488556ebf513f8caebea44591f11b34cb97b2cc433a82fafcbec0061beb3` | match |
| Subject, Audience and Lifecycle Safety | `PASS_WITH_WATCHPOINTS` | `c2e5d34519ccae56fa2ac6c8f769735052aab2eaf6dfdfe10dccb39a2b210cbf` | match |
| Consequential Usefulness | `PASS_WITH_WATCHPOINTS` | `f53f44653cf34d9210cfcc0f250af1c09181b0e732ec63bf3f3b3c1cff854fc0` | match |
| Living Brain Integrity | `PASS_WITH_WATCHPOINTS` | `5371e1497d3e22e2ec8e5af1715d59ca6ebfdf5670a5480ca141a3ea1f8bac7d` | match |
| Human Comprehension and Access | `PASS_WITH_WATCHPOINTS` | `e8417f1c2a993f2c7facd9feee2302e8ac997f6e4dee093a25d74eda661402bd` | match |
| Behavioural and Implementation Reality | `PASS_WITH_WATCHPOINTS` | `5110086fb863f817b27427aa9e3a17954b8e721a4deb185b0d5c87518bb11379` | match |

The seven findings are preserved as seven separate rulings. Their agreement is relevant evidence, but it is not a vote count and cannot pre-empt the final adjudicator's independent treatment of any later alleged veto.

I did not read the R4 prosecution or defense and did not consult another agent. After the first-pass freeze, I read the seven admitted judge histories and the prior R2 and R3 adjudications for calibration. Their hashes matched the values admitted by the cross-examination brief: all seven history files matched; the R2 adjudication matched `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b`; and the R3 adjudication matched `abe26c55559950c749d1f203444fe0cac452812182646478e546b82ed841829a`.

## Durable founder evidence consulted

The following founder-evidence records were read and used as calibration rather than as authority over the council standard:

- `project-documentation/ctrl-evolution/README.md`, including `PRODUCT_TRUTH`, `NON_GOALS`, `VERTICAL_SLICE`, `FIRST_SURFACE`, the strategic synthesis, `D-001` to `D-064`, and the G13, G14, G20, G23 and G24 state records. Observed SHA-256 at review time: `0c7eca3921e98564a8ed51e15d381ed0293d55f8c0fba38fe384877317e284b9`.
- `project-documentation/ctrl-evolution/session-method-learning-log.md`, especially `Confirmed by Krish` and the correction chronology. Observed SHA-256: `65e2981e7d06b829e1a68641d25e84262af5299f4ce33ad0b3523070c7601150`.
- `project-documentation/ctrl-evolution/ledger.snapshot.jsonl`, 282 rows, with SHA-256 `6bb374cec9b4e8ce696a9d42d45acdf71ab166c1e140f8b065b12009dd016be0`, matching `ledger.snapshot.sha256`. The README identifies this as a stale audit surface at the `D-055` boundary, so it was used only for evidence through `D-055`, not as current authority over later decisions.
- `design/g23-product-spine-r2-founder-gate.md`, SHA-256 `4a42e60a4921aa1d0aad6f0abd2229cd02ab11b878678c9c48f42fa97f3b52a9`.
- `design/g20-decision-table-react-r4-founder-close.md`, SHA-256 `d0365e52d3da102a02f5ac337a6f343bb4ad74d1ec21fb00baa70187b3d2a91e`.
- `design/g20-decision-table-r4-founder-gate.md`, SHA-256 `9f4c103ce9213d371c59d5f682c7818c5696ef20d49796347b6cffce98e84e69`.
- `design/g14-decision-bench-r1-founder-lock.md`, SHA-256 `faf7a5295530ffdded77354966a17e26f348f4becb4404bbc78e2fe139ebcc68`.
- `design/g13-living-brain-r2-qa-record.md`, SHA-256 `c297a401254d0998347d1055e0e11a86509352a32f417b06d7aaff965e360157`, specifically its explicit `Founder approval` section.

Two requested filenames do not exist in this repository. `rg --files` resolved `design/g14-decision-bench-r1-founder-gate.md` to the actual nearby founder record `design/g14-decision-bench-r1-founder-lock.md`. It found no G13 founder-gate file; the actual nearby record carrying the founder approval is `design/g13-living-brain-r2-qa-record.md`. Neither missing filename is presented as if it existed.

## Founder-intent calibration

Every disposition in this section is an **inference**, not a statement of Krish's current approval.

| Documented product intention | R4 preservation | Labelled inference | Residual founder friction |
|---|---|---|---|
| A living and personal Brain | G13 R2's approved `Founder approval` makes personal becoming the hero and the transparent Living Brain a meaningful showpiece. G23 locks a private AI Brain whose accepted judgement may improve later different decisions. R1 supplies one canonical, versioned and portable Brain. R3 maps every extension object back to that Brain, and R4 creates no new canonical root while keeping Release separate from lifecycle. | **Likely aligned, high confidence.** R4 protects the truth substrate needed for a living Brain rather than reducing it to a transcript pile, graph layout or model memory. | The narrow next build could over-focus on selector receipts and demote personal becoming, later reuse and visible Brain growth. That would preserve the data model while losing the product. |
| Consequential, million-dollar AI-transition decisions | Ledger decisions `D-006`, `D-022`, `D-030`, `D-036`, `D-042` and `D-043`, plus the README's G15 failure record, reject small workflow learning as the product altitude. R1 binds CTRL to consequential AI-transition calls. R3 requires every route to name its material effect on the accepted human decision frame. R4 preserves that binding. | **Likely aligned, high confidence at architecture level.** R4 does not turn the product into general business advice, adoption activity or a generic AI tool. | Architecture can still be implemented against tidy low-value fixtures. G24.C must discriminate high-value, low-value and no-material-effect cases and compare CTRL with a competent same-evidence baseline before usefulness is claimed. |
| Human agency and final-quality accountability | G23 locks the Brain prepares, Krish challenges and leader decides split. Ledger records `D-009`, `D-010`, `D-039` and `D-040` reserve standards, critical assessment and final accountability to humans. R3 separates answer evidence, rebuildable case effects and human-owned changes. R4 prevents policy evaluation, lifecycle movement and close receipts from silently acquiring human authority. | **Likely aligned, very high confidence.** This is one of R4's strongest preserved intentions. | Runtime must prove that the wrong actor, a stale version, an honest exit or a model-authored label leaves human-owned state unchanged. Documents cannot prove that behavior. |
| Rich operator control with lightweight customer participation | The G14 founder lock approves a no-scroll private decision instrument with comparison, exact evidence, uncertainty, Living Brain context and session preparation. The G20 founder gate approves the full Decision Table only for Krish and reserves the customer surface as radically smaller. R2 gives Krish a prepared session opportunity; R3 keeps `approve`, `edit`, `hold` and `suppress` version-bound; R4 preserves pull-only control. | **Likely aligned, high confidence.** The operator retains the depth and editorial control Krish has repeatedly approved. | The operator room can still become a dense policy cockpit. Decision, uncertainty and one next move must remain primary, with governance one layer away. |
| A devastatingly simple customer experience | Ledger records `D-008`, `D-012`, `D-034`, `D-051` and the later D-064 record in README demand five useful minutes, tap-first mobile use, minimum interruption and a radically small customer surface. R2 defines one focal object, one primary action, one visible question and progressive disclosure. R3 binds wording, control, honest exits and consequence into one atom. R4 states that policy identifiers, lifecycle labels and receipts never become customer administration. | **Likely aligned as a protected direction, not yet proven.** R4's backstage complexity is compatible with simplicity because it is explicitly hidden from the customer. | The additive R1 to R4 document chain is itself difficult to hold in one human picture. More importantly, no rendered customer surface exists. Founder approval of the architecture must not be reported as approval of intuitive use. |
| Adaptive, high-yield questions and prepared conversations | Ledger records `D-003`, `D-027`, `D-033` and `D-034`, the session-method log's six confirmed practices, and the G20 R4 approval all demand evidence-aware, concrete, tap-first questioning with optional nuance. R2 builds the decision evidence map and least-burden acquisition ladder. R3 gives one total five-output selector and a versioned intervention atom. R4 makes invalid control hold and lets valid conflict seek a resolving route only after every prior guard. | **Likely aligned, high confidence on intended mechanism.** The architecture resolves the tension between proactive interest and protection of attention in favor of earned, decision-changing interruption. | High yield remains unproven. The safety machinery could produce either excessive holding or bureaucratic latency. Later proof must measure unnecessary questions, answer-control mismatch, obsolete follow-ups, interruption yield and actual decision effect. |
| Evidence, uncertainty and real countercases | Ledger records `D-019`, `D-028`, `D-030`, `D-033`, `D-040` and `D-044` require provenance, precise gaps, challenge, correction and independent review. R4 directly binds selector eligibility to current R1 governance and an exact current independent-challenger result, collapses missing or indeterminate authority into hold and preserves unresolved conflict. | **Likely aligned, very high confidence.** This is the clearest value added by the R4 amendment. | Countercase machinery becomes theatre if it produces badges or receipts without changing a real decision. Challenger adequacy and search-boundary quality remain G24.C proof obligations. |
| No generic business horoscope, verbal diarrhoea or technical theatre | The session-method log records direct rejection of generic synthetic backstory, abstract diagnostic language, layered explanatory clutter, self-congratulation and trust narration. G14 and G20 approvals instead reward direct decision support, concrete questions and evidence behind optional depth. R1 rejects generic business advice, graph theatre and profile completion. R4 keeps its policy and lifecycle machinery backstage. | **Likely aligned in the written architecture, medium-high confidence in execution.** The candidate contains strong anti-generic and anti-theatre constraints. | This is the largest experiential risk. A technically impeccable headless proof can still fail founder intent if the output is a polished receipt, generic recommendation or long explanation rather than a precise shift in a consequential decision and a visibly richer Brain. |

## What the seven sealed rulings add

The seven sealed specialists all found no current G24.A break under the exact R4 bytes. That agreement matters because each judge attacked a different path:

- Human Agency tried to smuggle authority from model labels, route selection, answers and lifecycle events into human-owned state.
- Epistemic Integrity attacked same-root volume, copied labels, stale policy, weak challenger state, causality and provisional routes.
- Subject, Audience and Lifecycle Safety attacked abandoned preparation, stale work, reopened grants and close-as-Release.
- Consequential Usefulness attacked a generic question that generated activity without changing a named high-value decision.
- Living Brain Integrity attacked shadow standing, private cross-case reasoning, rewrite and lifecycle-derived export authority.
- Human Comprehension and Access attacked leakage of policy language and severance of the one-question, natural-control and visible-consequence atom.
- Behavioural and Implementation Reality attacked grouped pseudo-states, malformed control, undefined provisional routes, hard-coded fixtures and receipt-only proof.

**Inference:** the independent findings are consistent with the founder evidence and with the prior R2 and R3 failure history. R4 repairs the exact recurring trust seams without reopening the product direction. This consistency supports a founder-lock recommendation, but it does not clear any defect that a later prosecution, defense or final adjudicator can validly establish.

## Likely founder friction, in priority order

1. **The lock object can make the whole product disappear.** R4 is deliberately a narrow technical amendment, but it only makes sense over the R1, R2 and R3 dependency chain. The G20 React founder close and G22 failure show that Krish loses confidence when a local object or detailed proof becomes the apparent product. The founder-facing lock should therefore state the complete product in plain language first, then attach the exact hashes and repair detail as evidence.

2. **A safe selector can still be an inert product.** R4 is strong on holding invalid state. Krish's record is equally strong that safety, activity and correct machinery are not value. The later proof must show a named consequential decision becoming materially sharper and must treat abstention as good only when it names the useful gap or next evidence.

3. **The personal Brain can be demoted by the headless slice.** Founder evidence makes personal becoming, continuity and a richer portable Brain part of the product, not decorative residue. A selector-only implementation that never demonstrates governed learning, correction and better later help would recreate the drift already diagnosed in G20 and G22.

4. **Backstage rigor can leak into verbal and visual clutter.** R4 correctly says customers never see policy identifiers, lifecycle labels or receipts. That boundary needs strict preservation. The customer should experience recognition, one useful move and a visible consequence, not the architecture's vocabulary.

5. **Architecture alignment is not intuitive-use proof.** The Human Comprehension ruling is appropriately a watchpoint pass. A founder lock now should reserve the dedicated customer interview, rendered concept divergence, fresh-participant comprehension and actual-device evidence.

6. **The governance work can become technical theatre.** The next proof should expose the decision, evidence, countercase, human call and changed Brain in founder-readable terms. Hashes, schemas and receipts are necessary evidence, never the hero.

## Exact questions that still require Krish

### Current founder decision

Only one product decision is genuinely needed from Krish at this gate, after a no-veto final adjudication:

> Do you approve the exact dependency-closed G24 architecture, comprising the verified R1 baseline, R2 direction, R3 executable repair and R4 terminal amendment, as the governing contract, and authorise only its bounded local headless Crossing proof: one personal canonical Brain, consequential AI-transition decisions, the Brain preparing, Krish challenging, the leader deciding and owning final quality, least-burden evidence or one earned intervention, explicit countercase and abstention, correction-aware later reuse, and a customer experience that hides the machinery?

The question should state the withheld scope in the same view: no final schema, thresholds, model or provider choice, UI concept or copy, intuitive-use claim, decision-quality claim, customer data, external research, model spend, contact, scheduling, capture, connector, database branch, deployment, merge, feature enablement, Release or legacy deletion.

If Krish challenges the lock, the follow-up should be only:

> Which exact commitment is wrong or missing: the product spine, duration and continuation, human authority, evidence and countercase, route selection, operator/customer split, Brain learning and correction, Release separation, or proof sequence?

This keeps the response actionable and avoids reopening settled choices through a generic request for thoughts.

### Later founder questions, not blockers to G24.A

The G20 R4 founder gate explicitly reserves a dedicated customer-participation interview. These decisions still require Krish before customer-surface design and must not be guessed by an agent:

1. When a leader opens CTRL between sessions, what single object should dominate the five-second home state: the most important earned question or action, honest overall standing, or the current Brain portrait?
2. What can CTRL show as overall progress or standing without turning the relationship into a completion score, course, performance judgement or dashboard?
3. Which exact customer-interruption triggers may AI propose, which require Krish's preview or edit, and may any ever become fully automated?
4. For an allowed prompt, what timing, urgency, quiet-hour, channel, expiry, snooze, suppression and rescheduling controls must Krish retain?
5. If Mindmaker email is later enabled, whose name and address speak, where replies return, and how should relationship tone, third-party material, off-record content and corrections be handled?
6. What should the customer see when evidence is stale or contradictory, the premise is wrong, delivery fails, or no question has earned interruption, so the state remains useful without creating homework?

These later questions should be asked with concrete scenarios or rendered alternatives, as the founder gate requires. They do not need answers before the architecture lock or headless proof.

The following are not genuinely open and should not be re-asked without new contradictory evidence: CTRL's private Brain product spine, AI-transition scope, company-funded value through a more capable leader, the Brain/Krish/leader authority split, human final accountability, personal and company asset separation, rich operator versus minimal customer surfaces, one-question progressive disclosure, evidence before interruption, correction and repair, or the separation of engagement close from portable Release.

## Non-voting recommendation and next gate

**Inference:** R4 likely preserves Krish's documented intention closely enough to place the exact architecture before him for lock. It is opinionated about the mechanism while correctly reserving the empirical and visual claims he has not approved.

**Recommendation:** final adjudication should first test any prosecution and defense claims independently. If no valid veto survives, present Krish one plain-language lock question over the complete dependency-closed identity, with the hash manifest attached and the withheld scope explicit. Do not ask for another broad architecture workshop. If Krish's exact lock authorises the bounded local headless Crossing proof, proceed only to that proof and make its acceptance signal decision movement plus governed later Brain value, not successful receipt generation.

**Sharper alternative:** if the final adjudicator finds the architecture clear but the four-layer lock object too hard to comprehend, do not rewrite the frozen candidate. Present a one-page, non-normative founder lock cover that names the product, the exact composite hashes, the three R4 repairs, what remains unproven and the one next proof. The frozen artifacts remain the binding dependency chain.

**Counterpoint:** the seven watchpoint passes do not establish that Krish will accept the composite, that the customer experience will feel magical or that the selector will improve a real decision. The current confidence is about documented intention preserved in architecture, not product efficacy.

## External-action closure

No external action was performed or opened. `g24-product-system-contract-r4.json` `/authority/closed` continues to close production write, customer data, account creation, external research, model spend, email, customer contact, session scheduling, session capture, connector creation, database branch creation, deployment, merge, feature enablement, Release and legacy-backend deletion. `g24-product-system-r4-delta.json` `/external_actions_opened` is `[]`.

This calibration authorises no headless implementation, customer-facing design, external system action, ledger write, deployment, Release or gate-state change. The only mutation made by this reviewer is this local founder-calibration record.
