# G24 R4 sealed specialist review: Living Brain Integrity

**Run:** `g24-r4-architecture-council-003`  
**Standard:** `g24-r4-terminal-trust-seam-recheck-v1`  
**Criterion owner:** Living Brain Integrity  
**Review mode:** fresh, isolated, sealed Pack A pass  
**Authority:** advisory local review record only  
**Verdict:** `PASS_WITH_WATCHPOINTS`

## Attestation

I read `standard.md` in full before the submission, then `brief.md` and `input-manifest.json`, and then followed the declared Pack A order: R1 baseline, R2 direction and the named supporting evidence note, R3 repair dependency, and the three R4 artifacts.

I did not open either earlier G24 council folder, `judge-history/`, any other specialist output, builder commentary, founder prediction, repository README/state files, or prior conversation history. References to earlier councils and historical files inside frozen artifacts were treated as inert claims; I did not follow them. I used no external research and consulted no other agent. Process-only review doctrine outside the repository pack was not treated as evidence.

The reviewed authority is output-only. This pass does not approve, build, mutate, send, deploy, release, or alter gate state.

## Frozen identity and hash verification

Mechanical method: PowerShell `7.6.5`, `Get-FileHash -Algorithm SHA256`, over the exact local bytes named by the sealed brief and manifest. Every one of the 14 declared Pack A hashes was independently recomputed and matched.

| Set | Artifact | Declared SHA-256 | Observed SHA-256 | Result |
|---|---|---|---|---|
| Standard | `runs/g24-r4-architecture-council-003/standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
| R1 | `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| R1 | `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| R1 | `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| R2 | `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| R2 | `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| R2 | `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| R2 evidence | `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| R3 | `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| R3 | `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| R3 | `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| R4 | `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| R4 | `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| R4 | `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

The adjudication and original Compass digests quoted inside frozen artifacts are provenance statements, not Pack A file identities. Their source files are excluded or absent from the sealed manifest, so I did not open or hash them.

## Mechanical checks

PowerShell `ConvertFrom-Json` parsed the input manifest and all seven frozen JSON artifacts without error. Deterministic inspection of the R4 contract found:

- exactly the six declared engagement states;
- 13 uniquely identified transitions, with no undeclared endpoint, `_or_` pseudo-state, duplicate id, or missing non-initial version match;
- exactly the five selector outputs and `exactly_one_output: true`;
- every invalid controlling state routed to non-actionable `abstain_hold`;
- both new current references present as selector inputs, both version watermarks present on output, and both changes present as selector invalidation triggers;
- provisional detail confined to non-authoritative metadata on an `abstain_hold` receipt and unable to change the Brain or enter approval;
- no new Brain, evidence-policy/challenger, or Release root;
- no lifecycle or close-receipt inference of Release authority;
- every R3 closed action retained by R4; and
- `external_actions_opened` is an empty array.

These checks establish only the enumerated structure of the frozen bytes. They do not prove runtime reference resolution, transactionality, isolation, repair fan-out, user comprehension, or portable import behavior.

## Verdict

`PASS_WITH_WATCHPOINTS`

No current G24.A Living Brain Integrity defect remains. Read as the exact R4 amendment over inherited R3 and R1, the candidate keeps memory canonical, versioned, inspectable, portable, and correctable. A copied label, model proposal, selector receipt, lifecycle receipt, or Release projection cannot acquire semantic standing by itself. I found no written route for private reasoning to cross cases and no route for close state to masquerade as portable Release authority.

The unresolved risks are implementation and empirical proof obligations already assigned to later gates. They do not require a new product-defining semantic choice at G24.A.

## Strongest part attacked

I attacked the claim that adding `epistemic_policy_version_ref` and `independent_challenger_result_version_ref` preserves one canonical Brain rather than creating a shadow standing ledger.

The hostile path was: a model copies `capable`, `sufficient`, `causal`, and `applicable` labels onto a derivative; two syndicated sources imitate independent corroboration; a similar Brain item comes from another case with private reasoning attached; a stale or mismatched challenger result is supplied; policy changes after selection; then an engagement-close receipt is presented as permission to export the result.

That path is closed in the written architecture:

