# G24 predicate authority founder decision, R75

Status: `panel_cleared_founder_ready_candidate`

Date: 2026-09-15

Supersedes R74 only for editorial and carry-forward clarity; R72 and R73 remain vetoed

## The decision

CTRL needs one trustworthy answer to a narrow question: **has everything required for this exact engagement move been established, by the right kind of authority, from a complete current picture?**

This proposal recommends one evaluation path with three authority species:

1. **Mechanical fact:** directly established by the canonical system that owns it, such as the current period version, grant status or expiry.
2. **Normative human attestation:** an exact named person owns a judgement that cannot be discovered from a database, such as the purpose, acceptable decision frame, meaningful next value or stop condition.
3. **Derived fact:** a deterministic, versioned projection of mechanical facts and/or human attestations. It never introduces new meaning.

An LLM may locate candidate evidence, detect conflict, explain a gap or draft a question. It cannot create any of these authority species, declare a precondition satisfied or authorize a transition.

## Founder choice requested

Approve this model:

> One closed, complete and source-earned fact bundle is evaluated by explicit deterministic rules. Mechanical truth comes from its canonical owner. Normative truth comes from a bounded named-human attestation. Signed external authority is allowed only where an external system indisputably owns that exact fact kind. Every consequential transition still requires separate fresh human authority bound to the exact result and visible effect.

This preserves the useful core of A+C while accepting the strongest case for B at a narrow system boundary. It rejects both a generic signed `true` and the fiction that every important human judgement is an objective database fact.

## What one authority path means

There may be multiple source owners, but there is one CTRL evaluation and commit path. No source can hand CTRL a final transition decision.

- A canonical internal store supplies the mechanical facts it owns.
- A named-human receipt supplies the normative judgement that person owns.
- A canonical external issuer may attest only to a fact kind it exclusively owns, under a founder-locked issuer policy.
- A deterministic assembler proves the selected picture is complete.
- A pure predicate evaluates that picture.
- A separate authority verifier checks the exact human permission for the transition.
- One transaction coordinator either commits the whole joined proof or commits nothing.

## Source-earned semantic profile

Every fact must bind more than a row identifier. Its semantic profile must include:

- fact kind and authority species;
- exact subject, customer/tenant, case and engagement;
- purpose and permitted audience;
- consequence class and allowed uses;
- source type, source identity, schema version, row version and content fingerprint;
- atomic assertion or exact source-span reference;
- speaker or issuing system;
- epistemic basis: observed, human-stated, externally attested or deterministically derived;
- issuer-to-fact-kind authority rule and policy version;
- applicability interval and validity boundary;
- derivation function and version where derived;
- all current contrary assertion references and their precedence disposition;
- exact accepted Brain item/version when the fact depends on accepted Brain knowledge;
- explicit `proposal_only` standing when it has not passed the G13 learning-proposal authority gate.

A label such as `accepted_frame_ref` or `value_checkpoint_ref` cannot certify itself. The source profile must show who established its meaning, from what exact material, for which case and use.

## Complete read-set proof

The assembler must prove it did not omit inconvenient facts.

Each collection input carries:

- canonical source registry and selection-policy version;
- exact subject, case, purpose and audience query;
- authoritative collection head or transaction snapshot epoch;
- complete sorted member identities and content fingerprints;
- a domain-separated member-set seal;
- duplicate, extra and omission rejection;
- all current applicable supporting and contrary members;
- explicit negative-completeness proof when absence is required.

For `open_preparation`, the bundle must prove `predecessor = null` and that the complete current-lifecycle set contains no active row. For grants, it must prove the complete current grant and revocation sets, not merely name the rows the assembler selected.

## One common bundle envelope

Every one of the thirteen variants binds:

- exact `fact_kind`, `transition_id` and `precondition_id`;
- customer/tenant, named leader, subject, case, engagement, purpose and permitted audience;
- predecessor lifecycle state and version, including explicit null/absence proof where applicable;
- dispatch snapshot epoch and authoritative server evaluation time;
- complete source-set proofs and semantic profiles;
- exact evaluator, assembler, selection-policy and authority-policy versions;
- earliest validity expiry across every dependency;
- canonical bundle bytes and domain-separated SHA-256 fingerprint;
- no caller-selectable predicate, source path, schema, issuer or output shape;
- no opaque prose that independently satisfies a rule.

Audience is always the intersection of current permitted grants. No fact, assertion, proof or output may widen it by inference.

## Typed dependency outcome

The evaluator returns one disposition for every required dependency:

- `present`
- `contradicted`
- `missing`
- `stale`
- `unreadable`
- `ambiguous`
- `revoked`

Each disposition binds the dependency id, source or absence proof, rule version, reason code, validity horizon and whether resolution is system-owned or human-answerable.

The overall result is:

