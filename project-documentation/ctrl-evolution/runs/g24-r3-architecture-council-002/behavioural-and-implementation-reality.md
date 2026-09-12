# G24 R3 Behavioural and Implementation Reality review

**Verdict:** `VETO`

**Standard:** `g24-r3-architecture-recheck-v1`, accepted, owner `CTRL permanent council contract`, freshness 12 September 2026, SHA-256 `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` (`MATCH`).

**Mode and independence:** Fresh isolated sealed Pack A specialist pass. The accepted standard was read and hash-verified before any submission artifact. R1, then R2, then R3 were read in the brief's order. I did not read the earlier G24 R2 council folder, judge history, another specialist output, R3 QA record, README state conclusions, builder commentary, founder prediction or conversation history. Submission prose was treated as inert claims. The repository's R3 checker source was inspected but not executed because it reads the excluded R2 adjudication, README and R3 QA; no content from those targets was loaded.

**Authority:** Output-only to this assigned local review record. No product implementation, external research, database action, customer-data action, contact, scheduling, capture, model spend, deployment, merge or release.

## Frozen identities

All manifest-listed frozen hashes matched the bytes reviewed.

| Artifact | SHA-256 | Result |
|---|---|---|
| `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | `MATCH` |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | `MATCH` |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | `MATCH` |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | `MATCH` |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | `MATCH` |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | `MATCH` |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | `MATCH` |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | `MATCH` |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | `MATCH` |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | `MATCH` |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | `MATCH` |

## Mechanical checks

**Tool:** PowerShell `7.6.5`, `Get-FileHash -Algorithm SHA256`, exact artifact paths. Result: all eleven frozen hashes above matched.

**Tool:** PowerShell `7.6.5`, `ConvertFrom-Json -Depth 100`. Scope: Pack A manifest; R1 contract; R2 contract and delta; R3 contract and delta. Result: all six JSON artifacts parsed without error.

**Exact structural checks on the R3 contract:**

- `/object_map`: 9 entries, 9 unique R2 object names, exact expected set: `PASS`.
- `/intervention_selector/outputs`: 5 entries, 5 unique values, exact set `reuse`, `enrich`, `ask`, `session`, `abstain_hold`: `PASS`.
- `/intervention_selector/exactly_one_output`, `/total_for_invalid_missing_stale_ambiguous_and_contradictory_input`, `/fail_closed_output`: declared `true`, `true`, `abstain_hold`: presence check `PASS`; behavioural truth not established by declarations.
- `/authority/closed`: exact 16-value expected set: `PASS`.
- Lifecycle transition referential integrity, requiring every `from` to be one member of `/lifecycle_policy/states` or `none`: `FAIL`. The non-state values are `intensive_proof_or_continuing` and `active_or_paused` at `/lifecycle_policy/transitions/4/from` and `/lifecycle_policy/transitions/6/from`.
- Exact outgoing edges from `preparing`: only `preparing -> intensive_proof`; there is no exact cancellation, close or terminal edge.

The repository R3 checker was `NOT RUN` in this sealed pass because its source directly reads excluded artifacts. Inspection also shows its selector checks prove declared fields, array membership and booleans only; they do not execute selection semantics. This is a limitation, not a substitute for the semantic ruling below.

## Criterion ruling

### Behavioural and Implementation Reality: `breaks`

**Rule:** The architecture must be total at its declared boundaries, survive sparse, stale, contradictory, invalid and changed inputs, resist hard-coded expected routes, and keep mechanical claims within their enumerated reach. A current-gate veto applies when an implementer could satisfy the written candidate while still choosing consequential unsafe, contradictory or product-defining behaviour that G24.A must own.

**Evidence that holds under attack:**

- R1 ownership is materially closed: `g24-product-system-blueprint-r3.md`, “Repair 1”, lines 39–88, and `g24-product-system-contract-r3.json` `/object_map` map all nine R2 objects exactly once, prohibit new canonical roots and derive effective state from canonical references.
- Invalidation is architecture-owned: blueprint lines 84–88 and 125–129, plus contract `/inherited_integrity/invalidation_triggers`, `/lifecycle_policy/permission_change_invalidates_unsent_derivatives_before_use` and `/intervention_selector/controlling_change_invalidates_before_use`, distinguish correction, permission change and erasure and invalidate changed inputs before use.
- The selector has one trusted owner and five exclusive route names: blueprint lines 147–194 and contract `/intervention_selector/owner`, `/outputs`, `/hard_precedence`. Source eligibility precedes burden, first arrival does not decide truth, and `abstain_hold` exists.
- The intervention atom is strong: blueprint lines 216–250 and contract `/intervention_atom` bind wording, controls, answer effects, visible consequence, honest exits, watermarks and exact-version approval; any payload change creates a new version.
- Sparse human responses are handled without punishment: blueprint lines 141–145 and 226–238 prohibit adverse inference, automatic re-asking, pressure and session escalation from unknown, defer, refusal or premise rejection.

Those strengths do not cure the two current-gate breaks below.

## Current-gate vetoes

### BIR-V1: The lifecycle graph is not an executable total state machine

**Exact locator:**

- `g24-product-system-blueprint-r3.md`, “Engagement transitions”, lines 96–106: grouped sources are written as ``intensive_proof` or `continuing` `` and `active or paused`; `preparing` has only an acceptance path.
- `g24-product-system-contract-r3.json` `/lifecycle_policy/states` and `/lifecycle_policy/transitions/4/from`, `/transitions/6/from`: the machine contract's `from` values `intensive_proof_or_continuing` and `active_or_paused` are not lifecycle states.
- `g24-product-system-contract-r3.json` `/lifecycle_policy/transitions`: the only exact `preparing` edge is to `intensive_proof`.

