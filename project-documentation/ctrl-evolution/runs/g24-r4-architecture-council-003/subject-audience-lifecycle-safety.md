# Subject, Audience and Lifecycle Safety

**Run:** g24-r4-architecture-council-003  
**Standard:** g24-r4-terminal-trust-seam-recheck-v1  
**Specialist verdict:** **PASS_WITH_WATCHPOINTS**

No current-gate Subject, Audience and Lifecycle Safety defect remains in the frozen R4 candidate. The exact six-state graph is total at its declared boundary; every edge has human authority, current-version, invalidation and receipt semantics; abandoned preparation closes safely; commercial state cannot grant or renew permission; reopening is a new bounded preparation decision; and engagement close is non-inferential with respect to the separate R1 Release authority. The remaining risks are implementation and observed-proof obligations already assigned to later gates.

## Attestation and authority

- I read standard.md in full before the submission, then brief.md and input-manifest.json.
- I then read only the named frozen project evidence in Pack A order: the three R1 artifacts; the three R2 artifacts and named supporting evidence note; the three R3 artifacts; and the three R4 artifacts.
- I did not open either earlier G24 council folder, judge-history, another specialist output, builder commentary, founder prediction, README/state files, or any other project artifact. I did not consult another agent. References to prior councils embedded in the frozen R3/R4 artifacts were treated as submission claims and were not followed.
- Review scope was limited to Subject, Audience and Lifecycle Safety. Selector findings below are included only where invalid controlling state could break subject, audience, permission or lifecycle safety.
- Authority was output-only: this one local review record. I performed no external research, model-spend action, customer-data action, message, contact, scheduling, capture, connector, database, deployment, merge, feature enablement, Release or deletion action.

## Frozen-byte verification

PowerShell Core 7.6.5 Get-FileHash -Algorithm SHA256 was run against every hash-declared Pack A artifact. All computed values matched.

| Artifact | Computed SHA-256 | Result |
|---|---|---|
| project-documentation/ctrl-evolution/runs/g24-r4-architecture-council-003/standard.md | 8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b | match |
| project-documentation/ctrl-evolution/g24-product-system-blueprint.md | 2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a | match |
| project-documentation/ctrl-evolution/g24-product-system-contract.json | 16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba | match |
| project-documentation/ctrl-evolution/g24-product-system-qa-record.md | e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731 | match |
| project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md | 52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980 | match |
| project-documentation/ctrl-evolution/g24-product-system-contract-r2.json | 1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2 | match |
| project-documentation/ctrl-evolution/g24-product-system-r2-delta.json | d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2 | match |
| project-documentation/ctrl-evolution/research/question-and-enrichment-evidence-2026-09-12.md | c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb | match |
| project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md | 446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5 | match |
| project-documentation/ctrl-evolution/g24-product-system-contract-r3.json | 5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09 | match |
| project-documentation/ctrl-evolution/g24-product-system-r3-delta.json | c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb | match |
| project-documentation/ctrl-evolution/g24-product-system-blueprint-r4.md | d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a | match |
| project-documentation/ctrl-evolution/g24-product-system-contract-r4.json | 58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c | match |
| project-documentation/ctrl-evolution/g24-product-system-r4-delta.json | 4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85 | match |

The adjudication hash repeated inside R4 was not checked because its source is in an explicitly excluded earlier council folder and is not a Pack A input.

## Mechanical findings

PowerShell Core 7.6.5 ConvertFrom-Json parsed the manifest and all seven named JSON contracts/deltas without error.

Against project-documentation/ctrl-evolution/g24-product-system-contract-r4.json:

- /lifecycle_policy_replacement/states contains exactly six states in the declared order: preparing, intensive_proof, continuing, paused, closing and closed. released is absent.
- /lifecycle_policy_replacement/transitions contains 13 unique exact edges. Every endpoint other than the initial none sentinel is one of the six states; no grouped token or implied edge appears.
- Every transition object contains id, from, to, actor, authority, precondition, from_version_match, invalidation and receipt. Every non-initial edge requires a from-version match.
- /lifecycle_policy_replacement/transition_envelope additionally requires idempotency_key, before_ref and after_ref for every edge.
- /lifecycle_policy_replacement/absence_of_receipt_changes_state is false; /stale_or_invalid_transition is reject_without_state_change.
- /lifecycle_policy_replacement/commercial_state_grants_permission and /reopen_revives_expired_authority are both false.
- /release_non_inference assigns ownership to the existing R1 canonical Release object; its state/receipt/commercial inference flags are false, close_without_release_allowed is true and release_closes_engagement is false.
- /authority/closed keeps every external action closed, and project-documentation/ctrl-evolution/g24-product-system-r4-delta.json#/external_actions_opened is empty.

