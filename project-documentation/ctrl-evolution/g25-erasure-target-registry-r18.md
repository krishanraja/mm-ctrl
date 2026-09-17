# G25 erasure-target registry, R18

Status: `canary_registry_complete_execution_blocked`

Machine registry: [g25-erasure-target-registry-r18.json](g25-erasure-target-registry-r18.json)

## The result

Every one of the 28 constraints discovered across the eleven R17 canary relations now has one explicit classification, constrained-column signature and reason. The registry fails if a discovered constraint is missing, if a stale entry survives after schema change, or if the columns behind a known constraint drift.

This is more precise than a table deletion list. `brain_sources`, for example, has four different meanings:

- `subject_id` identifies whose Brain the source belongs to;
- `workspace_id` makes it follow an independently authorised workspace scope;
- `actor_user_id` records who spoke or acted;
- `created_by` records who captured it.

Deleting the entire row merely because an operator appears in `created_by` would destroy somebody else's Brain data. R18 instead classifies those actor fields for redaction while preserving the subject-owned row.

## Why execution remains blocked

Six constraint decisions remain genuinely unresolved:

- Four `owner_id` paths need a transfer, closure and orphan policy. An operator deleting their own account must not silently delete customer Brains.
- The subject and workspace paths on the prepared-erasure tombstone need a documented retention and re-consent policy. Deleting the tombstone may allow silent revival; retaining it indefinitely may retain personal data without a justified duration.

The registry cannot become execution-ready while either class remains unresolved.

## Boundary

R18 covers the local canonical-and-prepared-Brain canary only. It does not yet cover the complete legacy schema, tables without foreign keys, storage, providers, logs, backups or customer-controlled exports. It performs no deletion and is not a migration.
