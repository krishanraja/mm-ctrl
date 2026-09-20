# G25 isolated operator catalogue, R126 QA

## Read-only proof

- The repository link matched isolated project `cgkcplcamsijghalintq` and did not match production `bkyuxvschuwngtcdhsyg`.
- `brain_workspaces`, `brain_workspace_roles`, `brain_audience_grants` and `standard_change_review_packets` were present.
- Workspace lifecycle, role grant time and audience expiry columns were present.
- The R123 owner-private V4 queue RPC was present.
- Stable operator principals, operator auth links, Brain access receipts, operator projection columns and the operator review RPC were absent.
- The generated catalogue fingerprint was `ff88d71b7510cda2dd53765f03b34f8331698bc3d5ef38838d76cb63bf55b350`.
- The inspection made zero database writes.

## Tooling note

The first attempt to use schema dump could not run because the local machine has neither Docker nor Podman. The zero-byte scratch target contains no schema or credential content. Supabase type generation provided the required read-only catalogue surface without Docker. The reusable probe validates the isolated project ref before every run and emits no credential material.

## Remaining gate

R126 proves current catalogue shape, not a migration. R127 must remain additive, use the existing authority tables, preserve owner-only legacy packets and prove zero fixture residue in isolated Supabase before any later product wiring.
