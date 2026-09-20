# G24 trusted canonical ingress R41 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R41 materialization from frozen R40: passed
- Focused R41 contract checker: passed with 21 contract mutation probes
- Owned immutable snapshot rejection probes: passed, 19 of 19
- Exact schema validation: passed for all 7 stored registry and hold artifacts
- Durable restart reconstruction: passed for all 4 branch classes
- Explicit semantic-reference occurrence bijection: passed for all 2,035 occurrences
- Self-sealed runtime-semantic authority manifest: passed with 206 rows
- R41 machine SHA-256: `d9631f1a458ec635a594a90066f6efb7a6449bd3840490b54c80b51398e865f2`
- Exact founder lock: passed
- Locked headless Crossing kernel: passed, 211 of 211 checks
- Full documentation chain: passed through R41
- Diff and frozen R6 through R40 immutability: passed

Mutation coverage includes mutable-source check/use stability; proxies and throwing reflection; getters, accessors and non-enumerable properties; symbol keys and values; sparse and extended arrays; cycles and unsupported prototypes or values; non-finite numbers, negative zero and invalid Unicode; stale compound and wildcard pseudo-references; schema-invalid enums, hashes and extra fields; operation-target mismatch; reused operation identity; fabricated row reference; bytes, fingerprint, selection and proof-family splicing; incomplete or altered reference registry; manifest content and graph drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
