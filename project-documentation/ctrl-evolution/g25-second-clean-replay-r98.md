# G25 second clean replay R98

**Status:** The second isolated clean replay passed on the founder-authorized reused `legibility` Supabase project. The application database is reproducible. Full hosted recovery is still incomplete because cron commands, Edge Functions and Vault remain deliberately closed.

## What changed

The supplied project was separate from production and contained a retired backend. Its exact observed shape was checked before any destructive action: twenty public tables, two views, two sequences, eleven routines, four Auth users, two cron jobs and twelve migration records. Storage, Edge Functions, Vault and application Realtime membership were empty.

The one-time cleanup refused to run unless those counts and identity tables matched. It removed the retired public schema, Auth users, cron state and old migration history, then verified a blank application state. That removal is not recoverable from this repository. Recovery would depend on any Supabase backup that predated the cleanup.

No new paid Supabase project was created, so this replay added no new project-level monthly cost.

## What replay two proved

The R97 packet was executed stage by stage on the cleaned target. One normalization stage was added after the R81 baseline: it restores the standard `PUBLIC USAGE` grant on schema `public` without copying platform-owned extension ACLs from an older Supabase image.

The resulting application-owned schema is byte-stable at the level the application controls. Eleven canonical domains match the first isolated rehearsal with zero differences. The final target also verifies:

- eight of eight required extensions in the required schemas;
- seven of seven hardened function definitions and privileges;
- five Storage buckets and twelve exact Storage policies;
- three application Realtime memberships;
- zero Auth users and zero profiles after all proofs.

## Why the fingerprint changed from R81

R81 accidentally mixed application state with platform implementation state. It deparsed defaults using the session search path and counted 118 extension-owned public routines and their provider-default ACLs. Those values can differ between valid Supabase platform images even when the application is identical.

R98 fixes the measurement rather than disguising the difference. It clears the search path before deparsing and excludes extension-owned routines from the application fingerprint. Those routines are governed separately by the R94 application-surface runtime proof. Application-owned routine privileges are still fingerprinted and fail closed.

## Real runtime evidence

The replay was not accepted from catalog hashes alone.

- Real anonymous and signed-in HTTP calls passed through Auth and PostgREST. Owned reads and mutations worked. Cross-subject access failed or returned the defined safe false result. Storage readback showed that only the owned fact and decision changed.
- `pg_cron` scheduled and removed harmless jobs by name and ID.
- `pg_net` enqueued a credential-free loopback request, the worker consumed it and wrote the expected connection-error receipt.
- `vector` ranked exact and orthogonal 1,536-dimensional Brain facts correctly through the restored application function.
- The critical application smoke passed current-only Brain export, qualified Brain context, decision ownership and briefing-feedback learning.
- Every synthetic user, identity, session, profile, role, fact, event, decision, cron job, network request and probe table was removed.

## Honest remaining boundary

This closes the second clean application replay. It does not close full non-schema recovery.

Six production schedules still lack reviewed executable repository definitions. Sixty-eight active production Edge Functions are live-only. One of two Vault identities remains unresolved, and no secret value has been retrieved. Those lanes stay closed rather than being guessed or copied unsafely.

Production was not changed. No function was deployed. Nothing was merged, cut over, released or retired.