- R3 requires every decision-shaping derivative to resolve to current canonical R1 references and says copied labels cannot claim their authority (`g24-product-system-blueprint-r3.md:55-88`; contract JSON pointers `/object_map` and `/inherited_integrity`).
- Same-root derivatives collapse for independence, model-authored outputs cannot upgrade standing, and private reasoning cannot travel with a reused public reference (`g24-product-system-blueprint-r3.md:71-88`; `/inherited_integrity/derivative_sources_collapse_to_root_when_independence_required`, `/inherited_integrity/derivative_can_award_standing`, and `/inherited_integrity/private_reasoning_cross_case_reuse`).
- R4 makes the two refs current, exact-version controls and reserves selector eligibility to trusted evaluation over current canonical references. A model may propose but has no selector standing (`g24-product-system-blueprint-r4.md:30-53`; `/epistemic_eligibility_binding`).
- A missing, stale, invalid, mismatched, inapplicable, or indeterminate control can produce only `abstain_hold`; provisional detail is receipt metadata with no Brain effect (`g24-product-system-blueprint-r4.md:113-136`; `/selector_policy_replacement`).
- The exact engagement graph terminates in `closed`, while R1 Release remains a separate canonical object requiring its own current human authority and exact projection binding (`g24-product-system-blueprint-r4.md:55-111`; `/lifecycle_policy_replacement` and `/release_non_inference`).

The strongest claim therefore holds under the frozen semantics. Proving that code cannot counterfeit those references remains a later-gate obligation.

## Criterion finding

### Living Brain Integrity: `holds`

**Rule:** Memory remains canonical, versioned, inspectable, portable, and correctable. An amendment, derivative, lifecycle receipt, or model proposal cannot create shadow truth, erase history, reuse private reasoning across cases, or award itself standing.

**Canonical and versioned.** R1 defines one seven-concept kernel, separates canonical live state and raw bytes from disposable projections and portable releases, and forbids GitHub edits from flowing back as truth (`g24-product-system-blueprint.md:175-227`; contract pointers `/memory_scopes`, `/canonical_kernel`, and `/runtime_layers`). R3 maps every R2 addition to an existing R1 owner and marks every map entry `new_canonical_root: false` (`g24-product-system-blueprint-r3.md:37-53`; `/object_map`). R4 changes only three declared seams, inherits all other R3 rules, and explicitly creates no new root (`g24-product-system-blueprint-r4.md:20-28`; `/normative_precedence`).

**Standing cannot self-promote.** R1 separates maturity, standing, audience, and consequence permission and denies memory authority to model instances (`g24-product-system-blueprint.md:175-214`). R3 makes effective standing derive only from current R1 references and forbids derivative promotion (`g24-product-system-blueprint-r3.md:55-88`; `/inherited_integrity/effective_state_from_canonical_references_only` and `/inherited_integrity/derivative_can_award_standing`). R4 adds the missing policy and challenger version bindings, trusted evaluation exclusivity, output watermarks, and invalidation on either version change (`g24-product-system-blueprint-r4.md:30-53`; `/epistemic_eligibility_binding/required_current_references`, `/epistemic_eligibility_binding/policy_owned_outcomes`, and `/epistemic_eligibility_binding/invalidation_triggers`).

**Provenance and private-scope separation survive.** R1 requires immutable source identity, content hash, subject, ownership, audience, purpose, consent, retention, source spans, and full derivative lineage (`g24-product-system-blueprint.md:141-171`). R3 adds root-provenance collapse, use-specific recomputation in each authorised case, immutable-reference-only public reuse, and an explicit ban on private reasoning crossing with that reference (`g24-product-system-blueprint-r3.md:55-88`; `/inherited_integrity`). R4's challenger is bound to the exact decision requirement, coverage version, trusted cutoff, and policy version, while all R3 subject and audience guards remain inherited (`g24-product-system-blueprint-r4.md:34-51`; `/epistemic_eligibility_binding/challenger_binding`).

**History and repair survive.** R1 makes state changes append-only with input watermarks and before/after refs, preserves prior interpretations during correction, quarantines affected projections, traverses downstream dependencies, and makes corrected releases successors rather than overwrites (`g24-product-system-blueprint.md:248`, `353-364`; contract pointers `/canonical_kernel` and `/model_tasks`). R3 carries controlling refs and invalidation across coverage, plans, questions, sessions, capsules, and unsent delivery projections (`g24-product-system-blueprint-r3.md:86`, `125-143`, `212`; `/inherited_integrity/invalidation_triggers` and `/lifecycle_policy/permission_change_invalidates_unsent_derivatives_before_use`). R4 adds policy and challenger versions to the selector's watermarks and invalidation set and requires append-only, version-matched lifecycle receipts (`g24-product-system-blueprint-r4.md:51`, `68-99`; `/epistemic_eligibility_binding/invalidation_triggers` and `/lifecycle_policy_replacement/transition_envelope`). The R4 delta also preserves rejected R3 as history (`g24-product-system-r4-delta.json`, pointers `/preserves_r3_as_history` and `/r3_frozen_hashes`).

