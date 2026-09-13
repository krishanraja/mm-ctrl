# G24 trusted canonical ingress contract

**State:** local architecture candidate for independent attack; no runtime or database implementation

**Authority:** Krish's continuing local write authority after the independently verified G24 headless Crossing. External research, Supabase change, runtime connection, customer data, model calls, deployment, merge and release remain closed.

## Outcome

Turn one server-resolved, transactionally consistent view of canonical state into the exact envelope accepted by the verified G24 kernel. The boundary must remove the kernel's dependence on caller assertions without becoming a second Brain, policy engine, receipt authority or hidden memory store.

This is the difference between structurally valid input and trusted standing. A browser, model, queue payload or copied JSON object may request work. None may declare what is current, complete, permitted, sufficiently evidenced, independently challenged, approved, within budget or already terminal.

## The only public command

The untrusted command may contain only:

- an opaque operation ID;
- the requested case reference;
- the requested operation class;
- the authenticated session presented to the server boundary.

Purpose, audience, subject, workspace, accepted decision frame, applicable controls, evidence coverage, policy versions, challenger result, route eligibility, budgets, approvals, receipt history, plan state and trusted time are resolved behind the boundary. An unknown command field makes the command invalid. Adding a material field cannot override canonical state or be silently ignored as though it had been accepted.

## One authoritative read

The ingress resolver obtains one database transaction snapshot. Every selected row and derived version belongs to that snapshot. It must not assemble a decision from separate REST calls, a read replica with unknown lag or independently cached fragments.

The snapshot must bind:

1. authenticated actor, session validity and server capability;
2. workspace, subject, case and engagement identity;
3. current purpose, audience, sensitivity, permission and named-human authority;
4. accepted decision frame, decision requirement and material consequence;
5. the complete applicable-control manifest and transitive dependency graph;
6. current canonical sources, assertions, accepted Brain versions and their audience ceilings;
7. evidence coverage, provenance-root collapse, contradiction state and unresolved references;
8. current epistemic policy and independently produced challenger result, including the declared search boundary;
9. registered route capabilities, source limits, interruption permission, deadline and budget state;
10. exact approval, answer, correction, lifecycle, Release and enrichment-plan receipt chains relevant to the requested operation; and
11. database-derived trusted time, transaction identity and snapshot revision.

Missing rows, duplicate current rows, conflicting roots, incomplete pagination, decryption or authentication failure, unknown schema versions and ambiguous currentness return a non-actionable hold. They never produce a partial trusted envelope.

## Derivation, not relabelling

The adapter derives the kernel input from canonical rows and versioned trusted evaluators. It does not accept the kernel's booleans or status labels from the command, a model response or a stored planner projection.

- Applicable controls come from the current policy manifest plus case-specific applicability, with the locked minimum as a floor.
- Evidence sufficiency and route-specific capability come from the current evaluation policy over the exact visible evidence set.
- Independent provenance roots are collapsed before sufficiency is calculated.
- The challenger result must come from the current independent-challenger lineage and bind its actual search boundary.
- Route candidates come from registered adapters and current permissions, deadlines and budgets. A model may propose a candidate but cannot make it eligible.
- Materiality comes from the accepted human decision frame and current decision requirement, not generated copy.
- Human authority comes from an authenticated, named actor action bound to the exact object fingerprint and visible material effect.

The final kernel envelope is a fresh owned value. It carries only canonical identifiers, versions and bounded decision data needed for the pure call. Raw private content, credentials, ciphertext, unrestricted rows and service authority do not cross the boundary.

## Check, use and change

A prepared envelope is not an action permit. Before any answer, transition, enrichment attempt, Release use or delivery-related step, the server must re-enter an atomic check-and-use transaction and compare the complete controlling watermark set with the prepared snapshot.

- Unchanged exact request and idempotency identity replays the original durable result.
- Any relevant version change invalidates the prepared projection before use.
- A newly applicable control is a relevant change even if every previously recorded watermark is unchanged.
- An unrelated lineage change does not invalidate the operation.
- Correction, permission withdrawal, audience narrowing, lifecycle change and newer accepted Brain versions cannot race behind a stale action.
- Failure after validation but before durable append creates no externally visible success.

