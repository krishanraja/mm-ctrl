# G25 migration lineage recovery R77 QA record

## Read-only evidence

- `supabase migration list --project-ref` returned 299 comparison rows: six timestamps on both sides, 164 local-only and 129 remote-only.
- Git contains 170 migration files and 169 distinct timestamp prefixes.
- `20260602000000_create_audit_infrastructure.sql` and `20260602000000_decision_engine.sql` share one migration identity.
- Normalised content hashes found 35 remote statements under different local timestamps, 100 remote statements with no exact local content and 135 local files with no exact remote content.
- All six shared timestamp rows differ in stored bytes. At `20260513000000`, production records only `-- applied via dashboard` while Git holds `20260513000000_generated_artifacts.sql`.
- Production has 135 migration rows, all with a stored statement. None creates `backup_workshop_sessions`; one references it.
- The live public schema currently exposes 171 base tables, six views, 178 routines, 304 policies, 571 indexes and 710 constraints. These are inventory counts, not proof of correctness.

## Failed capture attempt

`supabase db dump` was attempted read-only. It stopped before connecting because neither Docker, Podman nor `pg_dump` is installed. The zero-byte scratch output was verified and removed. No package or runtime was installed as an unreviewed workaround.

## Documentation cross-check

Current Supabase documentation confirms that migration identity is timestamp-based, direct remote changes bypass migration history, `migration repair` changes tracking only and does not execute SQL, and squash omits data statements such as cron jobs, Storage buckets and Vault secrets. Supabase Branching executes migrations sequentially, so an earlier failure prevents later repair SQL from running.

## Verdict

The defect is systemic lineage drift. A one-table hotfix, local historical edit or bulk history repair would be unsafe. Build and prove a clean baseline outside production first. Production mutation, another billed environment, deployment and cutover remain separately gated.
