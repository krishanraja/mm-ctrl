# G25 operator review access PostgreSQL candidate, R125 QA

## Passed locally

- PostgreSQL 18.3 WASM applied the additive candidate over a minimal faithful schema.
- One authenticated operator with the exact stable identity, workspace role and finite audience-purpose grant received the oldest of two ready reviews in the selected workspace.
- A ready review in another authorized workspace did not affect count or selection.
- The response contained exactly five projection fields and no raw packet, evidence, criteria, hashes or private Brain items.
- The allowed receipt contained five returned-field names and its stored SHA-256 matched a fresh computation over the stored canonical payload.
- Revoking the grant made the next request fail immediately and wrote a second denied receipt with no returned fields.
- Direct authenticated receipt update and delete both failed.
- Fourteen distinct authority, scope, expiry, integrity and owner-route failures produced the same public denial and exact private receipts.
- Removing only the grant-purpose predicate caused the wrong-purpose case to be admitted, so the negative control failed as required.
- Every in-memory database closed after its case. No linked or production database was used.

## Repair during verification

The first local run tried to load `pgcrypto`, which is not bundled in the pinned WASM runtime. The harness was corrected to use PostgreSQL 18's core SHA-256 function while the candidate continued calling the existing application hash function. The next run then found a harness-only multi-command prepared statement; the two inserts were separated. The complete matrix passed after those repairs. Neither failure reached a database outside the disposable in-memory harness.

## Still unproved

- the exact isolated Supabase catalogue and stable-operator runtime dependency;
- migration application, PostgREST and Edge transport;
- concurrency between revocation and an in-flight read;
- receipt retention and customer-facing audit visibility;
- packet-creation binding for new real reviews;
- any rendered operator or customer experience;
- production, merge, release or legacy retirement.
