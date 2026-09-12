# G24 R3 architecture council adjudication

**Run:** `g24-r3-architecture-council-002`

**Date:** 12 September 2026

**Role:** Final permanent-panel adjudicator

**Final status:** `BLOCKED_PENDING_REPAIR`

## Decision

The frozen R3 candidate is not ready for founder lock. Three bounded semantic repairs remain necessary:

1. selector-eligible epistemic outcomes need a current, versioned binding to the existing R1 governance and independent-challenger authority;
2. the engagement lifecycle must be one exact, total state graph and must remain incapable of granting or proving the separate R1 Release authority; and
3. the five-route selector must distinguish invalid controlling state from valid unresolved evidence conflict, with no actionable provisional result.

These are repairable trust seams. They do not justify redesigning the product direction, adding a second Brain, evidence store or Release root, or moving implementation and empirical proof into G24.A. No vote count was used. Each surviving defect independently meets the standard's current-gate veto boundary because an implementer could satisfy the frozen candidate while still choosing consequential trust or lifecycle semantics that the architecture must own now.

## Review integrity and hash verification

This was a history-aware final adjudication, not an eighth sealed specialist pass. I read the accepted standard, sealed manifest, cross-examination brief and freeze, all seven frozen specialist verdicts, all seven durable judge histories, both adversarial briefs, the non-voting founder calibration, the prior R2 adjudication, and the frozen R1, R2 and R3 artifacts needed to resolve the cited locators. Founder calibration was treated only as labelled inference. Conversation history and unrecorded founder prediction were not used.

PowerShell `Get-FileHash -Algorithm SHA256` over the exact local bytes confirmed every council-chain and frozen architecture hash referenced by the review pack:

- the standard, sealed manifest, three R3 submission artifacts, seven specialist verdicts, seven judge histories, prosecution, defense, founder calibration and prior R2 adjudication all matched their declared hashes;
- the R1 blueprint, contract and QA record, and the R2 blueprint, contract, delta and evidence note all matched their declared hashes;
- `brief.md` and `input-manifest.json` matched the identity hashes recorded by the specialist reviews; and
- the R1 commit `5e485aa458675df10cdb12d063404f1ebeb34e53` exists, and the three R1 files are byte-exact against it.

`cross-examination-freeze.json` has local SHA-256 `6416b8a5e354387c75282d88c64df62cf124ed78f77d9c33ee93e351c06114ae`; the pack supplies no separate expected comparator for that manifest, so only its referenced record hashes were independently matched.

One referenced supporting source cannot be recomputed from this repository: `compass_artifact_wf-7e315215-b996-5d15-8f27-1882bcc96ee3_text_markdown.md` at declared SHA-256 `26011bd2a93ee09de1c3b080f1f8062a9ed30436ada73a1bdee250437861c17a` is not present. The frozen evidence note explicitly marks it as supporting, non-normative and not independently re-verified. Its absence does not supply or defeat any ruling below and does not prevent adjudication of the frozen architecture.

All reviewed JSON artifacts parsed. Exact structural inspection of the R3 contract found nine unique R2 ownership mappings, zero declared new canonical roots, five unique selector outputs, sixteen closed external actions and fifteen question-version fields. It also reproduced two transition sources outside the declared state set, only one outgoing `preparing` edge, no explicit current epistemic-policy binding among controlling references or selector inputs, no current challenger or countercase result among selector inputs, and the prose versus contract conflict over `typed provisional result`.

## Veto adjudication

### EI-V1: selector-eligible epistemic production and live countercase

**Disposition:** Sustained, narrowed.

**Exact standard:** `standard.md` current-gate conditions 1, 3 and 5, plus `Epistemic Integrity`. Decision-shaping standing must derive from current canonical references under a trusted cutoff, visible uncertainty, contradiction and a live countercase. Similarity, copied labels and model confidence cannot upgrade standing or causality. The trusted selector must own the choice without leaving a consequential semantic decision to the implementer.

**Exact candidate locators:** `g24-product-system-blueprint-r3.md` lines 55-88 and 147-212; `g24-product-system-contract-r3.json` `/inherited_integrity/controlling_references`, `/inherited_integrity/use_specific_semantics`, `/intervention_selector/inputs`, `/intervention_selector/source_eligibility_before_burden` and `/intervention_selector/trusted_code_validates_references_precedence_and_transition`.

R3 correctly binds effective state to canonical R1 references, forbids model promotion, names a trusted cutoff, collapses common roots, preserves contradiction and gives trusted application code the final route transition. The defense is therefore right that no new evidence subsystem, final source matrix, causal ontology or physical schema is required at G24.A.

The defense does not close the remaining seam. R1 names a governance layer and an independent challenger, but R3 does not bind the current version of that governance policy or the current challenger result into selector eligibility, output watermarks or invalidation. It records `source_capability`, `independence_requirement`, `sufficiency_result`, `causal_standing` and `applicability_result` without identifying the trusted, current evaluation that alone may produce those results. It also does not require a current countercase result or a bounded absence result. The sentence that a model cannot upgrade standing is necessary but not sufficient: it does not decide which policy and challenger result trusted code must enforce. Two implementations can choose different unwatermarked semantic policies over identical canonical evidence and return different eligible routes while satisfying the frozen field and transition declarations.

