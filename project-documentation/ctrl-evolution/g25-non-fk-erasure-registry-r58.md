# G25 non-FK erasure registry R58

Status: the current high-risk surface is semantically classified. Execution remains blocked.

R57 found 36 high-risk identity anchors that cannot be covered safely by following foreign keys. R58 gives each one an explicit role and action. The registry distinguishes account-owned rows, participant responses, membership, actor attribution, shared customer records and retained audits.

## What the registry changes

An identifier is no longer treated as deletion authority merely because it looks personal:

- account UUIDs can select subject-owned rows or memberships only in their declared role;
- a verified account email can cover a legacy or anonymous subject row, but not every row containing that email;
- phone numbers are erased with an already-selected booking row and can never widen the deletion;
- facilitator, organizer, referrer and referee identities require role-complete redaction inside shared records;
- publication rules survive creator erasure after attribution is removed;
- consent and security events require bounded retention and irreversible pseudonymization, not raw identity forever.

All 36 R57 high-risk anchors have exactly one registry entry. Migration-only candidates and the 116 opaque JSON containers remain visibly outside this gate.

## Defects now made explicit

The current deletion function says older leader rows are found when `leaders.email` equals the authenticated email. The executable lookup and final delete both use only `leaders.user_id`. The generated `leaders` type exposes the email but omits `user_id`, while migrations and runtime code expect it. That three-way contradiction blocks claims of complete leader erasure.

The live function also writes the account UUID and email into retained audit events during deletion. The record may have a legitimate compliance purpose, but neither that purpose nor the minimum fields and duration have been approved here. Raw identifiers cannot be described as erased while those writes remain.

## Why execution remains closed

Several account-owned rows have nullable `user_id` and a separate email. A `user_id` sweep misses anonymous or legacy rows. Participant responses can feed benchmarks or workshop synthesis and therefore require invalidation or recomputation after erasure. Shared records contain other people's or the customer's information and cannot be deleted wholesale. These are design and database-proof requirements, not reasons for a generic email sweep.

The next safe gate is an erasure-plan compiler that consumes only this registry, refuses every blocking standing, and produces a reviewable plan with zero database writes. An authoritative live catalog is still required before any execution design can be accepted.

No live deletion code, database, migration, provider, deployment, merge or release is changed by R58.
