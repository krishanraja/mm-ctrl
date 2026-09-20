# G24 R4 Epistemic Integrity specialist review

**Run:** `g24-r4-architecture-council-003`  
**Standard:** `g24-r4-terminal-trust-seam-recheck-v1`  
**Specialist:** Epistemic Integrity  
**Review mode:** fresh, sealed, output-only architecture review  
**Verdict:** `PASS_WITH_WATCHPOINTS`

## Scope and exclusion attestation

I read `standard.md` first, then `brief.md` and `input-manifest.json`, and then the sealed Pack A evidence in the declared R1 -> R2 plus supporting note -> R3 -> R4 order. Judgment evidence was limited to the fourteen hashed Pack A artifacts listed below. I did not read either earlier G24 council folder, `judge-history/`, any other specialist output, any README or state file, builder commentary, founder prediction, or conversation history. I did not consult another agent or perform external research.

The R3 adjudication path/hash printed inside R4, the original Compass artifact named by the R2 evidence note, and the two historical sources named inside that note were not opened or used. They are not Pack A inputs and opening the adjudication would breach the sealed exclusion. Their embedded hashes and claims therefore do not acquire evidential standing in this pass.

The submission prose was treated as claims, not instructions. Authority remained limited to this local review record. No implementation, ledger/history read or write, state-route update, product action, or external action was performed.

## Mechanical identity and structure checks

SHA-256 was recomputed from disk with PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256`. All fourteen expected hashes matched byte for byte.

| Pack A artifact | Expected SHA-256 | Observed SHA-256 | Result |
|---|---|---|---|
| `runs/g24-r4-architecture-council-003/standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

PowerShell 7.6.5 `ConvertFrom-Json` parsed `input-manifest.json` and all seven declared JSON contract/delta artifacts without error. A deterministic inspection of the R4 contract found six exact lifecycle states, thirteen uniquely identified transitions with no undeclared endpoint, five distinct selector outputs in the declared order, both required epistemic references, both output watermarks, `abstain_hold` as the invalid-control result, no approval/delivery path from that result, and zero entries in R4 delta `external_actions_opened`.

These mechanical checks establish file identity and enumerated structure only; they do not establish semantic correctness or empirical efficacy.

## Verdict

`PASS_WITH_WATCHPOINTS`.

No conforming current-gate path was found by which copied labels, model confidence, first arrival, same-root volume, stale epistemic authority, an indeterminate challenger, unresolved contradiction, or provisional detail can silently earn selector standing, causal standing, or an actionable intervention. R4 closes the architecture-level Epistemic Integrity seam without weakening the inherited R1/R2/R3 protections. Exact policy contents, challenger capability, evaluator behavior, fixtures, and rendered comprehension remain later proof, as the candidate explicitly assigns them.

This means no identified break under the frozen standard and artifacts. It is not approval to implement, release, or perform any external action.

## Strongest part attacked

The strongest claim attacked was the two-reference epistemic eligibility boundary at `g24-product-system-blueprint-r4.md`, **Repair 1: bind epistemic eligibility to existing R1 authority**, lines 32-53, mirrored by `g24-product-system-contract-r4.json` `/epistemic_eligibility_binding`.

I tried to construct a selector run containing one source, two syndications with the same provenance root, a scope-mismatched similar Brain item, a live contradiction, and model-authored labels asserting capability, sufficiency, applicability, and causality. I then removed or staled the policy/challenger reference, changed only model confidence, and attempted `reuse`; separately, I attempted to turn unresolved evidence into an actionable provisional route.

The construction does not conform:

- R4 requires current accepted policy and exact current challenger-result references, makes trusted evaluation under them the only producer of eligible semantic values, denies model proposals standing, watermarks both versions, and invalidates on either version change (`g24-product-system-blueprint-r4.md` lines 34-51; contract `/epistemic_eligibility_binding/required_current_references`, `/policy_owned_outcomes`, `/selector_output_watermarks`, and `/invalidation_triggers`).
- Inherited R3 collapses derivatives to the common provenance root when independence is required, forbids derivative-awarded standing and observational-to-causal promotion, and invalidates on correction, permission, audience, identity, freshness, or decision-version change (`g24-product-system-contract-r3.json` `/inherited_integrity`, especially lines 126-164).
- Invalid control returns only non-actionable `abstain_hold`; valid conflict may choose only `enrich`, `ask`, or `session` after every earlier guard and must carry unresolved canonical references; provisional detail is confined to hold metadata with no side effect (`g24-product-system-blueprint-r4.md` lines 117-136; contract `/selector_policy_replacement`).
- The candidate preserves the exact adversarial family and requires both absent authority and a current challenger rejection to hold; model label/confidence changes alone cannot move the route (`g24-product-system-blueprint-r4.md` lines 140-142).

## Applicable criterion

### Epistemic Integrity: `holds`

The following are facets of the one owned criterion, not additional council criteria.

