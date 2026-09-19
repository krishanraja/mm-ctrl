# G25 provider erasure review plan R61

Status: provider follow-up planning proved. Execution closed.

R61 turns provider receipt metadata into honest deletion, expiry and residual-copy follow-up. The planner consumes only provider, processor kind, control mode, latest lifecycle event and whether a separate deletion handle exists. It never receives raw provider identity or content and every result has `execution_authority: none`.

## The important distinction

The receipt registry stores a provider-scoped HMAC of the provider request ID. That can prove two observations refer to the same provider object, but it cannot recover the object ID needed to ask a provider to delete it. The receipt should remain content-free. Operational deletion needs a separate encrypted, provider-scoped and short-lived handle, or an immediate durable deletion job created while the raw ID is available.

## Provider behavior

- Model routes with verified zero retention must still prove the active control before recording expiry.
- Default model retention becomes a dated policy-expiry plan, never immediate deletion.
- Non-ZDR ElevenLabs generations can draft operational deletion only when a separate deletion handle exists.
- Resend expiry is separate from the recipient and receiving-provider copy that cannot be recalled.
- Research routes retain their public-query boundary; fixed public fetches do not invent subject deletion work.
- Unknown configured destinations remain blocked.
- Unknown outcomes and verification failures remain held.

## Lifecycle defect

Stripe can operationally delete a customer while retaining a regulated payment shell or record. R49 makes `operationally_deleted` and `residual_retention` mutually exclusive terminal events, so it cannot state both truths. R61 refuses to plan Stripe completion until the lifecycle represents orthogonal operational closure and residual retention. The same scrutiny catches `verification_failed`: it is terminal in R49 but cannot mean the erasure is complete.

No provider call, event append, database write, live route edit, migration, deployment, merge or release is performed by R61.
