# G24 trusted canonical ingress contract R6

**State:** fifth local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R5 candidate at `32b378582c18316ac3fb156ae82df60b3f29bb9b`

## One effective contract

R6 has no conceptual overlay and no runtime inheritance. The checked-in R6 JSON is the complete effective contract. Its deterministic generator reads the exact immutable R3 and R4 source bytes only to materialise inherited schemas, applies every R6 replacement, and emits one canonical pretty-printed document. Check mode requires byte equality between the generated output and the committed R6 JSON.

R1 through R5 remain immutable failure evidence. Their meaning is not changed by this materialisation.

## Boundary

R6 still covers only trusted ingress into the independently verified local headless-kernel seam. It does not implement or prove the leader's final call, accepted Brain learning, portable export, customer messaging, continuing relationship, intelligence, comprehension, delight or value. It authorises no UI, adapter, database object, customer data, external research, model call, external send, deployment, merge, release or old-backend deletion.

## Sixteen registered operations

Every canonical write now uses the same request admission, workspace-scoped operation ID, result envelope, current authority, serializable transaction, thirteen-set snapshot, final compare-and-swap, limits, immutable result storage and replay protocol.

The eleven R4 operations remain. Five registered operations are added: stage an intervention edit, record that the exact edit was actually presented, record the leader's lifecycle action, record the operator's lifecycle action and combine those two actions. There is no authority-minting side path.

## An edit must be seen before it can be approved

R6 removes `edit` from the approval decision. Editing is a three-moment sequence:

1. `stage_intervention_edit` appends a new immutable version with standing `staged_not_visible_not_approved`. It cannot create visibility, approval or delivery.
2. `record_intervention_visibility` runs only after the same current operator is presented the exact atom reference, version and content fingerprint. It appends one single-use visibility receipt.
3. A later `approve_intervention` may consume that exact receipt and append approval. Hold and suppress remain nonapproval branches.

The machine cannot call its own generated edit “seen,” and it cannot collapse presentation and approval into one write.

## Lifecycle consent is ordinary trusted ingress

Leader action, operator action and joint combination are registered operations. Each receives its own operation ID, intent, result, authority check, replay, limit and snapshot behavior.

Human action records use server-resolved actor identity, authority version and time. A caller nonce is unique for the case and actor. Expiry is exactly fifteen minutes after server issue time. Combination requires one unexpired current leader action and one unexpired current operator action for the same case, transition and predecessor lifecycle version. The action pair is unique and both actions are marked combined atomically. The recorder is a currently granted workload that cannot invent a human action or execute a transition. The joint receipt is consumed atomically by fresh transition execution. Historical replay checks disclosure authority and never reruns consumed execution consent.

## Replay means historical payload, not current authority

R6 retains the distinct R4 replay envelope. The original committed payload bytes, fingerprint, schema version, hold code and committed time remain exact. The envelope adds replay time, historical status and `current_standing: false`. It does not claim whole-response byte equality.

Every replay checks current authentication, case eligibility, audience eligibility and retention, then returns history without reevaluation or mutation. It does not rerun one-time execution authority. Reusing `(workspace_ref, operation_id)` with a different principal, subject, case, class, request or intent binding returns a non-mutating identity-conflict rejection without protected bytes. Serializable exhaustion has one noncommitting service-unavailable result, and the same operation ID may safely retry.

## Release invalidation has closed identity and finality

The pending projection and use result both use `projection_version_ref` as an identifier. The controlling watermark grammar has twenty required base kinds plus one additional kind for every control ID in the current sealed applicable-control closure. Base kinds use one frozen order; applicable-control kinds follow in unsigned UTF-8 order. Missing, duplicate, unknown or nonapplicable kinds hold. This preserves the architecture rule that named watermarks are a floor, not a ceiling, while keeping completeness executable. The complete set fingerprint has one framed binary preimage.

At `use_release`, a controlling-watermark difference wins before the generic snapshot hold. A concurrent change forces serializable retry, then invalidation against current state. The invalidation receipt has a domain-separated fingerprint that excludes its own fingerprint field. `(pending_projection_ref, projection_version_ref)` is unique: later attempts return the existing invalidation without another receipt or outbox. Invalidation creates no use receipt, approval, delivery or external effect. Rebuild alone grants nothing.

## Thirteen exact set seals and one snapshot

Operator and workload grants join the eleven R4 sets. Every operation snapshots and compare-and-swaps the same thirteen set seals and case-scope, engagement and plan versions. A grant mutation also advances case scope but never substitutes for the grant seal.

Every set kind has one ordered member-identity projection. Duplicate identities are invalid whether their bytes agree or conflict. Set members, set seals, snapshots, hold dependencies and scalar versions use exact domain-separated binary frames and SHA-256. MD5 and undefined “available dependency” subsets are not legal.

## Proofs carry references, not caller-chosen authority bytes

R6 removes opaque base64 proof payloads. A proof bundle is constructed only on the server from canonical rows inside the same serializable transaction. Its common object contains exact workspace, subject, case, snapshot, canonical row reference and fingerprint, predecessor tip, append ordinal, thirteen seals, provenance and evaluation time. Each of eight extensions contains closed reference-and-fingerprint fields for its family.

The resolver recomputes every referenced row fingerprint, requires every row to share the bundle scope and checks the family-specific equalities. The caller and browser can supply neither proof bundle nor resolver capability. Proof chains have exact genesis and append preimages. The bundle digest has its own exact frame. There are no future evaluator-defined decoded payload schemas left for an implementer to invent.

## Every authority-bearing fingerprint has exact bytes

Release invalidation, lifecycle action, joint lifecycle receipt, intervention visibility, outbox attempt, provider success and provider reconciliation each have a fixed ASCII domain, ordered field list, canonical field encoding, explicit absent-optional encoding and a rule excluding the fingerprint field itself. Their schemas refer to those exact fingerprint definitions.

## One request-owned limit outcome

Raw transport, parser, canonical request, intent, answer-text and note limits all complete before admission. They return exact rejection codes and create no operation row. The inherited R3 maxima are consumed only by that admission engine. State and execution limits occur after admission and commit one hold. Serialization exhaustion commits nothing. One input cannot legally produce both a rejection and a hold for the same limit.

## A reservation can dispatch only once

Provider work now has two durable gates. A worker first commits a reservation and increments the permanent attempt count. It then atomically changes that reservation from `reserved` to `dispatched` exactly once before the provider call. A dispatched reservation can never be reused.

Ordinals 1, 2 and 3 each permit exactly one dispatch and call; a fourth reservation or call is forbidden. A crash after dispatch but before or during the call makes that attempt ambiguous. Retry requires a new reservation, the same provider operation, key and payload, a current idempotency guarantee and fewer than three committed attempts. Lease and worker changes never reset the count. Confirmation requires exact provider-success evidence bound to the dispatched attempt. Unknown reconciliation can observe but never send.

## Claim boundary

R6 is a fully materialised but unimplemented local contract. Deterministic checks cannot prove Postgres or Supabase behavior, private module isolation, cryptographic deployment trust, provider behavior, intelligence, usability or value. Exact independent technical review remains blocking before a separately bounded local adapter and adversarial-fixture build may open.