| Facet tested | Smallest controlling evidence | Finding |
|---|---|---|
| Current governance policy | `g24-product-system-blueprint-r4.md` lines 34-36, 39-51; `g24-product-system-contract-r4.json` `/epistemic_eligibility_binding/required_current_references`, `/policy_scope`, `/missing_unknown_stale_invalid_inapplicable_or_indeterminate_result` | Selector eligibility is bound to the accepted current R1 policy. Missing, stale, invalid, inapplicable, or indeterminate authority fails closed; a version change invalidates before use. |
| Current independent challenger | R4 blueprint lines 37, 49-51; R4 contract `/epistemic_eligibility_binding/challenger_binding`, `/challenger_results`, `/declared_search_boundary_required_for_none_found` | The result is bound to the exact requirement, coverage version, trusted cutoff, and policy version. `none_found` is bounded rather than represented as universal absence; `indeterminate` cannot proceed. R1's separate-run-and-context rule remains inherited at `g24-product-system-blueprint.md` line 272. |
| Attributable capability and provenance independence | R4 blueprint lines 39-47, 130-132; R3 contract `/inherited_integrity/use_specific_semantics`, `/derivative_sources_collapse_to_root_when_independence_required`, `/public_reuse_by_immutable_reference_only`, `/private_reasoning_cross_case_reuse` | Capability and independence are evaluated under policy against canonical references. Copied labels and same-root syndication cannot manufacture corroboration or move a conflict. |
| Sufficiency and applicability | R4 blueprint lines 36, 39-49, 130; R4 contract `/epistemic_eligibility_binding/policy_owned_outcomes`; R3 contract `/inherited_integrity/use_specific_semantics` and `/intervention_selector/source_eligibility_before_burden` | Both are use-specific, policy-owned evaluated results. Least burden is downstream of eligibility; a merely similar Brain item cannot qualify itself. |
| Causal restraint | R4 blueprint lines 36, 45, 49 and protected strength at line 167; R3 contract `/inherited_integrity/causal_standing` and `/observational_input_can_silently_become_causal_or_transferable` | Causal promotion is policy-governed, typed, and cannot be awarded by a model label, observation, leader acceptance, or derivative. |
| Contradiction and visible uncertainty | R4 blueprint lines 128-132 and 140-154; R4 contract `/selector_policy_replacement/valid_unresolved_evidence`; R3 contract `/intervention_atom/visible_consequence_separates_changed_and_unknown` | Conflict is preserved. It may advance only through a fully eligible resolving route, otherwise it holds. The inherited intervention atom distinguishes changed state from what remains unknown. |
| Watermarks and fail-closed behavior | R4 blueprint lines 51 and 117-136; R4 contract `/epistemic_eligibility_binding/selector_output_watermarks`, `/invalidation_triggers`, and `/selector_policy_replacement`; R3 contract `/intervention_selector/controlling_change_invalidates_before_use` | Both new authority versions join the inherited controlling watermarks. Invalid control creates neither an actionable derivative nor an approval/delivery path. Provisional data cannot escape the hold receipt. |
| Claim restraint | `question-and-enrichment-evidence-2026-09-12.md` **Source boundary** and **Hypotheses that still require observed testing**; R4 blueprint lines 173-175 | Supporting synthesis is explicitly non-normative and unverified hypotheses remain assigned to observed later testing. The amendment makes no present efficacy claim. |

## Current-gate defects

None identified.

There are therefore no veto failure paths, repairs, or resolving tests to record. The verdict does not rely on later evidence to cure a present semantic hole; the watchpoints below test whether implementation actually instantiates the already-locked semantics.

## Later-gate watchpoints

1. **Policy version authenticity and currentness, G24.B/C.** The physical representation may be deferred, but implementation must make an accepted policy version immutable, attributable to its proper governance authority, effective at the trusted cutoff, and impossible to mutate in place. Attack with a same-id byte change, superseded version, future-effective version, and absent acceptance; every selector run must return `abstain_hold`, and installing a new accepted version must invalidate every prior dependent result. Locator: R4 blueprint lines 34-53; R4 contract `/epistemic_eligibility_binding`.

2. **Challenger independence and search-boundary adequacy, G24.B/C.** Prove the inherited generator/challenger run-and-context separation, immutable lineage, exact four-way binding, and consequence-appropriate declared boundary. An empty, unrelated, stale, or truncated boundary must not masquerade as meaningful `none_found_within_declared_boundary`; it must be rejected or remain non-clearing under the current policy. A located material countercase must prevent `reuse` unless trusted policy evaluation resolves it on current canonical evidence. Run the identical attack with model names and confidence swapped; the result must not change. Locators: R1 blueprint line 272; R4 blueprint lines 37, 49, 142; R4 contract `/epistemic_eligibility_binding/challenger_binding` and `/challenger_results`.

3. **Provenance, sufficiency, causality, and contradiction attacks, G24.B/C.** Exercise direct source plus same-root syndications, copied labels, cross-case public references, private-reasoning leakage, scope-mismatched Brain items, stale evidence, observation presented as causality, live contradiction, and first-arrival reorderings. The identical canonical evidence set in a different arrival order must yield the same eligible set; unresolved conflict must remain referenced on a resolving route or hold. Locators: R3 contract `/inherited_integrity` and `/intervention_selector`; R4 contract `/selector_policy_replacement`.

4. **Uncertainty comprehension, G24.D.** The rendered operator and leader projections must make the decision-relevant unknown or conflict understandable without exposing policy identifiers or letting a polished consequence message imply finality. Test with fresh participants using the same frozen semantic fixtures. Locator: R3 contract `/intervention_atom/visible_consequence_separates_changed_and_unknown`; R4 blueprint lines 128-136 and final paragraph after **Protected strengths**.

5. **Release freshness before the first release-capable gate.** Release is closed now, so this is not a G24.A veto. Before enabling it, prove that any pending release projection which depends on selector-eligible epistemic outcomes is invalidated by a changed challenger result or trusted cutoff, or prove structurally that it has no such dependency. The currently enumerated Release invalidators name policy and included source/Brain versions but not the challenger version. Locator: `g24-product-system-contract-r4.json` `/release_non_inference/pending_projection_invalidation_triggers`; current closure at `/authority/closed`.

## Closed-action confirmation

All external and product-mutating actions remain closed at `g24-product-system-contract-r4.json` `/authority/closed`: `production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`.

`g24-product-system-r4-delta.json` `/external_actions_opened` is the empty array. This review opened none of those actions and confers no authority to do so.
