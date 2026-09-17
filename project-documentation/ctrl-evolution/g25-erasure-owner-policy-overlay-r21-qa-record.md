# G25 erasure owner-policy overlay R21 QA record

Status: deterministic overlay pass, schema execution blocked.

## Verified

- The base R18 registry and R20 planner bytes match the pinned SHA-256 hashes.
- Exactly four R18 `owner_scope_unresolved` entries exist.
- R21 overrides each one exactly once with identical relation, constraint and column identity.
- The effective registry contains zero unresolved owner-policy entries.
- All four replacements remain explicit schema blockers.
- The two independent anti-revival retention blockers remain present.
- The effective execution gate remains blocked.

## Not verified

- A safe non-cascading owner or custody schema.
- Re-encryption or immutable historical attribution during transfer.
- Multi-identity database behavior, concurrent transfer or recovery.
- Any linked database, runtime, deployment or customer-facing behavior.

No migration, database call, auth-user deletion, automatic transfer, customer closure, deployment, merge or release is authorised.
