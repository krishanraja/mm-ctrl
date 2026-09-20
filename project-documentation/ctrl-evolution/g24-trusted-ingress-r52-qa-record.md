# G24 trusted canonical ingress R52 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R52 materialization from frozen R51: passed
- Focused R52 checker: passed with 19 mutation probes
- Fingerprint authorities declaring canonical JSON: 205 of 205 field-reference authorities and 10 of 10 other fingerprint controls
- Proof signature authorities retaining exact field encoding: 4 of 4
- Exact field-encoded Ed25519 signatures: 2 of 2
- JSON verification of those signatures: 0 of 2, as required
- Bidirectionally derived durable store shapes: 160
- Executable schema-qualified identity kinds: 550
- Executable typed equality rows: 782
- Concrete internal exact-one selectors: 374
- Internal exact-one rows with unavailable or meta target: 0
- Stored wrapper rows traversed: 54
- Selected fixture artifacts: 54
- Final-state semantic-reference occurrences: 22,101
- Pinned non-suffix semantic-reference occurrences: 305
- Full runtime-semantic authority manifest: 232 rows
- R52 machine SHA-256: `7eb9f84f042a023f3e699d2cd0487a759d32ba13da21375b363f12449dbf3840`
- Visible surface changes: none
- External actions: none

Focused mutation coverage includes fingerprint codec mismatch, codec-audit laundering, proof signature codec substitution, issuer nonce mismatch, signature replacement, omitted result, principal or replay stores, deleted identity formula, meta and placeholder selector candidates, cross-operation selector substitution, selector deletion, wrapper schema zero-match, stored-wrapper reference mutation, omitted non-suffix `then` and `source` references, weakened non-suffix vocabulary and manifest mutation.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
