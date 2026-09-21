# G25 consequential-work migration, R145

Status: `isolated_migration_replayed_twice_persisted_empty`

Date: 21 September 2026

R145 turns the accepted R142 decision spine into deployable database state without changing one byte of the independently reviewed SQL payload.

## What is now real

- `20260921100000_consequential_work_spine.sql` is byte-identical to the accepted R142 candidate.
- The migration was applied twice to the isolated Supabase project `cgkcplcamsijghalintq`.
- The first application ran the complete 94-control transactional canary, then the exact rollback removed all 14 tables, 33 routine signatures, 49 triggers, two shared indexes and its migration-history row.
- The zero-residue readback passed before the second application.
- The second application ran the same canary and produced the same catalogue hash as the first.
- The final isolated state is deliberately empty but persistent: 14 forced-RLS tables, 33 routine signatures and 49 triggers, with no candidate rows.
- Ordinary browser roles have no table privileges and cannot execute the seal RPC. Only `service_role` can use the private storage boundary.
- The production project `bkyuxvschuwngtcdhsyg` was not contacted.

## Why this reduces release risk

The product no longer depends on a large candidate file that exists only in a test harness. The exact accepted bytes can be installed, removed without residue and installed again deterministically. The Brain now has a stable non-production home for the next release step: narrow authenticated service entrypoints.

## What this does not claim

This is not a public API, authenticated customer writer, operator projection or production release. The isolated project still has migration-lineage reconciliation work outside this one new migration, so ordinary bulk `db push` remains inappropriate. Production, merge, cutover, customer data and legacy retirement remain closed.

## Next release step

Expose the smallest authenticated service boundary for one real pilot path: create the subject/case, stage grounded evidence and a human prior, seal one version, answer one highest-value question, record the leader-owned call and later outcome. Raw tables remain closed.
