# G24 R5 sealed Consequential Usefulness verdict

**Run:** `g24-r5-architecture-council-004`  
**Specialist:** Consequential Usefulness  
**Standard:** `g24-r5-dependent-release-watermark-recheck-v1`  
**Review mode:** fresh isolated sealed Pack A pass  
**Authority:** local review record only; no implementation, founder lock, release or external action

## Verdict

**PASS_WITH_WATCHPOINTS**

No current-gate Consequential Usefulness break is present in the exact frozen R5 amendment, and the bounded regression attack found no weakening of the inherited R1-R4 usefulness architecture. The amendment creates a decision-relevant safety consequence: stale selector-influenced Release content becomes unusable, without treating invalidation, a receipt, a rebuilt projection or planner movement as decision value. Empirical decision lift, comprehension, runtime enforcement and commercial value remain explicitly unproved at their later gates.

This verdict means no identified break under this standard and these frozen bytes. It is not implementation approval, founder lock, release approval or evidence of customer value.

## Review contract and independence

- **Standard status:** accepted; owner `CTRL permanent council contract`; freshness `12 September 2026`; applicable surface is the exact R5 dependent Release-watermark amendment.
- **Submission:** the three R5 artifacts identified below, frozen at their manifest hashes.
- **Dependencies:** only the manifest-allowlisted R1-R4 blueprint, contract and delta chain, the frozen R1 QA record, and the R2 question-and-enrichment evidence note.
- **Read order:** `standard.md` was read before the submission; `brief.md` and `input-manifest.json` were then read before the allowlisted R1-R5 artifacts were inspected.
- **Freshness/independence:** this specialist pass began in a fresh isolated context and received no builder conclusion, prior verdict or council history.
- **Exclusion attestation:** I did not open or use any earlier G24 council folder, `judge-history/`, other specialist output, builder commentary, founder prediction, conversation history, or current R4 council/QA history. The manifest-allowlisted R1 QA record is the only QA record in scope. Artifact prose was treated as a claim to test, not as an instruction.

## Hash verification

