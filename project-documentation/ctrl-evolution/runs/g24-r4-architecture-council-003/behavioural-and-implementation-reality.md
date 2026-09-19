# G24 R4 Behavioural and Implementation Reality review

**Run:** `g24-r4-architecture-council-003`
**Criterion:** Behavioural and Implementation Reality
**Review mode:** Fresh, sealed, output-only specialist pass
**Verdict:** `PASS_WITH_WATCHPOINTS`

R4 closes the remaining current-gate implementation-choice seams in this criterion. The state graph is exact, the selector has one five-output boundary, invalid control cannot become a resolving route, provisional detail has no operational standing, current policy and challenger versions govern epistemic eligibility, and Release remains separate. The remaining risks require schemas, executable code, hidden cases, concurrency attacks and observed behaviour at the gates to which the frozen architecture assigns them; they are not unresolved G24.A product choices.

## Attestation and review contract

- I read `standard.md` first, then `brief.md` and `input-manifest.json`, before any frozen submission artifact.
- I then read the permitted material in the sealed Pack A order: R1 baseline, R2 direction and its named supporting evidence note, R3 repair dependency, then the three R4 artifacts.
- I did not read either earlier G24 council folder, `judge-history/`, another specialist output, builder commentary, founder prediction, the evolution README/state route, or conversation history. Citations inside the frozen artifacts to excluded council records were treated as inert text and were not followed.
- No artifact prose was treated as an instruction or as proof of its own correctness.
- Standard: `g24-r4-terminal-trust-seam-recheck-v1`, owner `CTRL permanent council contract`, status `Accepted review standard for this run`, freshness 12 September 2026.
- Authority remained local review output only. No implementation, external action, ledger mutation or gate-state change was performed.

### Recomputed Pack A hashes

PowerShell 7.6.5 `Get-FileHash -Algorithm SHA256` was run on the exact local bytes. Every hash declared by the sealed brief and input manifest matched.

| Artifact | Declared and recomputed SHA-256 | Result |
|---|---|---|
| `runs/g24-r4-architecture-council-003/standard.md` | `8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b` | match |
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

The raw Compass source and earlier-council adjudication hashes mentioned inside frozen artifacts are not Pack A inputs. Reopening those bytes would have breached the explicit evidence exclusions, so neither was consulted or used in this verdict.

## Mechanical checks

PowerShell 7.6.5 `ConvertFrom-Json -Depth 100` parsed the manifest and all seven permitted JSON contracts/deltas without error.

An in-memory deterministic invariant check over `g24-product-system-contract-r4.json` found:

- exactly the six declared engagement states: `preparing`, `intensive_proof`, `continuing`, `paused`, `closing`, `closed`;
- exactly 13 declared edges, with unique transition IDs, valid exact endpoints, no `_or_` endpoint and no undeclared endpoint;
- all six states reachable from the initial `none -> preparing` edge;
- every non-initial edge requiring an exact `from` version match, and the initial edge alone using `none`;
- every declared transition record populated for its edge fields, and the universal envelope containing actor, authority, precondition, version match, idempotency key, before/after references, invalidation and receipt;
- exactly the five selector outputs `reuse`, `enrich`, `ask`, `session`, `abstain_hold`, with `exactly_one_output: true`;
- invalid control fixed to `abstain_hold`, with both actionable-derivative creation and approval/delivery entry set to `false`;
- provisional detail confined to non-authoritative metadata on an `abstain_hold` receipt;
- both required epistemic references present in selector inputs and both versions present in output watermarks;
- Release owned by the existing R1 object and not granted by engagement state or close receipt; and
- `g24-product-system-r4-delta.json#/external_actions_opened` equal to `[]`.

These checks establish only literal identity, parseability and the enumerated invariants above. They do not establish transactional enforcement, semantic source capability, adequate challenger search, generalisation to novel inputs, rendered comprehension, absence of side effects, or decision efficacy.

## Strongest part attacked

