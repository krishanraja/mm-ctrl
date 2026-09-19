# G25 recovery first blank replay R81

**Status:** One isolated blank replay matches production exactly at the application-schema level. The second clean replay, non-schema recovery and production choice remain gated.

## What is now real

The production application schema is no longer trapped only in a broken migration history. A schema-only baseline now captures `public`, `private` and `ctrl_discovery` without customer rows. It replayed successfully into the already approved blank Supabase project.

The R81 probe compares definitions inside PostgreSQL and returns only counts and digests. All eleven domains match production exactly: columns, constraints, indexes, policies, RLS flags, routines, views, triggers, table grants, routine grants and schema grants. The replay contains 176 application tables, two sequences and an estimated zero application rows.

Production was read only throughout.

## The grant defect that would have been easy to miss

A fresh Supabase project gives newly restored objects default privileges that are not necessarily the same as production. The first restore therefore looked structurally correct while its grants differed.

The baseline now removes the fresh-project defaults for `anon`, `authenticated` and `service_role`, then replays the captured ACLs. One owned sequence needed a narrower correction: production gives `postgres` only `USAGE`, while a newly created owned sequence begins with broader owner privileges. The baseline revokes those defaults and restores the single production grant.

After that repair, every grant fingerprint is exact. The repair is intentionally narrow. It does not turn a broad permission rewrite into part of recovery.

## Exact schema is not the same as a healthy backend

The first replay also exposed two separate classes of work that parity must not hide.

First, Supabase now installs current default extension versions even when an older version is requested. Production uses `pg_cron` 1.6, `pg_net` 0.14.0 and `vector` 0.8.0. The blank project installed 1.6.4, 0.20.4 and 0.8.2. The application fingerprints still match, but runtime compatibility has not been proved.

Second, the restored production schema reproduces existing advisor findings. The most consequential are 41 anonymously executable and 45 authenticated-user executable `SECURITY DEFINER` functions. Exact recovery proves fidelity, not safety. Those routes require disposition before any clean-project cutover is credible.

## Why recovery is not yet closed

R77 requires two clean blank replays. Only one is complete. A second hosted project or a destructive reset of the current rehearsal target is a separately gated cloud action, so this record does not fabricate the second pass.

The baseline also deliberately excludes Auth and Storage rows, extension behavior, custom roles, cron commands, Vault values, Realtime settings, Edge Functions, secrets and external providers. R79 and R80 remain the governing manifests for those lanes.

The next safe work is local and read only: turn the extension drift and advisor findings into explicit smoke and security-disposition gates, then prepare the exact second-replay packet. Production rebaseline, clean-project cutover, customer data movement and retirement remain closed.

## Current-source check

Supabase's current migration guidance still requires version-controlled migrations and reset or replay proof. Its July 2026 breaking-change notice says explicit extension version pinning is deprecated and current defaults are installed instead. R81 therefore records extension versions as observed prerequisites and requires behavior proof rather than pretending the old versions can still be selected.
