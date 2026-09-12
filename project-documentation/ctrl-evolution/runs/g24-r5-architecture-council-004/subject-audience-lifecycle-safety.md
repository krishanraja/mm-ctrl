# G24 R5 sealed specialist verdict: Subject, Audience and Lifecycle Safety

**Run:** `g24-r5-architecture-council-004`

**Standard:** `g24-r5-dependent-release-watermark-recheck-v1`

**Review mode:** fresh, isolated, frozen Pack A semantic review

**Authority:** local review record only; no implementation, gate mutation or external action

**Verdict:** `PASS_WITH_WATCHPOINTS`

## Gate ruling

The R5 amendment has no current-gate break under the owned **Subject, Audience and Lifecycle Safety** criterion. It makes the exact included selector result and its complete controlling lineage part of pending Release eligibility; it invalidates the dependent projection before use when any included watermark changes; it confines that propagation to recorded lineage; and it prevents close, continuation or rebuild from becoming a substitute for current permission or exact Release authority.

The main ambiguity attack was the absence of a literal `permission_version` member from R5's machine-readable minimum watermark list. That does not create a conforming unsafe implementation at this architecture gate because the list is explicitly a minimum, R5 requires the complete controlling set, R5 inherits all other R4 and unaffected R3 rules, R3 already makes permission a controlling reference and invalidation trigger, and R4 already makes permission change invalidate a pending Release projection. This remains a high-consequence implementation watchpoint: the later compiler/schema and runtime tests must prove that permission is actually traversed and enforced rather than assuming that the word `authority` absorbs it.

No veto repair is required. The frozen identical resolving test remains the acceptance test for both deterministic architecture inspection now and atomic runtime proof later.

## Review contract and independence

- **Submission:**
  - `g24-product-system-blueprint-r5.md`, SHA-256 `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940`
  - `g24-product-system-contract-r5.json`, SHA-256 `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086`
  - `g24-product-system-r5-delta.json`, SHA-256 `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443`
- **Standard status:** accepted; owner `CTRL permanent council contract`; fresh 12 September 2026; hash valid.
- **Applicable criterion:** `Subject, Audience and Lifecycle Safety` from `standard.md` under `## Owned criteria`.
- **Review authority:** output-only to this specialist file. No source artifact was mutated and no product, customer, account, research, spend, message, connector, database, deployment, merge, feature, release or deletion action was taken.
- **Current-fact need:** none. This is a closed-pack architecture ruling; no external research was used.
- **Fresh-context attestation:** the accepted standard was read before any frozen submission artifact. The brief and manifest were then read, all declared hashes were checked, and only the R1-R5 artifacts allowlisted by `input-manifest.json` were inspected as needed.
- **Exclusion attestation:** I did not read any earlier G24 council folder, `judge-history/`, another specialist output, builder commentary, founder prediction, conversation history, or current R4 QA/council history. Artifact prose was treated as a claim to test, not as authority to change the review method.

## Mechanical verification

**Tool:** PowerShell `7.6.5` `Get-FileHash -Algorithm SHA256`, exact bytes at the manifest paths.

**Result:** all 17 declared hashes match. `brief.md` and `input-manifest.json` declare no self-hash, so no undeclared digest is represented as part of the frozen identity.

| Declared artifact | Expected SHA-256 | Actual | Result |
|---|---|---|---|
| `runs/g24-r5-architecture-council-004/standard.md` | `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109` | same | MATCH |
| `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` | same | MATCH |
| `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` | same | MATCH |
| `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` | same | MATCH |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | same | MATCH |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | same | MATCH |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | same | MATCH |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | same | MATCH |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | same | MATCH |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | same | MATCH |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | same | MATCH |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | same | MATCH |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | same | MATCH |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | same | MATCH |
| `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | same | MATCH |
| `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | same | MATCH |
| `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | same | MATCH |

Additional reproducible checks:

- PowerShell `ConvertFrom-Json` parsed all nine allowlisted JSON dependency/submission files without error. This proves JSON syntax only; no JSON Schema was supplied.
- The R5 contract and R5 delta each reproduce the three manifest-declared R4 baseline hashes exactly.
- `g24-product-system-r5-delta.json#/external_actions_opened` has count `0`.
- The R4 inherited lifecycle machine has six states and thirteen transitions; `g24-product-system-contract-r4.json#/lifecycle_policy_replacement/reopen_revives_expired_authority` is `false`.
- `g24-product-system-contract-r4.json#/release_non_inference/pending_projection_invalidation_triggers` includes `permission_change`.
- R5 machine values are deterministic on the reviewed bytes: `rebuild_alone_restores_eligibility=false`, `unrelated_watermark_change_outside_recorded_lineage_invalidates_projection=false`, `changes_release_authority_owner=false`, and `dependent_watermark_change_creates_approval_delivery_or_external_side_effect=false` at `g24-product-system-contract-r5.json#/dependent_release_watermark_closure`.

