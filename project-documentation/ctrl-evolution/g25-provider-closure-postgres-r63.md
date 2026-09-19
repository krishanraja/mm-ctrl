# G25 provider closure PostgreSQL R63

Status: append-only closure facts verified in local PostgreSQL. Runtime closed.

R63 persists the orthogonal R62 lifecycle beside the dormant provider exchange registry. Facts contain only UUIDs, typed fact and scope labels, idempotency and evidence digests, and timestamps. Prompts, content, email addresses and raw provider identifiers have no column.

The append function locks the parent exchange row, requires an accepted exchange, validates fact scope and time, and applies exact retry identity. Service role can call the function and read receipts but cannot insert table rows directly.

## Database behavior proved

Seven integration tests against PostgreSQL 18.3 PGlite establish that:

- a closure fact cannot precede provider acceptance;
- Stripe operational deletion and regulated residual retention coexist as separate facts;
- Resend expiry and the external recipient copy coexist as separate facts;
- verification recovery requires and preserves an earlier failure;
- contradictory payload outcomes and failure after deletion success reject;
- exact retries converge and changed evidence conflicts;
- direct service-role inserts fail and readback remains content-free.

The tests use one PGlite database because repeated creation and disposal exposed a native V8/Wasm teardown fault in the test host. This improves test stability but does not prove multi-connection concurrency. Parent-row locking is present; independent-connection races still require a real PostgreSQL pool.

R63 is a candidate overlay, not a migration. It changes no linked database or live provider route.

No provider call, linked database, migration, deployment, merge or release is performed by R63.