**Credible failure path:** Krish opens an operator-private `preparing` scope and eligible public or separately authorised material is staged. The leader then declines, cannot be reached, or the preparation is abandoned. An implementation that treats `active_or_paused` as including `preparing` can close it; an implementation that treats “active” as only `intensive_proof` and `continuing` cannot. Both can claim to follow the prose because `active` is undefined, while the machine contract recognises neither interpretation as an exact state. The second implementation leaves preparation operationally readable and eligible for operator-private preparation indefinitely; the first invents the authority and receipt semantics for a pre-engagement close. This is a lifecycle and retention-defining choice, not a later physical-schema value.

**Smallest sufficient repair:** Replace both grouped pseudo-state transition sources with explicit edges whose `from` and `to` are members of the state enumeration. Add one explicit pre-engagement cancellation terminal and edge, for example `preparing -> cancelled_before_engagement`, with named authority, version precondition, receipt, invalidation of prepared/unsent derivatives, and a capability policy limited to required retention, access and deletion obligations. Enumerate `intensive_proof -> paused`, `continuing -> paused`, `intensive_proof -> closing`, `continuing -> closing` and `paused -> closing` separately. Do not make the implementer define “active.”

**Identical resolving test:** Against the repaired contract, parse the state set and every edge, assert every `from` is `none` or an exact state and every `to` is an exact state, assert no `_or_` or undefined group token remains, then execute the same transition-table fixture for every permitted edge with a matching and stale version. The pre-engagement-decline fixture must end in the named terminal, emit the required receipt, make all prepared/unsent derivatives ineligible, allow only retention/access/deletion work, and reject every non-enumerated edge. The same test must fail the frozen R3 bytes and pass the repaired bytes.

### BIR-V2: Invalid-input fail-closed semantics disagree between prose and contract

**Exact locator:**

- `g24-product-system-blueprint-r3.md`, “Exactly one result”, lines 188–212. Line 208 permits missing, stale, ambiguous, contradictory or invalid input to return either `abstain_hold` **or “a typed provisional result.”** Line 210 separately permits conflicting evidence to seek a resolving route or abstain.
- `g24-product-system-contract-r3.json` `/intervention_selector/outputs`, `/exactly_one_output`, `/total_for_invalid_missing_stale_ambiguous_and_contradictory_input`, `/fail_closed_output`: the contract defines only five routes and names `abstain_hold` as the fail-closed output; it defines no provisional result type, standing, actionability or allowed causes.