**Mechanical limitation:** parsing, counts, literal values and hashes do not prove semantic completeness, dependency traversal, atomicity or use-time behaviour. Those are addressed by the criterion judgment and later runtime proof.

## Owned criterion

### Subject, Audience and Lifecycle Safety: `holds`

**Rule:** dependency invalidation must preserve exact subject, audience, purpose, authority, permission and lifecycle boundaries. A close, continuation, rebuild or unrelated same-workspace change cannot widen scope or revive Release eligibility.

**Smallest controlling evidence and locators:**

1. **Complete dependent standing is bound before use.** `g24-product-system-blueprint-r5.md`, `## The one repair`, lines 28-35 requires the exact selector result, its complete controlling watermark set, and the existing projection's purpose, audience and canonical versions. Line 34 explicitly includes identity, subject, workspace, authority, audience, purpose and lifecycle, then policy, challenger, frame, evidence, cutoff and canonical versions. The machine equivalent is `g24-product-system-contract-r5.json#/dependent_release_watermark_closure/required_binding_before_use_added` and `/complete_controlling_watermark_minimum`.
2. **Every included change fails closed before use.** Blueprint lines 36-38 require invalidity before use, an append-only receipt, and lineage confinement even when source and Brain versions do not change. Machine locators: `/dependent_watermark_change_result`, `/dependent_watermark_change_receipt`, `/dependent_watermark_change_creates_approval_delivery_or_external_side_effect`, `/applies_when_sources_and_brain_versions_are_unchanged`, and `/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection`.
3. **Rebuild does not revive eligibility or widen scope.** Blueprint lines 40-42 require trusted current evaluation under the new complete set plus separate named-leader Release authority for the exact new projection, purpose, audience and canonical versions, while retaining the R1 Release object as sole owner. Machine locators: `/rebuild_alone_restores_eligibility`, `/eligibility_after_rebuild_requires`, and `/changes_release_authority_owner`.
4. **The amendment is narrow and preserves inherited controls.** Blueprint `## Normative precedence`, lines 22-24 and contract `#/normative_precedence` replace only dependent pending-Release watermark binding/invalidation, inherit every other R4 rule and every unaffected R3 rule, preserve R1/R2, and create no new root.
5. **Permission remains an inherited controlling boundary.** R3 blueprint `### The inherited-integrity rule`, lines 55-71 makes authority or permission version a controlling reference and requires all invalidating watermarks; lines 86-88 make a permission or audience change invalidate every affected unsent derivative. R3 `### Permission change before use`, lines 125-129 separates permission from correction and erasure and makes dependent unsent projections ineligible. The selector takes current authority, audience and permission state at lines 153-164 and any controlling input-version change invalidates its result at lines 196-212. Machine locators: `g24-product-system-contract-r3.json#/inherited_integrity/controlling_references`, `/invalidation_triggers`, `#/lifecycle_policy/permission_change_invalidates_unsent_derivatives_before_use`, and `#/intervention_selector`.
6. **Close and continuation do not confer Release or permission.** R4 blueprint `### Closed-state capability`, lines 101-103 permits no operational or decision-shaping use in `closed`; `### Release non-inference`, lines 105-111 says no engagement, close, elapsed or commercial state grants Release and includes permission and audience changes in pending-projection invalidation. `### Close and Release separation`, lines 148-150 says a close-only receipt creates no Release authority, audience narrowing or permission withdrawal invalidates before use, and no lifecycle state satisfies Release. The transition `closed -> preparing` at line 97 opens a new bounded preparation and never revives an old grant. Machine locators: `g24-product-system-contract-r4.json#/lifecycle_policy_replacement`, `#/release_non_inference`, and `#/selector_policy_replacement`.
7. **The original subject/audience ownership remains intact.** R1 blueprint `## Non-negotiable product boundaries`, lines 82-97 separates private, operator, company and personal context and requires provenance, audience and correction history; `### Universal source envelope`, lines 141-159 binds workspace, subject, actor, ownership, audience ceiling, purpose, consent and retention with full derivative lineage; `### Brain-item standing`, lines 201-214 keeps maturity, audience and consequence permission independent and traces every influenced release. R1 `## One product, three authorities`, lines 99-107 forbids the Brain from widening audience or releasing work. R2 blueprint lines 67-95 makes continuation explicit, keeps source permission/retention expiry and audience boundaries independent, and forbids continuation from renewing consent, widening audience or extending retention.