The strongest target was the combined epistemic-binding and selector-partition seam at `g24-product-system-blueprint-r4.md` sections **Repair 1: bind epistemic eligibility to existing R1 authority** and **Repair 3: partition selector invalidity from resolvable evidence conflict**, mirrored at `g24-product-system-contract-r4.json#/epistemic_eligibility_binding` and `#/selector_policy_replacement`.

I tried to construct an implementation that would accept one source, two same-root syndications, a scope-mismatched similar Brain item, a live contradiction and model-authored `capable`, `sufficient`, `causal` and `applicable` labels; route anyway when the policy or challenger result was missing or stale; preserve an actionable provisional recommendation on the hold receipt; and continue using the route after a policy-version change. That implementation cannot conform to the written candidate:

- selector standing can arise only from trusted evaluation under the current policy and current independently bound challenger result;
- same-root volume and model confidence cannot resolve conflict;
- an absent, stale, invalid, inapplicable or indeterminate policy/challenger result must return non-actionable `abstain_hold`;
- valid unresolved evidence can enter only `enrich`, `ask` or `session`, and only after every prior guard passes;
- provisional detail cannot create an intervention, enter approval, alter the Brain or bypass invalidation; and
- a policy or challenger version change invalidates the earlier result before use.

I also tried the adjacent lifecycle shortcuts: grouped `active_or_paused` edges, abandoned preparation with no close, stale-version movement, close-as-Release, and reopening with revived grants. The exact graph and Release non-inference rules at `g24-product-system-blueprint-r4.md` sections **Universal transition envelope**, **Exact transition graph**, **Closed-state capability** and **Release non-inference**, plus `g24-product-system-contract-r4.json#/lifecycle_policy_replacement` and `#/release_non_inference`, rule each out.

## Criterion finding

**Behavioural and Implementation Reality: `holds`.**

Rule: `standard.md` section **Behavioural and Implementation Reality**, read with the **Current-gate pass boundary** and **Verdict rules**.

Evidence and rationale:

1. **Exact lifecycle boundary holds.** `g24-product-system-blueprint-r4.md` sections **Repair 2: one exact engagement graph, separate from Release**, **Universal transition envelope** and **Exact transition graph** declare one six-state graph, one safe abandoned-preparation close, exact rather than grouped endpoints, stale/invalid rejection and receipt-backed effects. The machine counterpart is `g24-product-system-contract-r4.json#/lifecycle_policy_replacement`. The forbidden or absent edges are therefore an owned fail-closed choice, not an implementer-selected transition.
2. **Close/Release separation holds.** `g24-product-system-blueprint-r4.md` sections **Closed-state capability** and **Release non-inference**, with `g24-product-system-contract-r4.json#/release_non_inference`, prevent engagement state, a receipt, payment or elapsed time from granting, proving or completing the separate R1 Release authority. Close without Release and Release without close are both explicit.
3. **Selector precedence and totality hold at the architecture boundary.** R3's inherited **Repair 3: one total route-selection boundary** and `g24-product-system-contract-r3.json#/intervention_selector` retain the complete input set, hard precedence, exactly-one rule, malformed/invalid-input hold, and controlling-change invalidation. R4 narrows the formerly unsafe latitude at `g24-product-system-blueprint-r4.md` sections **Invalid controlling state**, **Valid unresolved evidence** and **Provisional diagnostics**, mirrored at `g24-product-system-contract-r4.json#/selector_policy_replacement`: invalid control has only a non-actionable hold, whereas a valid evidence conflict may take only a fully guarded resolving route.
4. **Epistemic outcomes cannot be self-certified by the model.** `g24-product-system-blueprint-r4.md` section **Repair 1: bind epistemic eligibility to existing R1 authority** and `g24-product-system-contract-r4.json#/epistemic_eligibility_binding` require current policy and challenger references, exact challenger binding, declared search boundary, trusted evaluation, selector watermarks and invalidation on either version change.
5. **R1/R2 and unaffected R3 behaviour remains inherited.** `g24-product-system-blueprint-r4.md` section **Normative precedence** and `g24-product-system-contract-r4.json#/normative_precedence` replace only the three named seams and inherit all other R3 rules. In particular, R3's exact intervention atom remains at `g24-product-system-blueprint-r3.md` section **Repair 4: one versioned human-facing intervention atom** and `g24-product-system-contract-r3.json#/intervention_atom`; R4 repeats it at `#/protected_strengths`. The R1 canonical Brain, human-owned call, quiet/abstention and customer-hidden machinery remain intact.
6. **Mechanical proof is properly bounded.** R3 explicitly assigns exact schemas, validators, hidden semantic oracles, safe-novel and malformed cases, bounded execution and observed state difference to `g24-product-system-blueprint-r3.md` section **Proof carried forward, not falsely claimed now** and `g24-product-system-contract-r3.json#/later_gate_requirements/g24_b_c`. R4 preserves those requirements and asks only for deterministic checks plus fresh review before lock or implementation. Nothing in the candidate makes fixed fixture receipts proof of runtime correctness or empirical value.