The prosecution therefore wins the explicit disagreement. Selector-eligible epistemic outcomes require an explicit current, versioned binding to existing R1 governance and independent-challenger authority at G24.A. This is a reference to existing authority, not a new canonical root.

### EI-V2 and BIR-V2: invalid selector state versus valid evidence conflict

**Disposition:** Sustained as one merged root.

**Exact standard:** current-gate condition 3, `Epistemic Integrity`, and `Behavioural and Implementation Reality`. The selector must be one trusted, total, mutually exclusive and fail-closed boundary.

**Exact candidate locators:** `g24-product-system-blueprint-r3.md` lines 186-212 and `g24-product-system-contract-r3.json` `/intervention_selector/outputs`, `/exactly_one_output`, `/total_for_invalid_missing_stale_ambiguous_and_contradictory_input` and `/fail_closed_output`.

Blueprint line 208 permits `abstain_hold` or an undefined `typed provisional result` for missing, stale, ambiguous, contradictory or invalid input. The machine contract permits exactly five routes and names only `abstain_hold` as fail-closed. Blueprint line 210 separately permits valid evidence conflict to seek an eligible resolving route. No frozen rule partitions invalid controlling authority from valid unresolved evidence or defines provisional result standing and actionability.

A conforming implementation can therefore treat provisional as an actionable `ask` or `enrich`, hold every contradiction, or route a valid contradiction. The ambiguity is semantic and current. Exact schemas and runtime proof remain later work, but the architecture must state the partition now.

### BIR-V1 and SALS-V1: lifecycle totality and close versus Release

**Disposition:** Sustained as one lifecycle root. The Release finding is not a separate subsystem repair.

**Exact standard:** current-gate condition 2, `Subject, Audience and Lifecycle Safety`, and `Behavioural and Implementation Reality`. Transitions must name human authority, preconditions, version binding, invalidation and receipts; lifecycle and Release boundaries must remain distinct; declared boundaries must be total.

**Exact candidate locators:** `g24-product-system-blueprint-r3.md` lines 94-129; `g24-product-system-contract-r3.json` `/lifecycle_policy/states`, `/lifecycle_policy/transitions` and `/lifecycle_policy/capability_policy`; R1 `g24-product-system-blueprint.md` lines 187-197 and 385-395; and `g24-product-system-contract.json` `/canonical_kernel/6` and `/surfaces/7/entry`.

The contract uses `intensive_proof_or_continuing` and `active_or_paused` as scalar `from` values even though neither is a declared state and no grouping grammar defines them. `preparing` can move only to `intensive_proof`, so cancellation, leader decline or abandonment has no defined terminal path. The reopen authority is also `new_explicit_engagement_decision`, not a named actor. These are consequential choices about eligibility, invalidation and retained work, not physical schema details.

R1 already owns Release as a separate canonical object entered by an accepted release request, so the sealed Release failure path is too broad if it assumes lifecycle state alone can lawfully override R1. However, R3 still permits `closing -> released` when the leader accepts a scoped release or merely a close outcome, then assigns that state `customer-held release only`. The frozen candidate lacks an explicit non-inference invariant. That contradiction must be removed inside the lifecycle repair so a close-only receipt can never be mistaken for Release authority.

## Four pass results under cross-examination

- **Human Agency:** the owned criterion holds. Answer evidence, rebuildable case effect and human-owned durable change remain distinct. The selector and lifecycle dependencies above must be repaired without weakening named human authority.
- **Consequential Usefulness:** the owned criterion holds at G24.A. Expected material effect is bound to the accepted R1 decision frame, and route mutation alone is excluded as value. Concrete discrimination and lift remain later proof.
- **Living Brain Integrity:** the no-shadow-Brain, immutable-history and no-private-cross-case-reasoning core holds. Its direct claims of epistemic and selector totality remain conditional on the repairs above.
- **Human Comprehension and Access:** the versioned intervention atom holds at architecture level. Exact wording, rendered comprehension, accessibility and observed consequence understanding remain later proof. The specialist's mechanical reference to fourteen fields is a non-material count error; the frozen contract contains fifteen and preserves the required atom semantics.

## Smallest sufficient root repairs

### Repair 1: bind epistemic eligibility to current R1 authority

Add one current, versioned binding, with any final physical name, from inherited controlling references and selector inputs to the existing R1 governance policy and independent-challenger result. Carry both versions in selector output watermarks and invalidation triggers.

Only the trusted evaluation under that binding may produce selector-eligible source capability, independence requirement, sufficiency, applicability, causal standing, contradiction treatment and countercase status. Models may propose evidence and labels but cannot make them eligible. The countercase input must be current, or explicitly record `none_found_within_declared_boundary` with that boundary. Missing, unknown, stale, invalid, inapplicable or indeterminate policy or challenger state returns `abstain_hold`.