**Finding:** Taken as one amendment chain, those clauses determine one safety outcome. The pending dependent projection carries the exact subject/audience/purpose/authority/lifecycle lineage that made its selector result usable; permission remains a distinct inherited controlling reference and invalidation trigger; any included mutation makes the projection ineligible before use without approval or delivery; only the affected lineage is touched; and neither close, continuation nor rebuild supplies current Release authority. There is no credible pair of conforming implementations that can differ on whether an affected stale projection remains eligible.

## Strongest attempted failure

### Attack: omit permission from the R5 dependent watermark set, then rebuild under stale or withdrawn permission

**Failure construction attempted:** implement only the literal members of `g24-product-system-contract-r5.json#/dependent_release_watermark_closure/complete_controlling_watermark_minimum`. That array names `authority_version` but not `permission_version`. Hold source, Brain, subject, purpose, audience and lifecycle versions fixed; withdraw or expire the exact source/use permission that gave selector result `S1` standing; retain the old selector result in a pending Release projection; then rebuild and treat the named-leader Release action as enough to recover eligibility.

**Why the attack does not establish a current-gate break:**

- The attacked R5 field is expressly a **minimum**, while `/required_binding_before_use_added` requires the selector's **complete** controlling watermark set.
- Blueprint line 34 defines that complete set as every current reference whose change can invalidate the selector result, not only the examples written on that line.
- R5's precedence clause inherits all other R4 and unaffected R3 rules.
- R3 makes `authority_or_permission_version` a controlling reference, makes permission change an invalidation trigger and makes any controlling input-version change invalidate the selector result before use.
- R4 independently makes `permission_change` a pending Release projection invalidation trigger and says permission withdrawal before use invalidates eligibility.
- R5 rejects rebuild-only restoration and requires current trusted evaluation plus current exact Release authority for the new projection.

An implementation omitting permission from both dependency traversal and the inherited before-use invalidation is therefore non-conforming, not an alternative conforming interpretation.

**Watchpoint created:** the R5 compiler/schema should materialise permission as a separately testable dependent watermark even if an implementation also groups it under authority. The later fixture must mutate only permission while holding authority, audience, subject, purpose, lifecycle, source and Brain versions fixed; the affected projection must fail before use and an unrelated-lineage control must remain current. This watchpoint prevents a machine implementer from mistaking the illustrative minimum array for an exhaustive schema.

### Additional lifecycle attack: close or continuation as implicit Release renewal

The attack fails at R4 blueprint lines 97, 101-111 and 148-150, inherited by R5 lines 22-24. `closed -> preparing` begins a new bounded period and never revives an old grant; continuation requires revalidation; a close receipt supplies no Release authority; and R5 line 40 requires separate exact Release authority after any rebuild. No current-gate ambiguity remains.

## Current-gate findings

| Question | Result | Exact locator |
|---|---|---|
| Exact included selector result and full controlling lineage required before use | Holds | R5 blueprint lines 28-35; R5 contract `#/dependent_release_watermark_closure/required_binding_before_use_added` and `/complete_controlling_watermark_minimum` |
| Subject, audience, purpose, authority and lifecycle changes cannot leave the dependent projection eligible | Holds | R5 blueprint lines 34-36; R5 contract `/invalidation_trigger_added` and `/dependent_watermark_change_result` |
| Permission withdrawal/expiry cannot be bypassed | Holds through explicit inheritance | R3 blueprint lines 55-71, 86-88, 125-129, 153-164 and 196-212; R4 blueprint lines 109-111 and 148-150; R4 contract `#/release_non_inference/pending_projection_invalidation_triggers` |
| Close, continuation or rebuild cannot renew permission or Release eligibility | Holds | R2 blueprint lines 67-95; R4 blueprint lines 97, 101-111 and 148-150; R5 blueprint lines 40-42 |
| Unrelated same-workspace policy/challenger change cannot alter another projection merely by co-location | Holds | R5 blueprint line 38 and line 58; R5 contract `/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection` and `#/identical_resolving_test/unrelated_lineage_control_projection_remains_eligible_if_otherwise_current` |
| Invalidation itself creates approval, delivery or external effect | Holds as forbidden | R5 blueprint lines 50-54; R5 contract `/dependent_watermark_change_creates_approval_delivery_or_external_side_effect=false` |
| Release authority moves to lifecycle, selector, receipt or rebuild | Holds as forbidden | R5 blueprint lines 40-42; R5 contract `/changes_release_authority_owner=false`; R5 delta `#/forbidden_interpretations` |

