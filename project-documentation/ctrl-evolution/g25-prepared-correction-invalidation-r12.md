# G25 prepared-receipt correction invalidation, R12

Status: `postgresql_wasm_atomic_correction_invalidation_pass_erasure_pending`

Machine record: [g25-prepared-correction-invalidation-r12.json](g25-prepared-correction-invalidation-r12.json)

## What is now real

R12 closes the most dangerous failure mode of a living Brain: correcting the source while an old derived conclusion continues to look current.

One payload-free correction receipt binds an affected authority record to a replacement that R11 independently confirms is current in the exact workspace, owner, subject, audience and purpose. Every active prepared receipt that depended on the affected record is invalidated, and every invalidation receives its own payload-free event in the same transaction. Unrelated receipts are untouched.

The replacement can be a different row ID. This matters because a corrected Brain item should normally become a new immutable version, not an in-place rewrite of history.

## Failure is atomic

The proof deliberately makes the final event insert fail. PostgreSQL then leaves the prepared receipt current and removes the attempted correction receipt. There is no half-state in which the system says a correction happened but cannot account for it, or hides a receipt without an audit event.

Exact replay returns the original affected count. Reusing the same correction identity for changed material fails. A semantically identical correction arriving under a different identity converges on the first durable correction fingerprint.

## Deliberately not automatic regeneration

Invalidating a stale prepared object is not permission to invent its replacement. R12 stops the unsafe output. A new prepared object must still pass the R10 store and R11 current-authority checks.

R12 also refuses withdrawal without a replacement. The current architecture cannot independently prove withdrawal authority, so a service command alone is not enough to erase an authority dependency from the truth graph.

## Exact proof

On exact-pinned PGlite 0.5.8, PostgreSQL 18.3 proves:

- a replacement-backed correction invalidates exactly the affected receipt;
- a new immutable version row can replace an old authority row;
- unrelated prepared intelligence remains current;
- superseded authority cannot masquerade as the replacement;
- one payload-free invalidation event is written;
- exact replay is idempotent and conflicting replay fails;
- a forced event failure rolls the full operation back;
- authenticated users cannot invoke the function or update invalidation state;
- forced RLS, narrow column update permission and no service delete permission are read back;
- three weakened controls make the canary fail;
- rollback leaves zero durable fixture rows.

## Honest boundary

PGlite cannot prove a store-versus-correction race across real concurrent connections. Supabase-local and PostgREST parity remain pending. R12 is not a migration and has no runtime caller.

Invalidation also does not erase ciphertext. The next safe step is cryptographic erasure with a durable subject tombstone that prevents deleted prepared intelligence from silently reappearing.