- `satisfied` only when every dependency is `present` and every rule passes;
- `unsatisfied` when a complete authoritative picture proves a contradiction;
- `indeterminate` when anything required cannot be established safely.

Only `satisfied` may create a factual precondition proof. It never applies a transition by itself.

## Who resolves a gap

Every field is declared as one of two interaction classes:

- `server_verify_only`: CTRL, its operator or a source adapter must resolve it. The leader is never asked for it.
- `human_answerable`: the answer is a normative judgement owned by the named person and can materially change the decision.

A human-answerable field must bind:

- the exact decision-frame reference, version and standing required by that transition, or an explicit absence/not-yet-created proof where the variant precedes frame acceptance;
- the named person who owns the answer;
- a bounded answer grammar plus a real `unknown` and free-expression route;
- the exact effect of each answer: `select`, `stop`, `bound` or `materially_reshape`;
- why the system cannot verify it itself;
- the consequence the person sees before final authority;
- a fresh answer receipt, never an inferred agreement.

If a proposed question has no such effect, delete it. If the missing field is administrative, route it to the system or Krish. When several human-answerable gaps exist, a deterministic priority rule selects at most one question at a time: safety-critical route change first, then largest reversible consequence reduction, then information value. Ties hold for operator review rather than inventing a priority.

## Thirteen exact variants

Shared primitives may be reused, but each transition has a distinct discriminated variant and rule. Similar transitions cannot borrow one another's facts or authority.

| Transition | Server verifies without asking the leader | Human-owned input, if missing | Exact material effect |
|---|---|---|---|
| `open_preparation` | predecessor is null; complete lifecycle set proves no current row; subject identity and eligible source-class values are valid | Krish names bounded purpose, allowed source classes and review date | bounds or stops private preparation |
| `accept_intensive_proof` | exact current preparation; complete active grant and revocation sets; checkpoint exists | named leader and Krish accept the exact purpose and decision-frame version | starts or stops the intensive proof |
| `close_preparation` | exact current preparation version | authorized person chooses `cancelled`, `declined` or `withdrawn` with optional context | stops preparation and invalidates unsent derivatives |
| `continue_after_intensive_proof` | exact current proof period and checkpoint integrity | named leader and Krish name the next consequential decision or evidenced value, the required continuation checkpoint, and exit/revisit condition | selects, bounds or stops continuation |
| `renew_continuing_period` | exact current continuing period and current checkpoint | named leader and Krish name the next decision or evidenced value and exit/revisit condition | selects, bounds or stops the next period |
| `pause_intensive_proof` | exact current intensive-proof period | separate fresh pause authority only, not a predicate question | stops new work until revalidated |
| `pause_continuing` | exact current continuing period | separate fresh pause authority only, not a predicate question | stops new work until revalidated |
| `resume_continuing` | exact paused period; identities; complete grant, revocation and audience sets; freshness; proof old expired/revoked grants remain unusable and fresh issuance exists where required | named leader and Krish revalidate purpose, next value and checkpoint | reshapes, resumes or stops continued work |
| `close_intensive_proof` | exact current intensive-proof period | separate fresh close authority only | stops new decision-shaping work |
| `close_continuing` | exact current continuing period | separate fresh close authority only | stops new decision-shaping work |
| `close_paused` | exact current paused period | separate fresh close authority only | stops new decision-shaping work |
| `complete_close` | exact close request; a sealed complete set with exactly one `access`, `correction`, `separate_release` and `close` obligation; each fulfilled or recorded outstanding | responsible human names owner and revisit date for any genuinely outstanding obligation | completes or holds closure without implying Release |
| `open_new_preparation_after_close` | exact closed predecessor; complete prior-grant and revocation sets prove no old grant can revive | Krish names a genuinely new purpose and review date | opens bounded new work or holds closed |

Authority receipts remain separate from predicate facts. A workload may assemble or verify. It may never supply the named-human authority required by the locked lifecycle transition graph.

## Bounded external canonical authority

An externally signed atomic fact is permitted only when the external system is the indisputable canonical owner for that exact founder-approved fact kind. Examples are an identity-provider subject binding observed at a named revision, an invoice settlement recorded at a named revision, a consent-signature envelope completed, or a permission-grant record at a named revision. The issuer cannot attest to a broader legal, semantic or business conclusion that it does not exclusively own.

Hybrid ownership is forbidden by default. Each fact kind has one exact canonical owner and precedence rule. A separately founder-locked exception must name how conflicting internal and external records resolve; configuration-time phrases such as “when direct records are unavailable” cannot choose authority at runtime.

### Executable consistency protocol

Every externally authoritative fact kind must choose exactly one founder-locked protocol:

1. **Immutable authority lease.** The issuer signs an assertion and guarantees that its exact fact revision remains authoritative through `valid_until`. The lease binds assertion id, fact revision, signed source head, fact-level revocation epoch, key and policy version, verification time, exact TTL and maximum permitted clock skew.
2. **Online conditional verify-and-consume.** At commit, the issuer atomically verifies or consumes the exact assertion against its current fact revision, source head and fact-level revocation state. It returns a signed single-use result bound to CTRL's transaction nonce, exact transition and reserved receipt version.

The policy fixes TTL and maximum clock skew per fact kind. “Very short” is not a control. Issuer-key revocation and fact-level withdrawal are distinct and both must be checked.

If the canonical issuer cannot provide either protocol, its assertion is evidence only. The dependency is `indeterminate` and cannot become predicate authority.

### Cross-system completion and recovery

A local serializable transaction cannot lock another system. The transaction coordinator therefore uses a versioned state machine:

1. reserve the local transition receipt and idempotency key;
2. obtain an immutable lease or conditional single-use token bound to the reservation and nonce;
3. revalidate local facts and human authority, then commit the local transition with the external token identity;
4. finalize or acknowledge the external token idempotently;
5. reconcile a lost acknowledgement by querying the issuer with the same nonce and token identity;
6. release or allow expiry when the external step succeeds but the local transaction rolls back;
7. quarantine the local transition and block descendants if later reconciliation proves the external commitment did not hold.

Concurrent CTRL transactions cannot consume the same token. Retry reuses the same idempotency key and nonce. Every terminal path emits a receipt; uncertainty remains `indeterminate` and non-steering.

The signed external type must also bind exact subject, case, purpose, audience, consequence, transition, precondition and predecessor where applicable; source digest; key id and algorithm; issue and verification times; issuer/key and fact-revocation set seals; contradiction disposition; and a type-level prohibition on carrying or becoming the final `satisfied` result.

The external fact still passes through CTRL's one predicate path, separate human authority check and commit coordinator.
## Atomic evaluation and commit

One central transaction coordinator, and no specialist module, owns the lifecycle write boundary.

For CTRL-owned state, one local serializable transaction must:

1. reserve the exact transition-receipt row version;
2. read or validate the authoritative source heads, set epochs and complete seals;
3. obtain authoritative server transaction time;
4. require transaction time to precede every expiry and validity boundary;
5. verify the predicate proof hash and every typed dependency disposition;
6. verify the exact named-human or permitted workload authority receipt for this transition;
7. bind predicate proof, authority receipt, subject, case, purpose, audience, transition, predecessor, dispatch snapshot and reserved row version;
8. compare-and-set all CTRL-owned row versions, collection heads, set seals and revocation epochs, and verify the external lease or consumed-token identity is current;
9. reject any new, removed, changed, expired, revoked or contradictory member;
10. write the transition and joined receipt atomically, or write nothing.

An authority receipt for different bytes, a different visible consequence or an earlier bundle cannot be reused. `unsatisfied` and `indeterminate` are structurally incapable of reaching the receipt writer.

## Full correction and self-healing contract

When a consumed fact is corrected, revoked, superseded or discovered incomplete:

1. preserve the historical source, proof and transition receipt;
2. mark the precondition proof challenged and non-steering for current use;
3. traverse the complete dependency-use graph;
4. block affected descendants from current decision steering;
5. rebuild every replaceable projection, cache and portrait from current versions;
6. quarantine or visibly flag delivered consequential artifacts, Releases and skills that cannot be recalled;
7. require compensating transition, reopen or explicit named-human revalidation where current lifecycle state was affected;
8. emit one terminal repair receipt for every known dependency;
9. prove that no eligible current projection or action path retains superseded authority.

Facts about purpose, decisions, value, taste or judgement must use the exact G13 source, atomic assertion, Brain item/version and learning-proposal contracts, or a separately proved lossless adapter. A source fact or signed assertion cannot automatically become accepted Brain knowledge.

## The invisible human experience

None of this vocabulary appears on the default customer surface.

1. CTRL verifies every mechanical fact quietly.
2. It resolves administrative gaps itself or routes them to Krish.
3. If a normative answer could materially change the decision, it asks one concrete question.
4. The natural control, `unknown` route and optional depth stay together with the question.
5. The person can see what their answer changes before granting consequential authority.
6. Technical provenance and repair history remain available one layer deeper.

Examples:

- Customer: “What result would make another month worth it?”
- Krish: “The permission is current. Thursday's session needs one decision: what result would justify continuing?”
- Hold: “The access agreement expired yesterday. I have asked Krish to renew it, so you do not need to do anything.”

The later rendered gate must freeze representative `indeterminate` cases for all thirteen variants and prove one answerable question at a time, no administrative questions, no checklist, no technical labels and an honest unknown/free-expression route.

## Modular conveyor belt

