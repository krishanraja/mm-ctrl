# G24 trusted canonical ingress contract R2

**State:** local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** only the rejected R1 trusted-ingress candidate at `491ba15e19865a1522006ed42c0ccc4527460e9b`

**Preserves:** the founder-locked G24 R1 through R5 product architecture and independently verified headless kernel at `807f1d659888d1bdd57acf9ba314e0c72316cf02`

## Outcome

One server-only boundary turns an exact human or system intent plus one authoritative database transaction into the verified kernel's input. The boundary cannot invent intent, trust caller assertions, omit a cheaper eligible route, rehydrate copied JSON as proof or persist a shadow Brain.

R2 is executable architecture, not a production claim. It creates no endpoint, database object, Supabase resource, customer data path, model call, external send or runtime import.

## Public request and session boundary

Authentication arrives through verified server transport context, not a JSON field. A bearer token, cookie or session object is never persisted in the operation registry, idempotency payload, receipt, log or export.

The request has exactly four fields:

1. `operation_id`;
2. `requested_case_ref`;
3. `operation_class` from the closed enum below; and
4. `intent`, validated by the exact schema for that operation.

Unknown fields, unknown operations, over-limit payloads and schema mismatches return `invalid_command_hold` with no receipt or side effect. A request may express human-owned content. It may not assert actor, workspace, subject, purpose, audience, authority, policy, standing, route eligibility, budget, receipt history, plan state or trusted time.

## Closed operation registry

| Operation | Actor class | Exact intent fields | Canonical result | Durable write |
|---|---|---|---|---|
| `select_intervention` | authorised operator or system | none | selector result or hold | operation result only |
| `create_intervention` | authorised operator or system | selector result ref, content proposal ref | intervention atom or hold | proposed intervention atom |
| `approve_intervention` | Krish operator | intervention atom ref, decision, optional edited-content ref, visible-effect receipt ref | approval result or hold | approval receipt |
| `record_answer` | named leader | intervention atom ref, approval receipt ref, answer kind, bounded answer value, optional note, visible-effect receipt ref | answer result or hold | answer receipt |
| `correct_answer` | named leader or explicitly authorised operator | original answer receipt ref, replacement answer kind, bounded replacement value, optional note, reason ref | correction result or hold | replacement answer and correction receipt |
| `apply_lifecycle_transition` | exact actor required by the locked transition | lifecycle snapshot ref, transition ID, authority-action ref, precondition-evidence refs | new snapshot or hold | lifecycle receipt and snapshot |
| `compile_release` | authorised operator or system | accepted release-request ref | pending projection or hold | pending projection |
| `use_release` | named leader | pending projection ref, release-authority receipt ref | outbox intent or hold | Release-use receipt and outbox intent |
| `create_enrichment_plan` | authorised operator or system | selector result ref, budget-policy ref | execution plan or hold | canonical plan |
| `record_enrichment_attempt` | trusted worker | plan ref, worker-attempt ref, provider-operation ref, outcome class, optional source ref | execution receipt or hold | attempt receipt and plan state |

Every operation has a versioned exact payload schema, actor class, maximum payload size, idempotency scope, read set, write set and result union in the machine contract. Human content is accepted only where the operation schema names it. Raw source bodies, unrestricted database rows, credentials and ciphertext never enter the kernel envelope.

`visible_effect_receipt_ref` resolves a durable record of the exact content version and material consequence actually rendered to the named human before their action. A string claiming that the effect was visible is not evidence.

## Atomic operation identity

The first database action atomically inserts or resolves one operation-registry row keyed by `operation_id`. It binds:

- authenticated actor and live session ID hash;
- case-derived workspace and subject;
- case, operation class and intent fingerprint;
- schema and limits-policy versions;
- first trusted database time;
- status and exact original result fingerprint.

The workspace is derived from the authorised case. The request cannot choose it. Same ID plus identical actor, case, class and intent returns the stored original result bytes. Same ID with any changed binding returns `operation_identity_conflict_hold`. Session validity and revocation are rechecked on every non-read-only replay; matching an old registry row does not revive authority.

## Canonical ownership and no second Brain

| Resolved value | Existing canonical owner | Ingress treatment |
|---|---|---|
| workspace, subject and audience grants | R1 Brain workspace and authority records | reference only |
| case, purpose, accepted frame and decision requirement | existing consequential-work case and event records | reference only |
| sources and assertions | R1 canonical evidence records | reference and bounded evaluation input |
| accepted items and relationships | R1 canonical Brain versions | reference and bounded evaluation input |
| epistemic policy and source qualification | R1 governance policy lineage | reference and execute current evaluator |
| independent challenger result | R1 challenger run and receipt lineage | reference and verify declared boundary |
| evidence coverage and selector result | rebuildable projections | ephemeral or fingerprint-addressed cache only |
| intervention, answer, correction and lifecycle events | existing R1 consequential-work event families | append through named procedures only |
| Release request, projection, authority and use | existing R1 Release owner | reference or append through Release procedures only |
| enrichment plan and attempt receipt | existing evidence-planner run and execution receipts | reference or append through planner procedures only |

