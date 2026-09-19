# G25 second blank replay packet R97

**Status:** The exact second-replay packet is prepared and locally sealed. Execution remains cost-gated because a second genuinely blank hosted target does not yet exist.

## What this packet fixes

The first clean rehearsal proved that the application schema could be recovered exactly. It did not prove that a future recovery would consistently land on the safer state created after that rehearsal.

R97 closes that ambiguity. The packet starts with the eight required platform extensions in their exact schemas, restores the row-free R81 application baseline, adds the missing Auth trigger, applies the reviewed execution-privilege repairs, then advances through the R89, R90 and R91 caller-bound hardening stages. A dedicated convergence stage accepts only that exact intermediate state and lands the seven corrected R92 function definitions and ACLs.

The result is deterministic in three independent ways:

- every mutation, preflight and verification file has a frozen SHA-256 digest;
- every stage has one fixed position and must be verified before the next begins;
- the final database must match eleven hardened application fingerprints plus compact extension, function, Storage, Realtime and row-count checks.

## Why R92 is not replayed directly

The production hotfix file has a production-state preflight. Replaying it after R89 through R91 would correctly reject because those earlier stages have already changed the same functions.

R97 therefore contains a narrow convergence file. Its preflight recognizes only the exact R89, R90 and R91 definitions and ACLs. Its payload is the exact final R92 payload. A transactional rehearsal moved the first isolated target back through those intermediate definitions, applied the convergence stage, proved all seven final definitions, then rolled the entire rehearsal back. The target remained on the tested R92 state.

## Extension rule

Supabase no longer guarantees installation of requested historical extension versions. The packet therefore preserves schemas, uses current hosted defaults, and relies only on behavior proved by R94. `pg_cron`, `pg_net`, `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp` and `vector` are all named explicitly. The first isolated target currently verifies all eight in their required schemas.

## What is included after the database schema

The secret-free R96 safe plane is stage nine: five exact Storage buckets, twelve exact Storage policies and three application Realtime memberships. It must pass its own empty-target preflight before it is applied.

Cron, Edge Functions and Vault remain outside the executable packet. Six schedules still lack repository definitions, 68 active production functions are live-only, and one of two Vault identities is unresolved. R97 does not guess commands, publish raw live source or retrieve secrets to create the appearance of completeness.

## Execution boundary

The packet is ready to use, but it has not been run on a second blank hosted target. Creating a project incurs a separately confirmed cost. Destructively resetting the existing rehearsal target would remove valuable proof state and also requires explicit authority.

When that gate is opened, the operator must run each stage separately in ascending order, execute its verification immediately, compare all eleven final fingerprints, rerun the R93 transport proof, R94 extension runtime proof and R95 critical application smoke, then prove all fixtures were removed. Any mismatch stops the replay.

This packet authorizes no production write, customer data movement, deployment, merge, cutover, release or legacy retirement.
