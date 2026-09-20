# G24 trusted canonical ingress R50 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R50 materialization from frozen R49: passed
- Focused R50 checker: passed with 25 mutation probes
- Operations: 15
- Persisted request schemas: 15
- Persisted target-intent schemas: 15
- Persisted proof schemas: 4
- Persisted result variants: 90
- Committed target stores: 6
- Content-addressed stores: 133
- Persisted wrapper schemas: 133
- Executable schema-qualified identity kinds: 450
- Full-schema reference classifications: 777
- Executable typed equality rows: 777
- Final-role-store exact-one references: 154
- Mechanically generated correlations: 462
- Final-state semantic-reference occurrences: 13,766
- Full runtime-semantic authority manifest: 229 rows
- Deterministic Ed25519 signatures verified: 2 of 2
- R50 machine SHA-256: `25133f8ef3de92c89ec4dfff4afb167f6591775e4fca765833d3930867bb3a99`
- Visible surface changes: none
- External actions: none

Focused mutation coverage includes domain laundering of each raw content-address formula, missing wrapper identity coverage, a false executable-formula result, issuer signature and evaluator key substitution, proof, authority-row, read-set and projection fingerprint splices, nonce-subject and verifier-identity formula substitutions, proof expiry at the commit boundary, missing or weakened complete-schema classification, incomplete typed equality and companion coverage, removed target-intent fingerprint authority, stale selected resolution or correlation evidence, a post-snapshot schema-change mutation, manifest content and graph substitution and a missing exact semantic target.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