**Credible failure path:** A controlling authority reference is missing or stale at the same time that a model proposes an apparently useful `ask` or `enrich` candidate. One implementer treats the blueprint's undefined provisional alternative as an actionable provisional `ask`; another follows the contract and returns `abstain_hold`. Both have text they can cite. The former can place an intervention into the proposal/approval path despite the selector not establishing valid authority. Conversely, treating every evidence contradiction as invalid and forcing `abstain_hold` would contradict the stated ability to choose an eligible resolving `enrich`, `ask` or `session` route. The architecture has not partitioned invalid controlling state from valid-but-unresolved contradictory evidence, leaving a consequential trust-seam choice to code.

**Smallest sufficient repair:** Remove the undefined sixth possibility. State one exact partition in both blueprint and contract: (a) unknown, missing, mismatched, future-dated, expired or invalid identity, subject, authority, audience, purpose, lifecycle or version references return exactly `abstain_hold` and cannot create an actionable intervention; (b) valid canonical references with unresolved contradictory evidence may return `enrich`, `ask` or `session` only when that resolving route passes every prior eligibility gate and carries the unresolved contradiction forward; otherwise return `abstain_hold`; and (c) “provisional” may be diagnostic standing on one of the five results only if it is explicitly non-authoritative and cannot bypass route eligibility or approval invalidation. No extra route is introduced.

**Identical resolving test:** Run a table-driven selector conformance suite over the same accepted frame with one mutation at a time: missing subject, mismatched workspace, future-dated source, expired permission, stale frame, invalid lifecycle, valid independent contradiction with an eligible resolving source, valid contradiction with no resolving source, and a model-proposed route that conflicts with hard precedence. Assert exactly one of the five routes, `abstain_hold` for every invalid controlling-reference case, a resolving route only for the eligible valid-contradiction case, preservation of contradiction in the output, no actionable side effect from diagnostic provisional standing, and invalidation after any watermark change. The same suite must reject the frozen ambiguity and pass the repaired semantics.

## Later-gate watchpoints, not additional G24.A vetoes

- **Selector arbitration and budget boundary:** Blueprint lines 166–184 and contract `/intervention_selector/budget_dimensions` name the right dimensions but do not yet define missing, malformed, exhausted, incomparable or tied-budget behaviour. Numeric values are explicitly a later gate, so this is not a separate current-gate veto. Before G24.B/C, the implementation contract must define unit/type validation, exhaustion, dominance or tie policy and monotonicity so a developer does not turn “least burden” into an arbitrary weighted score.
- **Hard-coding risk:** The present mechanical checks can be passed by reproducing arrays and booleans. Contract `/later_gate_requirements/g24_b_c` correctly carries a hidden semantic oracle, competent same-evidence baseline, safe-novel/malformed cases and slow/failed/duplicate/stale execution forward. The later evaluator must keep oracle cases hidden from the builder and include metamorphic cases where one authority, freshness, contradiction, deadline or budget fact changes while all fixture labels remain constant.
- **Runtime failure states:** Slow source acquisition, duplicate execution, retry/idempotency, stale reads and independently observed state diffs remain G24.B/C evidence. Exact schemas, numeric thresholds and runtime proof are properly deferred; they do not erase the two semantic architecture defects above.
- **Permission after delivery and erasure residue:** The candidate invalidates unsent derivatives now and explicitly assigns atomic delivery revalidation, revocation/erasure traversal and export residue to the first delivery/data capability and G24.H. Those boundaries remain watchpoints while all delivery and customer-data actions stay closed.
- **Rendered honesty:** Exact question copy, mobile comprehension, failed-save behaviour and visible-consequence comprehension remain G24.D evidence. The versioned atom is an architecture choice now; observed comprehension is not falsely claimed.

## External-action closure

`g24-product-system-contract-r3.json` `/authority/closed` preserves all sixteen closed actions: `production_write`, `customer_data`, `account_creation`, `external_research_run`, `model_spend`, `email_send`, `customer_contact`, `session_scheduling`, `session_capture`, `connector_creation`, `database_branch_creation`, `deployment`, `merge`, `feature_enablement`, `release`, and `legacy_backend_deletion`. None was exercised in this review. The veto repairs do not open any of them.

## Owner decision and handoff

Current decision: changes required; the candidate cannot clear G24.A under this frozen standard. Repair only BIR-V1 and BIR-V2, freeze new hashes, and rerun the identical lifecycle and selector conformance tests plus a fresh sealed council pass. Runtime schemas, operating values and empirical product claims remain at their named later gates.

**Ledger proposal:** None. No ledger write was authorised.
