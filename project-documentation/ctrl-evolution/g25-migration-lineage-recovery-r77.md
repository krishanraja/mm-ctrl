# G25 migration lineage recovery R77

**Status:** Read-only audit complete. The recovery design is ready; production execution is not authorised.

## The real defect

The R76 branch failure is not one missing table. Production and Git have become two different histories:

- Git contains 170 migration files but only 169 distinct timestamps.
- Production contains 135 recorded migrations.
- Only six timestamps appear on both sides, and their stored bytes are not identical.
- 164 versions exist only in Git; 129 exist only in production.
- Thirty-five remote migrations do have byte-equivalent local content, but under different timestamps.
- One shared version, `20260513000000`, contains only `-- applied via dashboard` remotely while Git contains a real schema migration at that timestamp.

The first branch replay failure is only the first visible consequence. Remote history references `backup_workshop_sessions` once and never creates it, even though the table exists in production. A forward patch cannot fix an earlier replay step because it will never be reached.

## Why the obvious fixes are unsafe

Changing the local historical SQL does not change the statement already stored in Supabase migration history. Marking hundreds of rows applied or reverted would change history without proving that their effects match production. Adding `CREATE TABLE IF NOT EXISTS backup_workshop_sessions` at the end would still run after the failure. Fixing just this table would turn branch creation into a slow search for the next hidden dependency.

The repository also contains two different files with timestamp `20260602000000`. Timestamp identity is how Supabase decides whether a migration ran, so both cannot remain in one trustworthy lineage.

## Recovery route

1. Freeze direct production schema changes during capture.
2. Capture a schema-only production baseline. Record roles, grants, extensions, Storage configuration, scheduled jobs and symbolic Vault dependencies separately because a schema squash does not preserve all of them.
3. Reconcile that baseline against application references and the intended local-only migrations. Do not assume either side is wholly correct.
4. Apply the baseline in a blank isolated environment that does not inherit the broken production history.
5. Run two clean replays. Compare required tables, columns, constraints, indexes, RLS, policies, grants and routines, then exercise the product's authentication and critical data paths.
6. Only after that proof, choose between an in-place production rebaseline and a clean-project cutover. Both require a verified backup, rollback steps, cost and action-time approval.

The clean-project route is likely to be easier to reason about if the old backend is being retired anyway, but it must not be selected before Auth, Storage, scheduled jobs, Edge Functions, secrets, customer data and rollback are mapped. The in-place route has less application cutover work but a much more dangerous history mutation.

## Current tool boundary

The installed Supabase CLI can query production safely, but schema dumping requires Docker, Podman or a compatible `pg_dump`; none is installed on this machine. No package was installed and no production state was changed to work around that. The next rehearsal therefore needs either a reviewed local database toolchain or a separately approved blank hosted project. Another ordinary branch is insufficient because it inherits the broken lineage.

## Acceptance bar

Recovery is not complete until the same baseline reaches a clean database twice, the required schema diff is zero, no policy or grant difference is unexplained, application smoke paths pass and a fresh Supabase branch can be created without a verification-only foundation.

This audit used read-only production metadata. It did not edit the migration ledger, schema, data, Auth, Storage, secrets, functions or branch state.