These checks prove the written structure only. They do not prove transactional compare-and-set, queued-work cancellation, delivery-time revalidation, retention traversal, or human comprehension in a runtime.

## Strongest part attacked

I attacked the terminal lifecycle seam as one adversarial chain: Krish opens bounded preparation; the leader declines after private work has been prepared; an old question is then offered for approval; the engagement is reopened under a new purpose while an old grant is expired; a close receipt is presented as authority for a portable Release; and audience is narrowed before an independently requested Release projection is used.

The candidate blocks every step:

- preparing -> closed requires the current preparation version and a human-grounded cancellation, decline or withdrawal reason, invalidates every prepared and unsent derivative, and emits preparation_closed.
- closed permits no operational or decision-shaping use.
- closed -> preparing opens a new period under a new bounded decision and cannot revive an old grant.
- commercial state is explicitly incapable of granting permission.
- no lifecycle state or close receipt can grant, prove or complete Release; a current named-leader Release action is separate and binds one exact projection, purpose, audience and included canonical versions.
- audience or permission change before use invalidates the pending projection and requires a receipt.

Exact locators: g24-product-system-blueprint-r4.md, “Exact transition graph”, rows preparing -> closed and closed -> preparing; “Closed-state capability”; “Release non-inference”; g24-product-system-contract-r4.json#/lifecycle_policy_replacement/transitions/2, /transitions/12, /capability_policy/closed, /commercial_state_grants_permission, /reopen_revives_expired_authority, and /release_non_inference.

## Criterion finding

### Subject, Audience and Lifecycle Safety: holds

The following are facets of the one owned criterion, not new criteria.

| Facet | Disposition | Evidence and finding |
|---|---|---|
| Subject, source permission, purpose, audience, validity, correction, expiry and retention remain distinct | holds | R1 g24-product-system-blueprint.md, “Universal source envelope” and “Brain-item standing”, separately require subject, ownership, exact audience ceiling and purpose, consent/retention, currentness/recheck, validity, version and correction history. R3 g24-product-system-contract-r3.json#/inherited_integrity/controlling_references retains workspace, subject, authority/permission version, purpose, audience, validity and retention state; #/invalidation_triggers keeps correction, permission, audience, identity and freshness changes distinct. R4’s narrow precedence at g24-product-system-contract-r4.json#/normative_precedence preserves those rules and adds policy/challenger version invalidation rather than replacing the R1 owners. |
| Exact lifecycle graph and transition envelope | holds | g24-product-system-blueprint-r4.md, “Universal transition envelope” and “Exact transition graph”; g24-product-system-contract-r4.json#/lifecycle_policy_replacement/states, /transition_envelope and /transitions. The graph is exactly six states and 13 declared edges. Stale versions, missing authority, invalid edges and conflicting duplicates fail without changing state; absent receipts do not imply movement. |
| Every declared edge has sufficient human/version/invalidation/receipt semantics | holds | The edge audit below confirms all 13 transition objects against g24-product-system-contract-r4.json#/lifecycle_policy_replacement/transitions/0 through /12. The universal idempotency and before/after reference duties apply to every edge via /transition_envelope. |
| Abandoned preparation closes safely | holds | g24-product-system-blueprint-r4.md, preparing -> closed row and “Lifecycle totality”; g24-product-system-contract-r4.json#/lifecycle_policy_replacement/transitions/2. Krish may cancel or record the named leader’s decline/withdrawal; current version and reason are required; all prepared and unsent derivatives are invalidated; closed then forbids operational use. |
| Pause, close and reopen preserve human authority | holds | g24-product-system-contract-r4.json#/lifecycle_policy_replacement/transitions/5 through /12 and /capability_policy. Either named human may pause or start closing; resume requires both named humans and revalidation of purpose, identity, grants, audience, standing, freshness, next value and checkpoint; close completion remains tied to the named-human close request; reopen is a new bounded preparation version. |
| Commercial state is not permission | holds | g24-product-system-blueprint-r4.md, paused -> continuing and closed -> preparing rows plus “Protected strengths”; g24-product-system-contract-r4.json#/lifecycle_policy_replacement/commercial_state_grants_permission=false and /reopen_revives_expired_authority=false. R3’s inherited permission-change rule at g24-product-system-blueprint-r3.md, “Permission change before use”, separately invalidates dependent unsent artifacts. |
| Engagement close and R1 Release are absolutely non-inferential | holds | g24-product-system-blueprint-r4.md, “Closed-state capability”, “Release non-inference” and “Close and Release separation”; g24-product-system-contract-r4.json#/release_non_inference. released is not a lifecycle state; close may complete without Release; Release does not close an engagement; only a current named-leader Release action can make its exact projection eligible. |
| Invalid subject/audience/lifecycle control cannot become an actionable route | holds | g24-product-system-blueprint-r4.md, “Invalid controlling state”, “Valid unresolved evidence” and “Selector partition”; g24-product-system-contract-r4.json#/selector_policy_replacement. Missing, mismatched, expired, invalid or indeterminate controlling state returns only abstain_hold, cannot enter approval/delivery, and provisional detail can exist only as non-authoritative hold metadata. This directly protects the owned criterion. |

