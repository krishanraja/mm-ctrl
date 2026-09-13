# G24 trusted canonical ingress R4 QA record

**State:** R4 contract repair candidate; deterministic semantic and mutation checks pass locally; independent review pending

## Repair summary

- Pre-admission rejection no longer fabricates or echoes invalid operation identity.
- Durable operation states now distinguish committed success, committed hold and their exact replay forms.
- Human and workload principal schemas, current case equality and operation authority are closed.
- All thirteen lifecycle edges have exact principal and authority-receipt predicates.
- Approve, edit, hold and suppress now have distinct write sets and standing effects.
- Eleven operation payloads and eight proof-family bundles have concrete closed schemas.
- One uniquely active evaluator binds its artifact and ABI manifest bytes to exact result and proof exports.
- Set seals use unambiguous binary length framing; every operation snapshots and compare-and-swaps the same eleven sets and three scalars.
- Resolver capability carries its bundle internally and is single-use, transaction-bound and invalidated on every terminal transaction event.
- Provider idempotency is canonical sealed state; authority failure, payload drift and unknown reconciliation have exact transitions.
- Streaming raw input limits run before JSON materialisation, followed by one total order across every canonical and execution limit.
- Sixteen in-memory mutation probes confirm the checker rejects regressions across admission, approval, authority, schemas, evaluator selection, seals, resolver isolation, outbox safety and limits.

## Honest limits

No code, endpoint, database function, schema, role, proof bridge, outbox, provider call, customer data path or runtime connection implements R4. Passing deterministic checks is not independent review or production proof.
