# G25 provider deletion hosted Supabase proof R76

**Status:** The isolated hosted candidate path works after one narrow repair. Production integration remains blocked by irreproducible historical migrations.

## What the hosted environment revealed

The data-less Supabase branch did not reach a healthy current schema. Replay stopped at historical migration `20251209014653` because it runs `ALTER TABLE backup_workshop_sessions ENABLE ROW LEVEL SECURITY` even though no earlier replayable migration creates that table. The production database contains the table as out-of-band state. That makes production operational but not reproducible from its migration ledger.

No R76 candidate caused that failure. It happened before the current chain ran.

The failed branch still provided an isolated hosted PostgreSQL, Auth, Vault and Data API environment. R76 installed an explicitly labelled verification-only foundation, then applied the exact dormant candidate chain needed by R23 and R49 through R75. This does not convert the fixture into a production migration or disguise the replay failure.

## The defect found and repaired

The first real Vault-backed R68 call failed safely. R68 declared a PL/pgSQL variable named `key_id`; Supabase Vault's `decrypted_secrets` view also exposes a `key_id` column. Hosted PostgreSQL therefore treated the secret lookup as ambiguous. PGlite could not reveal this because the R68 Supabase Vault function was pinned but unexecuted there.

R76 preserves R68 as evidence and replaces only the verifier with the same contract and a non-colliding variable named `authority_key_id`. Execute privileges remain closed. The internal verifier is still unavailable to the writer and worker roles; only their operation-specific verified wrappers are executable.

## What passed in hosted Supabase

- A Vault-held random verification key authenticated a compact authority token.
- The crypto-writer role registered one encrypted provider deletion handle through the verified wrapper.
- A one-character signature corruption was rejected and produced no second handle or authority spend.
- The issuer and worker roles wrote a dispatched, failed and dead-lettered lifecycle only through their allowed functions.
- Neither custom role had direct table access.
- An authenticated workspace operator without current custody was denied with no event or projection change.
- The current custodian requested recovery.
- Customer-authorised custody transfer removed recovery authority from the former operator and admitted the replacement without moving the Brain.
- Four synthetic users were created through hosted Supabase Auth.
- A real outsider JWT sent through the hosted Data API was denied.
- A real replacement-custodian JWT was admitted.
- After deny-all RLS policies and missing provider-chain indexes were added, the same real JWT completed the recovery link.

The public Data API wrapper exists only in the disposable probe file. It is not a proposed product API and must never ship.

After the evidence was captured, the disposable branch was deleted through the authenticated Supabase CLI and a fresh branch listing showed only `main`. Its measured lifetime was 31.22 minutes. Straight-line cost at the approved rate is approximately `$0.006992`; `$0.01344` is the conservative one-hour ceiling if Supabase bills a minimum full hour.

## Hardening from the hosted advisors

The branch advisors identified missing deny policies and five missing covering indexes in the candidate chain. R76 adds explicit deny-all policies to the private function-only tables and the verification foundation's role tables. It also adds indexes for deletion-handle closure facts, dispatch workspace and receipt lookup, retry predecessors and event predecessors.

After the repair, the advisors no longer reported the R76 provider tables for missing policies or missing foreign-key indexes. The inherited partial historical schema still reported unrelated legacy warnings, including anonymously executable public security-definer functions. Those warnings are not made safe by R76 and reinforce the need for the already-approved clean backend retirement path.

## Honest boundary

R76 proves a hosted candidate path, not production readiness. The branch began from an incomplete historical replay, so it cannot prove whole-schema compatibility. It did not call a provider, delete an external object, use customer data, exercise a queue, prove concurrent production workers, alter production data or migration history, deploy, merge or release.

The next gate is not another local mock. It is a clean, migration-complete disposable branch produced from a repaired reproducible schema. Any repair to production migration history is a separate consequential decision and is not authorised by R76.