Ingress projections are ephemeral. Any cache is content-addressed, time-bounded, rebuildable and never queried as canonical current state. It cannot award standing, authority, permission, applicability, approval or Release. No ingress table may store a competing copy of Brain content or current truth.

## Complete canonical sets

The authoritative snapshot contains versioned seals, each with a canonical count and SHA-256 set digest:

- control-universe version and complete key set;
- applicability-policy version and complete applicable-control set;
- transitive control-closure graph and complete edge set;
- evidence-selection policy and complete visible source and assertion sets;
- current accepted Brain item and relationship sets;
- route-capability registry and complete capability set;
- each relevant append-only receipt chain and exact chain tip.

Unknown or unclassified controls hold. A control-universe or applicability-policy mutation increments its seal in the same write transaction. A source, assertion, Brain version, grant, capability or receipt mutation increments its owning set seal. Direct writes that bypass seal maintenance are denied.

The route-capability projection always contains exactly one candidate for each of `reuse`, `enrich`, `ask` and `session`. Ineligible or unavailable routes remain present with canonical reasons. Burden comes from the current burden-policy version. Omission, duplication, evaluator failure, unclassified capability or set-seal mismatch returns `candidate_completeness_hold`.

## Full snapshot fingerprint

The ingress calculates one canonical `snapshot_fingerprint` over:

- operation identity and exact intent fingerprint;
- actor, live-session, workspace, subject, case and engagement versions;
- purpose, audience, sensitivity, permission and named-authority versions;
- accepted frame, decision requirement and material-consequence versions;
- all control-universe, applicability, closure and evidence set seals;
- exact visible canonical source, assertion and accepted Brain version sets;
- evidence-coverage evaluation, epistemic policy and challenger result including search boundary;
- the complete four-route candidate set, capability-registry seal and burden-policy version;
- deadline and budget state;
- relevant approval, answer, correction, lifecycle, Release and execution chain tips;
- canonical plan state and terminal flag where applicable;
- schema, evaluator and limits-policy versions; and
- trusted transaction time and snapshot revision.

The kernel receives only an owned envelope derived from those bytes. A prepared envelope has no action authority.

## Exact database protocol

The eventual implementation uses one dedicated server connection and one operation procedure under `SERIALIZABLE` isolation. It does not compose this boundary from separate Data API requests.

1. Verify the session server-side, including current session revocation state.
2. Insert or lock the operation-registry row.
3. Derive workspace and subject from the authorised case.
4. Lock the case-scope authority/version row. Lock the plan row for attempt operations.
5. Read every canonical set and seal in the same snapshot.
6. Derive evaluations, candidates and the full snapshot fingerprint.
7. Run the pure kernel or private proof bridge.
8. Immediately before append, recheck session, time-based validity, deadline, permissions, all set seals, chain tips, plan state and snapshot compare-and-swap keys using database time.
9. Append the exact receipt, state transition or outbox intent and store the original result fingerprint.
10. Commit. On serialization failure, retry the identical operation at most three times. Exhaustion returns `serialization_retry_hold` without a partial result.

The compare-and-swap key includes case-scope version, engagement version, control-universe seal, applicability seal, evidence seal, Brain seal, capability-registry seal, relevant receipt-chain tips and plan version. Unique constraints cover operation ID, receipt ID, scoped idempotency identity, plan fingerprint plus attempt ordinal, and one terminal receipt per plan.

Newly applicable controls and capabilities cannot appear as unobserved phantoms because their only write procedures update the locked universe or registry seal. Direct DML is revoked from application and service-facing roles.

Database time is not compared for byte equality across transactions. Every use re-evaluates expiry, not-before, deadline and retention predicates against fresh database time and records the evaluated instant.

## Canonical append provenance

Canonical tables are owned by non-login owner roles. Application roles receive no direct insert, update or delete grant. Each event family has one narrow procedure with exact argument schema, internal actor, case and workspace derivation, chain-tip compare-and-swap and append-only constraints. `PUBLIC`, `anon`, `authenticated` and broad service-facing roles have no direct execute or DML path.

The ingress runtime uses a dedicated least-privilege login that can execute only the closed operation procedures and select only the required resolver views. It does not use a browser key or an unrestricted `service_role` credential. RLS remains defense in depth, not the proof of privileged append provenance.

## Private restart-proof bridge