## Edge-by-edge lifecycle audit

| Edge | Human authority | Version/precondition | Invalidation/receipt | Result |
|---|---|---|---|---|
| none -> preparing | Krish | bounded subject, purpose, eligible source classes and review date; initial none sentinel | opens period; no-contact/preparation-opened receipt | holds |
| preparing -> intensive_proof | named leader and Krish | exact preparing version; accepted purpose, frame, current permissions/grants and checkpoint | superseded preparation projections; acceptance receipt | holds |
| preparing -> closed | Krish cancelling or recording named leader decline/withdrawal | exact preparing version and reason | all prepared and unsent derivatives; preparation-close receipt | holds |
| intensive_proof -> continuing | named leader and Krish | exact period; next decision/evidenced value, checkpoint, exit/revisit | superseded period projections; continuation receipt | holds |
| continuing -> continuing | named leader and Krish | exact current period; fresh checkpoint agreement, next value, exit/revisit | superseded period projections; renewal receipt | holds |
| intensive_proof -> paused | named leader or Krish | exact current period and pause decision | all unsent interventions; pause receipt | holds |
| continuing -> paused | named leader or Krish | exact current period and pause decision | all unsent interventions; pause receipt | holds |
| paused -> continuing | named leader and Krish | exact paused version; purpose, identity, grants, audience, standing, freshness, next value and checkpoint revalidated | stale paused projections; resume receipt; old grants remain expired | holds |
| intensive_proof -> closing | named leader or Krish | exact current period and close request | new decision-shaping work and unsent interventions; close-request receipt | holds |
| continuing -> closing | named leader or Krish | exact current period and close request | new decision-shaping work and unsent interventions; close-request receipt | holds |
| paused -> closing | named leader or Krish | exact current period and close request | new decision-shaping work and unsent interventions; close-request receipt | holds |
| closing -> closed | Krish recording completion under the named-human close request | exact closing version; access, correction, separately requested Release and close obligations fulfilled or explicitly outstanding | all prepared and unsent derivatives; close-completion receipt | holds |
| closed -> preparing | Krish | exact closed version; new bounded purpose and review date; no old-grant revival | new period; new-preparation receipt | holds |

## Current-gate defects

None. There is no veto, so no veto failure path, repair text or resolving test is applicable.

## Later-gate watchpoints

1. **Atomic transition enforcement.** The initial none sentinel must be an atomic non-existence compare, and every other edge must compare-and-set the exact current from-version. Exercise all 13 matching-version cases, all 13 stale-version cases, two concurrent opens with different idempotency keys, conflicting duplicate content and every undeclared state pair. Pass only if one authorised transition and one append-only receipt occur, with no split current state.
2. **Cancellation and last-moment use checks.** In G24.B/C and the first delivery gate, pause, preparation close, close request, final close, permission withdrawal and audience narrowing must cancel or quarantine queued and delayed work, not merely hide it. Use a delayed enrichment job, approved-but-unsent question, context capsule and pending delivery intent; change each controlling state immediately before use. Pass only if no stale artifact becomes operational or enters delivery and each invalidation is receipted.
3. **Correction, retention and Release traversal.** R1 correction/repair and retention semantics remain normative, while R4 explicitly defers exact revocation traversal, residue and non-recall behaviour. At the named delivery/data gate, correct an included Brain item, expire retention, withdraw permission and narrow audience after Release projection compilation but before use. Pass only if the pending projection is ineligible, the exact affected versions are receipted, required deletion wins over operational reuse, and a prior immutable customer-held release is described honestly rather than silently recalled.
4. **Human comprehension without policy administration.** At G24.D, test in rendered language that a fresh leader understands pause does not erase data, resume does not renew expired consent, close does not create an export, and a separate Release does not close the engagement, while internal lifecycle and policy identifiers stay hidden. This is observed proof, not an architecture defect.

## Closed-action confirmation

All external actions remain closed in g24-product-system-contract-r4.json#/authority/closed, and g24-product-system-r4-delta.json#/external_actions_opened is empty. This review does not authorise the headless Crossing, customer-facing design, customer data, external research, model spend, contact, scheduling, capture, delivery, connector or database work, deployment, merge, feature enablement, Release, or legacy deletion.

The council and founder remain the decision owners for G24.A. This verdict means no Subject, Audience and Lifecycle Safety break was identified under the frozen standard and hashes; it is not implementation or Release approval.