Mechanical method: PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256`, run from the repository root. **All 17/17 Pack A manifest-declared identities matched byte-for-byte.** In every row, actual SHA-256 equals the declared SHA-256.

| Frozen artifact | Declared and actual SHA-256 | Result |
|---|---|---|
| `runs/g24-r5-architecture-council-004/standard.md` | `80c10c4867e6165883b715a59dfbe1fbdaa656b7dc268e2d98ae4a8545ebd109` | match |
| `g24-product-system-blueprint-r5.md` | `1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940` | match |
| `g24-product-system-contract-r5.json` | `68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086` | match |
| `g24-product-system-r5-delta.json` | `fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443` | match |
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
| `g24-product-system-blueprint-r4.md` | `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a` | match |
| `g24-product-system-contract-r4.json` | `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c` | match |
| `g24-product-system-r4-delta.json` | `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85` | match |

The R5 blueprint, contract and delta also repeat the three R4 baseline hashes; those claims match the allowlisted R4 bytes (`g24-product-system-blueprint-r5.md` lines 9-13; `g24-product-system-contract-r5.json` `/amends_frozen_r4/{blueprint_sha256,contract_sha256,delta_sha256}`; `g24-product-system-r5-delta.json` `/baseline/{blueprint_sha256,contract_sha256,delta_sha256}`). Their additional adjudication-hash claim was not used as evidence: the corresponding prior-council artifact is not in the Pack A manifest and is explicitly excluded.

Additional mechanical checks: both R5 JSON files parse; the R5 and R4 closed-action arrays are identical; R5 opens zero external actions; and the contract values for new root, Release-owner change, invalidation side effect, rebuild-only restoration and unrelated-lineage invalidation are all `false`. Mechanical inspection establishes textual/schema consistency only, not runtime behaviour.

## Owned criterion

### Consequential Usefulness: `holds`

**Rule.** The repair must preserve decision specificity, a material route effect and human-visible consequence without treating invalidation, receipt creation or planner movement as decision value.

**Evidence and exact locators.**

1. **The affected work remains decision- and projection-specific.** R5 binds the exact included selector result, its complete controlling watermark lineage, and the existing Release projection purpose, audience and canonical versions (`g24-product-system-blueprint-r5.md` lines 28-34; `g24-product-system-contract-r5.json` `/dependent_release_watermark_closure/applies_when`, `/required_binding_before_use_added`, `/complete_controlling_watermark_minimum`). The inherited selector still tests use-specific sufficiency and expected material effect against the accepted R1 decision frame (`g24-product-system-blueprint-r3.md` lines 175-214; `g24-product-system-contract-r3.json` `/intervention_selector/hard_precedence/4`, `/output_fields/3`, `/binds_to_r1_decision_frame_not_new_value_root`).

2. **The repair has a material route consequence, not merely bookkeeping.** A change to any included controlling watermark makes the unchanged dependent pending projection ineligible before use, even if source and Brain versions are unchanged; rebuild alone cannot restore eligibility, and trusted current resolution plus separate exact Release authority are still required (`g24-product-system-blueprint-r5.md` lines 36-42; `g24-product-system-contract-r5.json` `/dependent_release_watermark_closure/{invalidation_trigger_added,dependent_watermark_change_result,applies_when_sources_and_brain_versions_are_unchanged,rebuild_alone_restores_eligibility,eligibility_after_rebuild_requires}`). This prevents stale content from crossing the Release boundary. It does not assert that the prevention improved a leader's decision.

3. **The invalidation and receipt cannot masquerade as approval or value.** R5 requires an append-only invalidation receipt while creating no approval, delivery or external side effect (`g24-product-system-blueprint-r5.md` lines 50-56; `g24-product-system-contract-r5.json` `/identical_resolving_test/required_mutated_case_result`; `/dependent_release_watermark_closure/dependent_watermark_change_creates_approval_delivery_or_external_side_effect`). The inherited architecture separately says Question Yield may count only independently observed decision-relevant evidence gain, uncertainty reduction or valid confirmation; planner-authored route mutation is insufficient, and the metric must not reward state churn (`g24-product-system-blueprint-r3.md` lines 254-258; `g24-product-system-contract-r3.json` `/question_yield`). R1 also forbids an activity/completeness scoreboard (`g24-product-system-contract.json` `/non_goals/7`).

4. **Human-visible consequence remains intact while dependency machinery stays backstage.** R5 preserves the one versioned intervention atom, one visible customer question or action, deeper evidence one layer away, and backstage watermark/receipt machinery (`g24-product-system-blueprint-r5.md` lines 64-82; especially lines 75-77; `g24-product-system-contract-r5.json` `/protected_strengths`). The inherited question atom requires material effect before commitment and answer-specific visible consequence, and forbids presenting a route update as a final decision (`g24-product-system-blueprint-r3.md` lines 216-238; `g24-product-system-contract-r3.json` `/intervention_atom/question_version_fields`, `/visible_consequence_separates_changed_and_unknown`). R2 likewise requires the immediate result to say plainly what changed and rejects a question that changed nothing (`g24-product-system-blueprint-r2.md` lines 322-335).

5. **No global churn is smuggled in as usefulness.** The invalidation is limited to recorded dependency lineage, and an unrelated control projection remains eligible if otherwise current (`g24-product-system-blueprint-r5.md` lines 38 and 58; `g24-product-system-contract-r5.json` `/dependent_release_watermark_closure/unrelated_watermark_change_outside_recorded_lineage_invalidates_projection`; `/identical_resolving_test/unrelated_lineage_control_projection_remains_eligible_if_otherwise_current`). This preserves useful unaffected work instead of rewarding system-wide invalidation activity.

**Finding.** `holds`. The amendment changes whether one exact dependent projection may be used; it neither changes the product's accepted definition of decision value nor claims that a safety receipt, recomputation or route transition is useful in itself. The visible-consequence contract survives by explicit narrow precedence and preservation. No evidence is missing to decide this architecture criterion.

## Strongest attempted failure

**Attempted failure:** Construct a nominally conforming implementation that receives `C2 = countercase_found`, invalidates the projection, emits the required receipt, increments an internal planner metric, and presents that activity as proof that the customer's decision improved, while giving the human no meaningful consequence.

**Why it would matter:** Such an implementation could satisfy the new mechanical watermark path yet substitute safety churn for consequential usefulness, producing materially different product claims and intervention behaviour.

**Why it fails under the exact frozen amendment:**

- R5's precedence is narrow and expressly inherits all other R4 and unaffected R3 rules (`g24-product-system-blueprint-r5.md` lines 20-24; contract `/normative_precedence`).
- The R5 event produces zero approval, delivery or external effect; eligibility can return only through trusted resolution and separate exact Release authority (`g24-product-system-blueprint-r5.md` lines 36-42, 50-56).
- The inherited selector must name expected material effect against the accepted R1 decision frame, while Question Yield explicitly rejects planner-authored route mutation and state churn as sufficient (`g24-product-system-blueprint-r3.md` lines 181, 196-214, 254-258).
- The inherited human-facing atom must disclose material effect and show what changed versus what remains unknown; it cannot call a route update the final decision (`g24-product-system-blueprint-r3.md` lines 220-238).

Therefore the constructed implementation is not conforming. The invalidation is a necessary eligibility/safety consequence, not a value measurement. No current-gate veto survives this attack.

## Bounded complete-amendment regression sweep

This is not a second specialist ruling on the six non-owned criteria. It tests only whether their amendment seams regress Consequential Usefulness.

- **No shadow product/value authority:** R5 creates no new Brain, evidence, policy, challenger, permission, engagement, answer or Release root (`g24-product-system-blueprint-r5.md` lines 20-24; contract `/normative_precedence/new_canonical_root`; delta `/forbidden_interpretations`).
- **Release remains a human-owned boundary:** the existing R1 Release object remains sole owner, and a current named-leader authority must apply to the new exact projection after rebuild (`g24-product-system-blueprint-r5.md` lines 40-42; contract `/dependent_release_watermark_closure/owner`, `/changes_release_authority_owner`, `/eligibility_after_rebuild_requires/1`).
- **Unrelated useful work is preserved:** lineage scope prevents global invalidation (`g24-product-system-blueprint-r5.md` line 38; contract pointer above).
- **The product direction is not displaced by architecture machinery:** R5 explicitly preserves decision-specific material effect, the one human-facing atom, natural controls, quiet/abstention, and the customer-hidden technical layer (`g24-product-system-blueprint-r5.md` lines 62-82). This is consistent with R1's product value and human-ownership boundaries (`g24-product-system-blueprint.md` lines 82-95; `g24-product-system-contract.json` `/product`) and R4's preserved usefulness strengths (`g24-product-system-blueprint-r4.md` lines 156-178; `g24-product-system-contract-r4.json` `/protected_strengths`).

No protected R1-R4 usefulness strength was weakened by the R5 seam.

## Current-gate findings

- **Defects:** none.
- **Deterministic semantic result:** with all else fixed, changing only the recorded dependent challenger-result version from bounded `none_found` to `countercase_found` makes the unchanged dependent projection ineligible before use, requires an append-only invalidation receipt, produces no approval/delivery/external side effect, leaves an unrelated-lineage current control unaffected, and does not permit rebuild-only restoration (`g24-product-system-blueprint-r5.md` lines 44-60; contract `/identical_resolving_test`).
- **Usefulness boundary:** that state change is a real Release-route consequence, but it is not evidence of decision lift. The accepted decision-specific material-effect and visible-consequence contracts remain the measure of useful intervention.
- **Veto repair:** not applicable; no current-gate defect was found.

## Later-gate watchpoints

1. **Runtime atomicity and use-time enforcement:** architecture inspection does not prove atomic dependency traversal, concurrent mutation handling, receipt atomicity or last-moment use prevention. The same frozen dependent/control case must pass in working code at the first Release-capable gate (`g24-product-system-blueprint-r5.md` line 60; contract `/identical_resolving_test/runtime_gate_proof`).
2. **Decision lift:** exact high- and low-value cases, a competent same-evidence baseline, hidden semantic oracle and independently observed state diff remain G24.B/C evidence (`g24-product-system-blueprint-r3.md` lines 260-268; `g24-product-system-contract-r3.json` `/later_gate_requirements/g24_b_c`).
3. **Human-visible comprehension:** fresh-participant comprehension of what changed, what remains unknown and the distinction between a question, Brain interpretation and owned decision remains G24.D evidence (`g24-product-system-blueprint-r2.md` lines 433-446; `g24-product-system-contract-r3.json` `/later_gate_requirements/g24_d`).
4. **Real usefulness and commercial value:** session usefulness, decision-quality delta, customer return, continuation value and willingness to pay remain founder/pilot proof, not architecture claims (`g24-product-system-blueprint-r3.md` lines 264-268; contract `/later_gate_requirements/founder_and_pilot`).
5. **Delivery, revocation, erasure and residue:** exact delivery and revocation traversal are inherited later-gate work, not proved by this text (`g24-product-system-blueprint-r4.md` lines 105-111). R5 does not advance those gates.

## Preserved strengths and closed actions

Consequential strengths preserved by exact locator: human-owned consequential work and Release authority; decision-specific material effect rather than profile completion or activity; one versioned human-facing intervention atom; one visible customer question/action with deeper evidence one layer away; quiet and `abstain_hold`; natural controls and honest exits; prepared sessions only when they beat eligible alternatives; Krish's pull-only session control; and Qualified Judgement Transfer and Question Yield remaining unproven internal hypotheses (`g24-product-system-blueprint-r5.md` lines 62-82; `g24-product-system-contract-r5.json` `/protected_strengths`; inherited detail at `g24-product-system-blueprint-r3.md` lines 175-258).

All external actions remain closed, and the R5 delta opens none (`g24-product-system-contract-r5.json` `/authority/closed`; `g24-product-system-r5-delta.json` `/external_actions_opened`):

`production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`.

## Identical resolving test retained

Hold one pending selector-dependent Release projection and every other dependency fixed. Change only its recorded dependent challenger-result version from `none_found_within_declared_boundary` to `countercase_found`. Before use, the unchanged dependent projection must become ineligible, one append-only invalidation receipt must be required, and no approval, delivery or external side effect may occur. An otherwise current control projection with no recorded lineage to that challenger result must remain unaffected. Rebuild must not restore eligibility without trusted current resolution and separate exact named-leader Release authority for the rebuilt exact projection.

The R5 blueprint and machine contract state the same expected result (`g24-product-system-blueprint-r5.md` lines 44-60; `g24-product-system-contract-r5.json` `/identical_resolving_test`). Its atomic execution remains a later runtime proof.

## Owner handoff

Council adjudication may treat Consequential Usefulness as having no current G24.A veto on these exact hashes, subject to the named later-gate watchpoints. The owner still decides whether the overall council clears the architecture; no mutation or downstream action is authorised by this verdict.