The local implementation must add a server-only proof bridge that is absent from browser exports and rejected by a bundle-import check. A closure capability is created only from a successful authoritative resolver result. No public API accepts a caller-created provenance token.

The bridge has a distinct rehydrator for selector result, intervention approval, answer, correction, lifecycle snapshot and receipt, pending Release projection and authority, enrichment plan and execution receipt. Each rehydrator receives the exact canonical row family, complete predecessor chain, set seals and snapshot fingerprint. It recomputes normal form and fingerprints, verifies scope, actor, authority, current applicability and database append provenance, then mints only the same ephemeral proof used by the pure kernel.

Selector and evidence projections are recomputed where possible rather than rehydrated. Before any plan call, the bridge registers canonical terminal state and receipt-chain tip. Rehydration can verify history; it cannot revive expired permission, stale approval, invalidated Release, exhausted plan or closed engagement.

## External-effect protocol

No provider call occurs inside the authoritative transaction. An authorised operation appends one outbox intent with a unique effect ID, exact payload fingerprint, destination scope and provider idempotency key. A separate worker rechecks current authority immediately before send.

Provider confirmation appends `confirmed`; explicit rejection appends `failed`; timeout or ambiguous provider response appends `unknown`. An unknown outcome is not automatically retried unless the provider guarantees the same idempotency key returns the original effect. Otherwise it requires reconciliation. The product must never claim exactly-once external delivery where the provider cannot prove it.

## Initial local proof limits

These are versioned engineering guardrails for the local proof, not permanent commercial policy:

| Limit | R2 value | Hold code |
|---|---:|---|
| request JSON | 65,536 UTF-8 bytes | `request_limit_hold` |
| intent JSON | 32,768 UTF-8 bytes | `intent_limit_hold` |
| answer or replacement text | 16,384 UTF-8 bytes | `answer_limit_hold` |
| optional note | 8,192 UTF-8 bytes | `note_limit_hold` |
| selected canonical rows | 8,192 | `row_limit_hold` |
| canonical snapshot | 8,388,608 bytes | `snapshot_limit_hold` |
| control keys | 256 | `control_limit_hold` |
| control edges | 2,048 | `control_edge_limit_hold` |
| control depth | 32 | `control_depth_hold` |
| visible sources | 1,024 | `source_limit_hold` |
| visible assertions | 4,096 | `assertion_limit_hold` |
| accepted Brain items | 2,048 | `brain_item_limit_hold` |
| accepted Brain relationships | 4,096 | `brain_relationship_limit_hold` |
| receipts in any non-execution family | 512 | `receipt_limit_hold` |
| execution receipts | 33 | `execution_receipt_limit_hold` |
| database statement time | 5,000 ms | `query_timeout_hold` |
| complete operation transaction | 8,000 ms | `transaction_timeout_hold` |
| deterministic evaluator work | 1,000 ms | `evaluator_timeout_hold` |
| serialization retries | 3 | `serialization_retry_hold` |

Limits are checked before proportional decoding or traversal wherever the representation permits. Limit, timeout and cancellation holds return no kernel envelope, fabricated receipt, Brain mutation, outbox intent or external action.

## R2 proof obligations

The local implementation must prove every R1 attack plus:

1. all ten operation unions accept exact intent and reject hidden, missing, extra and cross-operation fields;
2. same-operation replay returns exact original bytes, while any actor, scope, class or intent collision holds;
3. server transport context never enters persisted operation bytes or logs;
4. workspace is derived from case and cannot be selected by a privileged caller;
5. all four route candidates are present exactly once and use the current burden policy;
6. missing capability, unknown control and every set-seal mismatch hold;
7. every snapshot component changes the fingerprint and every relevant change fails compare-and-swap;
8. correction, permission, audience, lifecycle, Brain, capability and applicability races create no side effect;
9. serialization retry is bounded, idempotent and returns no partial result;
10. every durable object type rejects copied, spliced, truncated, reordered, cross-scope and direct-DML provenance;
11. terminal plan state is registered before use and survives simulated restart;
12. two workers produce one last-attempt winner and one terminal receipt;
13. outbox confirmation, failure and unknown outcomes obey idempotency and reconciliation rules;
14. every numeric limit rejects before unbounded hostile work; and
15. browser build and import checks exclude the proof bridge and privileged dependencies.

Every rejection must also prove zero approval, Brain standing, Release eligibility, outbox or external side effect.

## Claim boundary

R2 remains a local contract candidate. It does not prove that Postgres or Supabase implements the protocol, that a private proof bridge is safe, that transactions survive real load, that models reason well, that questions are answerable or that customers receive value. Those claims remain at their named implementation, G24.C, G24.D, assisted-pilot and release gates.