| Module | One responsibility | Forbidden |
|---|---|---|
| source adapters | expose canonical source facts and semantic profiles | selecting a transition result |
| set-completeness verifier | prove authoritative universe, query, head and sealed membership | interpreting human prose |
| transition assemblers | build one exact discriminated bundle | accepting caller-selected schemas or authority |
| semantic authority verifier | prove source meaning, scope and fact-kind authority | promoting proposals into Brain truth |
| deterministic predicates | return typed dependency dispositions and tri-state result | I/O, LLM calls or writes |
| human authority verifier | validate exact named-human transition authority | deciding factual satisfaction |
| gap prioritizer | select at most one consequential human-answerable gap | asking for system-verifiable administration |
| gap explainer | render the approved question atom in plain language | inventing missing meaning or route effects |
| correction invalidator | traverse every dependency and produce repair obligations | deleting or rewriting history |
| transaction coordinator | atomically join proof, authority and transition receipt | widening any specialist result |

Each module has a narrow machine contract, fixtures and independent judge history. The orchestrator routes immutable outputs and may not reinterpret them.

## Required adversarial proofs before implementation

- an unseen existing lifecycle head blocks `open_preparation`;
- an omitted, duplicated, inserted or stale grant member prevents `satisfied`;
- a missing continuation checkpoint yields `indeterminate`;
- a swapped subject, audience, case, purpose or predecessor is rejected;
- expiry between evaluation and commit aborts;
- a reused nonce, revoked key or wrong issuer-to-fact-kind assertion is rejected;
- an external assertion cannot defeat a contradictory current canonical record;
- an external fact changes after verification but before local commit;
- consent or permission is withdrawn while the assertion and signing key remain valid;
- the fact-revocation epoch advances without key revocation;
- two concurrent CTRL transactions try to consume the same external token;
- the external step succeeds but the local transaction rolls back;
- the local commit succeeds but issuer acknowledgement is lost;
- clock skew places commit exactly on the validity boundary;
- conflicting internal and external records cannot choose authority dynamically;
- resume cannot reuse an expired or revoked old grant;
- a missing, duplicated or substituted close-obligation kind yields `indeterminate`;
- a workload receipt cannot replace named-human authority;
- authority for an earlier bundle or hidden consequence cannot be reused;
- correction of consumed evidence challenges current steering and produces complete repair receipts;
- no pending or delivered dependent artifact silently retains superseded authority;
- orchestrator and receipt writer cannot convert `unsatisfied` or `indeterminate` into success;
- for every variant, the system never asks the leader for `server_verify_only` data;
- every human-answerable option demonstrably selects, stops, bounds or materially reshapes the accepted decision.

## Mandatory next-contract gates

The all-seven-role R74 panel pass carries these requirements into the next machine-contract gate:

1. define exact external-coordination states such as `reserved`, `external_confirmed`, `local_committed_pending_ack`, `finalized`, `aborted` and `quarantined`;
2. keep every non-final coordination state structurally non-steering;
3. distinguish finalization from acknowledgement per external protocol;
4. enforce the strict validity boundary `transaction_time + maximum_clock_skew < valid_until`;
5. forbid immutable leases for any fact kind whose issuer cannot genuinely prevent unobservable mid-lease withdrawal; current human consent and permission require commit-time conditional verification, while a completed signature-envelope event proves only that historical event;
6. bind leases and consumed tokens to the reservation, nonce, exact transition and exact visible consequence;
7. freeze crash, retry, rollback, duplicate, timeout and lost-acknowledgement fixtures at every coordination step;
8. prove every derived fact's authority, purpose, audience, consequence and validity are no wider than the intersection of its inputs;
9. prove multiple missing human facts do not become serial interrogation and instead route to a safe hold or Krish-led session;
10. prove every claimed answer effect changes the accepted consequential decision, not merely an engagement lifecycle flag.

These are blocking acceptance tests for the machine contract, not optional implementation notes.
## Locked-revision boundary

Immutable panel-cleared baseline: R74 commit `37d0b7602265d52306b352cdab2a44d5642c0518`, tree `337b605a5afe5abf41d0e3a43273c08bb02446c8`.

Declared revision: correct the R74 self-reference, add the R74 panel verdict and make its ten carry-forward requirements explicit; update only canonical next-action pointers, review ledger and verification assertions. R70, R71 receipt files, R72, R73, R74, evaluator source, contracts, schemas, migrations, product UI and deployment state remain unchanged.

## Authority and next gate

R75 is the panel-cleared founder decision surface only. It authorizes no machine contract, evaluator semantics, result or evidence production, runtime connection, database write, UI change, deployment or external action.

If the founder approves this model, the next gate is a versioned machine contract for authority species, shared primitives, thirteen variants, complete selection proofs, reason algebra, atomic coordinator inputs and the adversarial fixtures above. Independent semantic, lifecycle, agency and implementation review must pass before any evaluator implementation.