The pure kernel may calculate a candidate result inside that transaction. The database transaction remains the authority for durable append, uniqueness and finality.

## Durable proof after restart

In-process WeakMap issuance proofs remain a defense inside one execution. They are not durability.

Every durable object reintroduced after restart must be reconstructed from canonical rows selected inside the current authoritative snapshot and must pass all of the following before a fresh local proof is issued:

- exact schema and canonical normal form;
- workspace, subject, case, purpose and audience binding;
- object fingerprint recomputation;
- complete predecessor-chain verification from the canonical root;
- unique receipt and idempotency identities;
- recorded actor and authority version validation;
- current applicability and retention eligibility; and
- database-enforced append provenance, not possession of matching JSON.

Rehydration can restore the ability to verify history. It cannot revive an expired permission, stale approval, invalidated projection, exhausted plan or closed engagement.

## Enrichment-plan finality

Plan issuance, attempt allocation, budget consumption and terminal state are one server-owned state machine.

- The canonical plan fingerprint is unique within its case and plan lineage.
- Attempt ordinal allocation and receipt append occur atomically.
- Idempotency identity and receipt identity are unique at the database boundary.
- Wall-clock and attempt budgets are derived from the current canonical plan, never the request.
- Once terminal, the plan cannot be reopened by an empty, truncated, alternate or equivalent history after restart or on another worker.
- Two concurrent workers cannot both win one remaining attempt or produce two terminal receipts.
- Slow, failed, cancelled and stale attempts consume budget only according to the explicit current plan policy and always record the exact governed result.

## Trust zones

The browser and customer surface receive neither service credentials nor canonical write authority. Models, browser clients, queues and external tools remain untrusted proposers. A server process may hold a narrowly scoped capability, but possession of a service credential alone is not proof of workspace, purpose or audience eligibility.

For the eventual Supabase implementation:

- exposed tables retain RLS and least-privilege grants;
- `user_metadata` is never authorization input;
- privileged functions are not exposed through default `PUBLIC` execute rights;
- views used for authorization are security-invoker or otherwise inaccessible to browser roles;
- service credentials never enter frontend bundles, logs, receipts or exports; and
- browser requests cannot choose the workspace against which privileged code acts.

These are implementation requirements, not claims that a Supabase path exists.

## Bounded failure contract

The resolver must have explicit upper bounds for rows, graph nodes, graph depth, receipt count, source bytes, query duration and evaluator work. It must reject incomplete pages, truncated histories and limit hits as named holds. Cancellation stops further calculation and creates no approval, Brain standing, delivery or Release.

Logs may contain operation ID, non-sensitive canonical IDs, duration, counts, result class and error code. They may not contain private content, prompts, raw source text, tokens, keys, ciphertext or unrestricted object dumps.

## Required adversarial proof before runtime

The local ingress implementation must attack at least:

1. cross-workspace, wrong-subject, wrong-case and audience-widening substitution;
2. caller-supplied policy, standing, route, budget, time, approval and receipt fields;
3. expired sessions, revoked sessions and stale authorization claims;
4. duplicate-current rows, missing lineage, dependency cycles and newly applicable controls;
5. partial pages, replica lag, timeout, cancellation and decryption failure;
6. correction, permission, audience, lifecycle and Brain-version races between prepare and use;
7. proofless, truncated, reordered, spliced and cross-case durable histories;
8. exact replay, changed-payload replay and identity collision after restart;
9. empty, truncated, alternate and equivalent-plan reopening after terminalization;
10. two workers competing for the last attempt and for the sole terminal receipt;
11. model-authored evidence standing or human authority; and
12. oversized graphs, histories and payloads that must fail before proportional hostile work.

Tests must prove both the rejection and the absence of side effects. A hold with a fabricated receipt, partial history or mutated Brain is a failure.

## Explicitly not proved here

This contract does not prove a database implementation, production transaction semantics, Supabase configuration, restart recovery, encryption, model judgement, novel-decision quality, customer comprehension, delight, value or any external action. It opens only a bounded local implementation and adversarial-fixture proposal after independent contract review.