**Lifecycle cannot rewrite memory or manufacture Release.** The exhaustive graph has `closed`, not `released`, as the lifecycle terminal. Preparation close invalidates prepared and unsent derivatives; closed state permits no operational or decision-shaping use; reopening creates a new period and revives no grant (`g24-product-system-blueprint-r4.md:55-103`; `/lifecycle_policy_replacement`). Release remains the existing R1 canonical object, can be absent at close, cannot close an engagement, and requires separate current leader authority plus exact projection, purpose, audience, source-version, and Brain-version bindings (`g24-product-system-blueprint-r4.md:105-111`; `/release_non_inference`). A lifecycle or close receipt therefore has historical/event standing only, not Brain or Release standing.

**Inspectable and portable.** R1 requires source-backed, inspectable Portrait and Map projections from the same accepted state, a readable and machine-usable release, deterministic bytes, and clean-room imports; GitHub/ZIP is a projection, not the hot database (`g24-product-system-blueprint.md:187-227`, `386-395`, `547-570`; contract pointers `/surfaces/5`, `/surfaces/7`, and `/first_vertical_slice/includes`). R4's exact-version Release binding and pending-projection invalidation preserve that boundary (`g24-product-system-blueprint-r4.md:105-111`; `/release_non_inference`). Hiding internal policy identifiers and lifecycle labels from the primary customer surface does not remove operator inspection, deeper evidence/history, or the portable manifest; it preserves the accepted customer-simplicity boundary.

## Current-gate defects

None identified for Living Brain Integrity.

No veto is issued, so failure path, smallest sufficient repair, and identical resolving test are not applicable.

## Later-gate watchpoints

1. **Reference integrity and anti-counterfeit proof at G24.B/C.** The physical schema and trusted validator must reject cross-workspace, cross-subject, wrong-coverage, stale, future-dated, missing, and policy-mismatched refs. Run a fixture in which copied semantic labels and a high-confidence model route are the only changes; the result must remain `abstain_hold`, with no canonical write.

2. **Private cross-case leakage at G24.B/C.** Reuse one immutable public assertion in two authorised cases while attaching private reasoning only to case A. Case B must recompute audience, applicability, sufficiency, contradiction, and standing without retrieving or serialising A's private reasoning, even when labels and semantic similarity collide.

3. **Common-root and challenger quality at G24.C.** Two syndicated copies must count as one provenance root. Exercise `countercase_found`, adequately bounded `none_found_within_declared_boundary`, and `indeterminate`; an empty or irrelevant search boundary must not earn reuse merely because the result field is syntactically valid.

4. **Atomic invalidation and repair at G24.B/C/E.** Change only the policy version, then only the challenger-result version, while a selector result, approved unsent intervention, Current Portrait/Living Map projection, context capsule, and pending Release projection exist. Every dependent object must be rejected or quarantined before use, rebuilt from canonical refs where allowed, and linked to an append-only repair/invalidation receipt. In particular, the implementation must prove that the inherited dependency graph carries challenger changes into any pending portable projection that contains challenger-dependent evaluation; the machine overlay's Release trigger list must not be implemented as a narrower escape hatch.

5. **Lifecycle and Release execution at G24.B/E.** Exercise all 13 edges with matching and stale versions, duplicate idempotency keys with same and different content, abandoned preparation, close with no Release, a separately authorised Release, and `closed -> preparing`. No old grant, prepared derivative, close receipt, or prior Release may become current authority in the new period.

6. **Correction, erasure, and portable history at G24.E and the named delivery/data gate.** Verify that a correction preserves the prior version, quarantines current affected projections, issues a successor release rather than mutating published bytes, and imports deterministically into two clean environments. Separately test retention expiry, erasure traversal, residue disclosure, and non-recall limits; those are explicitly deferred and are not proven by this architecture pass.

7. **Projection equivalence.** Feed the Portrait, Living Map, Claude/context package, operator view, and release compiler from the same canonical version set. Hash and reference comparisons must fail if any projection silently substitutes a newer, older, or differently scoped item.

These are proof obligations, not unresolved semantic choices. A failure at those gates would fail implementation or evidence; it does not alter this G24.A finding.

## Closed-action confirmation

All external actions remain closed. R4 retains the R3 closures for production writes, customer data, account creation, external research, model spend, email, customer contact, session scheduling or capture, connector creation, database branching, deployment, merge, feature enablement, Release, and legacy-backend deletion (`g24-product-system-contract-r4.json`, `/authority/closed`). The delta records `/external_actions_opened` as `[]`.

This review performed no external action and does not open the headless Crossing, customer-facing design, or any later gate. Council adjudication and founder lock remain separate decisions.
