# G25 provider deletion human operator session R74

**Status:** Human recovery is locally bound to a real active workspace operator. Hosted session and stable-custody integration remain unproved.

## Why R73 was not enough

R73 correctly separated operator recovery from issuer, writer and worker powers, but its dormant SQL granted recovery to a database role without proving which human was acting for which workspace. If deployed unchanged, possession of that role and a dispatch UUID would have been enough to mutate a recovery chain.

R74 removes that machine-shaped shortcut. The recovery function now requires all of the following:

- a current authenticated user ID;
- a non-anonymous session claim;
- an active `operator` role on the dispatch's exact workspace;
- the same strict R71 recovery transition and event-chain rules.

The former `provider_deletion_operator` role and `service_role` have no execute permission. Revoking the workspace role removes recovery authority immediately.

## Product meaning

Automatic machinery may retry only within its bounded policy. Once work is dead-lettered, recovery belongs to an identifiable, accountable person acting within the customer's current workspace authority. That keeps an operational exception from quietly becoming a backdoor machine power.

## What this does not claim

The local harness simulates `auth.uid()` and JWT claims inside one PGlite process. It does not prove hosted Supabase Auth, PostgREST role switching, independent sessions, production row-level security or the R23 stable operator and transferable custody chain. The current workspace role is an interim executable authority, not the final stable-custody integration. The SQL remains a dormant candidate, not a migration.

## Bounded result

Four focused tests pass. They prove successful recovery for an active operator and denial for missing, anonymous, outsider, revoked, machine-role and service-role callers. No linked database, credential, provider or deployment changed.