Do not create a second evidence store, Brain, policy console or customer ontology. Do not lock exhaustive source classes, numeric thresholds, provider choices or physical fields here.

**Preserved resolving-test family:** freeze one selector case containing one source, two same-root syndications, one scope-mismatched but semantically similar Brain item, one live contradicting assertion and model-authored capable, sufficient, causal and applicable labels. With the current policy or countercase result absent, only `abstain_hold` is accepted and no derivative becomes eligible. With a current policy and challenger result that reject independence or applicability, the result remains `abstain_hold`. Changing model confidence or labels alone cannot change the route. Changing the policy or challenger version invalidates the prior result before use.

### Repair 2: make the lifecycle exact and keep Release separate

Use `closed`, not `released`, as the engagement terminal. Replace each grouped pseudo-state with explicit edges whose endpoints are declared states. Add a receipted `preparing -> closed` path for Krish cancellation or a recorded leader decline or withdrawal. Bind every edge to named human actor and authority, precondition, version match, before and after references, invalidation and receipt. A new `closed -> preparing` transition must be a new bounded Krish preparation decision and must not revive old grants.

Closing or cancelling preparation must invalidate prepared and unsent derivatives and leave only required access, correction, retention and deletion work eligible. State explicitly that no engagement state, close receipt, elapsed time or commercial event grants, proves or completes Release authority. The existing R1 Release object remains sole owner and requires its own current named-leader request or acceptance for one exact projection, purpose, audience and canonical version set. A controlling change invalidates a pending projection before use.

**Preserved lifecycle-totality test family:** parse the state set and transitions, require every endpoint except `none` to be an exact declared state, reject `_or_` and undefined group tokens, and run every permitted edge with matching and stale versions. A cancelled or declined preparation must reach `closed`, emit its receipt, invalidate prepared and unsent derivatives and reject non-enumerated work.

**Preserved `lifecycle_close_release_separation` test family:** a close-only receipt reaches `closed` but creates zero Release authority and zero eligible projection; a separate current leader acceptance makes only its exact projection eligible; audience narrowing or permission withdrawal before use invalidates it and emits a receipt; no lifecycle state alone satisfies the Release predicate.

### Repair 3: partition selector invalidity from resolvable conflict

Remove the selectable `typed provisional result` alternative. State identically in blueprint and contract that invalid controlling identity, subject, authority, audience, purpose, lifecycle, policy or version state returns exactly `abstain_hold`, creates no actionable intervention or derivative and cannot enter approval. Valid canonical state with unresolved evidence conflict may select `enrich`, `ask` or `session` only when that resolving route passes every preceding eligibility guard and carries the conflict forward; otherwise it holds. Provisional detail may exist only as non-authoritative diagnostic metadata on the hold receipt, never as a sixth route.

**Preserved five-defect fail-closed test family:** missing, stale, ambiguous, contradictory or invalid controlling input each returns only `abstain_hold`, emits no eligible `reuse`, `enrich`, `ask` or `session`, creates no approval state and persists no decision-shaping derivative.

**Preserved table-driven selector family:** hold the accepted frame constant and mutate missing subject, mismatched workspace, future-dated source, expired permission, stale frame, invalid lifecycle, missing or stale epistemic authority, valid independent conflict with an eligible resolving source, valid conflict without one, and a model route that violates precedence. Require exactly one of the five routes, hold every invalid controlling case, permit a resolving route only for the eligible valid-conflict case, preserve the conflict, prohibit side effects from provisional metadata and invalidate the result after any controlling watermark change.

## Protected product strengths

Every repair must preserve the nine-object R1 ownership map, one canonical Brain, no derivative self-awarded standing, human-owned purpose, standards, exceptions, judgement and final call, thirty days as an intensive window rather than hard expiry, explicit human continuation without permission renewal, decision-specific material effect rather than activity, eligible evidence before burden, common-root collapse and causal restraint, one visible question and one versioned intervention atom, non-punitive honest exits, quiet and abstention, Krish's pull-only control over prepared sessions, public-only real-identity tests with fictional internal depth, unproven Qualified Judgement Transfer and Question Yield, headless proof before material interface polish, and all sixteen currently closed external actions.

## Later proof remains later

G24.B/C still owns exact schemas and validators, trusted-clock and source attacks, semantic safe-novel cases, lifecycle execution, selector totality, runtime failure handling, competent same-evidence baselines and independently observed material effects. G24.D still owns exact question fixtures, rendered comprehension, accessibility and failed-save behaviour. Consented capture, delivery revalidation, erasure traversal, clean-room portability, decision-quality lift and commercial efficacy remain at their named later gates. Nothing in this adjudication claims implementation, usability or efficacy.

## Recheck requirement

Yes. These repairs change frozen submission bytes and require a fresh council. Freeze new blueprint, contract and delta hashes; rerun deterministic checks against the same test families; obtain seven fresh isolated specialist verdicts; then run fresh non-voting prosecution, defense and final adjudication. The current verdicts and this adjudication remain historical evidence and cannot certify revised bytes.

No external action opens on the frozen R3 candidate.
