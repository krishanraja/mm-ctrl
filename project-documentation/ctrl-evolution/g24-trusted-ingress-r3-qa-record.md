# G24 trusted canonical ingress R3 QA record

**State:** R3 contract repair candidate; deterministic exact-byte checks implemented for local freeze; independent review pending

## Repair summary

- Authentication now supports human sessions and workload identities without persisting raw credentials.
- Eleven exact operation intents include typed fields, closed enums, optional-absence rules and answer-value discrimination.
- The operator can propose a transcription repair but cannot rewrite a leader-owned answer.
- Exact committed result bytes or an immutable result reference are stored for restart-safe replay.
- Authorised responses carry the exact canonical result payload bytes, while private storage retains the encrypted immutable copy.
- Every replay, including read-only, rechecks current access before returning protected bytes.
- Snapshot fingerprinting and final compare-and-swap share the same ten named set seals, including the canonical evaluator registry.
- Build-time evaluator attestation must exactly match the active evaluator registry member before any kernel evaluation.
- Canonical byte and domain-separation rules make fingerprints and set seals deterministic.
- A transaction-local proof registry prevents an aborted database transaction from leaking issuance, collision or terminal state through process memory.
- The proof bridge now has exact common inputs, per-family extensions, outputs and a browser-exclusion obligation.
- The outbox uses atomic claims, leases and fencing tokens, with an explicit crash rule for providers lacking idempotency.
- Machine-readable byte counting, hold-code mapping and deterministic limit order close R2's limit ambiguity.
- The contract explicitly stops at the verified kernel seam and does not claim the complete final-call or Brain-learning loop.

## Honest limits

No code, endpoint, database function, schema, role, outbox, provider call, customer data path or runtime connection implements R3. Exact independent review remains blocking before any local adapter contract opens.