**Current-gate defects:** none.

## Later-gate watchpoints, not current-gate defects

1. **Explicit permission materialisation.** At the schema/compiler gate, prove a distinct permission watermark or an exactly equivalent typed reference. The architecture already requires the semantic result; the physical field shape remains later.
2. **Atomic dependency traversal and use-time enforcement.** At the first Release-capable runtime gate, run the frozen dependent-challenger mutation and permission-only mutation under concurrency. Prove there is no time-of-check/time-of-use window in which the stale projection can be approved, delivered or externally used. R5 blueprint line 60 and contract `#/identical_resolving_test/runtime_gate_proof` reserve this proof for working code.
3. **Receipt/audience integrity.** Prove the append-only invalidation receipt itself follows the canonical subject, audience, sensitivity and retention controls and cannot expose content merely because the projection was invalidated. R1 source-envelope and audience rules govern this; storage and rendered visibility remain later implementation/experience proof.
4. **Revocation, erasure and residue.** Retention expiry, revocation/erasure traversal, delivery revalidation, export residue and non-recall behaviour remain at the first delivery/data capability and G24.H gates: R3 blueprint lines 260-271, especially line 269. R5 does not claim them now.
5. **Real-data audience enforcement and comprehension.** Participant/modality permission, withdrawal and real-data audience enforcement remain at the first consented capture/customer-data gate; customer comprehension and rendered interaction remain G24.D. The architecture keeps machinery backstage but does not prove the experience.
6. **No global over-invalidation.** The later dependency-graph suite must include same-workspace projections with disjoint challenger, policy and permission lineage. The control projection must remain eligible if otherwise current.

These watchpoints justify `PASS_WITH_WATCHPOINTS`; none supplies missing evidence needed to decide the present architecture semantics.

## Identical resolving test

Freeze one pending Release projection containing selector-influenced content and hold all dependencies fixed. Change only its recorded dependent independent-challenger result from `none_found_within_declared_boundary` to `countercase_found`.

The required result is identical at both proof layers:

1. the unchanged dependent pending projection is ineligible before use;
2. one append-only invalidation receipt is required;
3. no approval, delivery or external side effect occurs;
4. an otherwise-current control projection with no recorded lineage to that challenger result remains unaffected; and
5. a rebuilt dependent projection remains ineligible until trusted current resolution exists and a separate current named-leader Release authority applies to the new exact projection, purpose, audience and canonical-version set.

At G24.A, the frozen blueprint and machine contract state this deterministic result. At the later first Release-capable gate, the same frozen case must prove atomic traversal and use-time enforcement in working code. No alternate test or weakened outcome is proposed.

## Preserved strengths and closed actions

The owned safety review finds these inherited strengths preserved:

- one canonical Brain and one R1 Release owner;
- human-owned purpose, standards, exceptions, judgement, final call, quality and exact Release authority;
- subject, workspace, purpose, audience, permission, sensitivity, retention, evidence and canonical-version lineage;
- explicit continuation without permission renewal, audience widening or retention extension;
- the six-state, thirteen-edge engagement graph, with `closed` separate from Release;
- fail-closed selector behaviour and current policy/challenger binding;
- immutable history, correction and affected-lineage repair;
- operator/customer projection separation and backstage technical machinery; and
- later-gate empirical claims remaining unproven.

The following external actions remain explicitly closed at `g24-product-system-contract-r5.json#/authority/closed`: `production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`. `g24-product-system-r5-delta.json#/external_actions_opened` is the empty array.

## Advisory owner handoff

**Owner decision:** no identified break under the accepted standard and frozen hashes; retain the later proof obligations above. This verdict does not approve implementation, founder lock, production use, release or any external action.

**Recommended acceptance signal:** preserve these exact bytes for adjudication, and require the identical resolving test plus the permission-only companion mutation at the named later gates. No ledger write, source amendment or external mutation was authorised or performed.