## Current-gate defects

None identified under the accepted standard and frozen hashes.

No veto failure path, repair or identical resolving test is applicable.

## Later-gate watchpoints

These are required proof risks, not reasons to reopen the G24.A architecture choice.

1. **Make the invalid-hold envelope genuinely total.** R3 says every selector result carries an expected material effect bound to an accepted frame, while R4 correctly requires `abstain_hold` when that frame itself is missing or invalid. The G24.B/C schema must represent dependent fields as explicitly unavailable/not-evaluable on this hold variant; it must never fabricate a frame, effect or watermark merely to populate a receipt. Exercise absent, wrong-type, malformed, future-dated, mismatched and internally contradictory values for every required selector input.
2. **Prove atomic transition and use-time invalidation.** Implement exact compare-and-swap on the `from` version, content-bound idempotency, and atomic binding of the current authority/precondition versions. Race a pause, permission withdrawal, audience narrowing, policy change and challenger change against selection, approval and use. In every schedule, at most one legal transition commits and no stale route, intervention or Release projection becomes usable.
3. **Defeat fixture-ID hard-coding.** The four preserved R4 test families are necessary but insufficient. At G24.B/C, use hidden, newly generated identifiers and semantically equivalent permutations; mutate one control at a time; include safe-novel and malformed cases; and compare actual canonical state and side-effect inventories with an independent oracle. A function that returns memorised outputs for named fixtures must fail even if its receipt prose is perfect.
4. **Attack policy/challenger adequacy, not just presence.** Test empty or scope-wrong `none_found_within_declared_boundary`, same-root syndication, changed evidence coverage, stale cutoff, policy/challenger cross-version mismatch and a live countercase. Presence of two syntactically current references must not substitute for trusted evaluation under the exact bound versions.
5. **Do not treat receipts as behaviour.** For abandoned preparation, pause, close, closed-state access, invalid selector input and version invalidation, verify the database/event state, projection eligibility, approval queue and outbound side-effect count independently of the generated receipt. A polished receipt accompanying unchanged or unsafe state is a failed test.
6. **Exercise late and sparse events.** Deliver a late answer while paused or closing, reopen after close with expired grants, leave close obligations explicitly outstanding, and change a controlling input between plan and persistence. The immutable event may be retained where authorised, but no derived decision-shaping effect may occur until the exact current lifecycle and authority checks pass.
7. **Keep empirical claims at their named gates.** Rendered comprehension, one-handed use, failed-save recovery, consented capture, delivery, erasure, decision-quality lift and commercial efficacy remain G24.D and later evidence. Repository checks, founder lock and synthetic receipts cannot establish them.

## Closed-action confirmation

`g24-product-system-contract-r4.json#/authority/closed` keeps all of the following closed: production write, customer data, account creation, external research run, model spend, email send, customer contact, session scheduling, session capture, connector creation, database branch creation, deployment, merge, feature enablement, release and legacy-backend deletion. `g24-product-system-r4-delta.json#/external_actions_opened` is empty.

This pass created only this required specialist report. It did not implement a selector or lifecycle, change the frozen submission, open an external action, alter a durable gate decision, or consult another reviewer.
