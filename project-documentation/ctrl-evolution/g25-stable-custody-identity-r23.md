# G25 stable custody identity, R23

R23 proves the database identity split required by the founder-approved subject and operator rule. A login can disappear, customer custody can move, the Brain subject can remain intact and old encrypted evidence can keep its exact historical identity.

## The four identities

| Identity | Meaning | May change when an operator leaves? | Grants access? |
|---|---|---:|---:|
| Authentication user | A current way to sign in | Yes, it can be removed | No, not without live roles and grants |
| Brain subject principal | The person whose Brain this is | No | No |
| Operator principal and custody assignment | Who the customer currently authorises to steward the Brain | Yes, through an authorised transfer | No |
| Historical principal | The immutable identity already bound into old receipt authority and cryptographic context | No | Never |

The legacy `owner_id` bytes remain unchanged and now point to a private historical-principal table. They are not current ownership, current custody or access authority. This keeps old authority fingerprints stable. Prepared receipt ciphertext therefore remains decryptable after custody moves.

## Verified locally

The PostgreSQL canary starts with three Brains and five people, including an operator who is also the subject of a separate Brain.

- Both Brains held by that operator transfer to a replacement through a customer-authorised, serialized custody operation.
- Operator principals use independent UUIDs rather than disguising auth-user IDs behind a different table name.
- Custody transfer creates no workspace role or audience grant. Access remains a separate explicit action.
- Removing the former authentication user deletes their auth links, roles and grants but preserves all three Brains, the dual-role subject principal, the prepared receipt, correction, tombstone, ciphertext, fingerprint and historical identity.
- A still-valid JWT for the removed user sees zero prepared receipts. The replacement sees the preserved receipt after explicit roles and grants are added.
- An out-of-band user deletion before transfer preserves the customer's Brain and produces `transfer_required`, rather than deleting data or pretending custody is healthy.
- The stranded custody can be recovered using the stable former operator principal, without restoring the removed login.
- A unique current-assignment constraint blocks two current custodians. A wrong-source transfer fails closed.
- Rebinding historical owner identity to `auth.users` makes the negative control fail because the old operator cannot be removed.
- Rebinding Brain subjects to an auth-user cascade makes the negative control fail because a dual-role subject's Brain is lost.

The cryptographic regression separately encrypts a real prepared receipt, changes current operator custody and decrypts the original bytes successfully. Rewriting the historical owner changes the authority fingerprint and fails AES-GCM context authentication, proving why historical identity must remain immutable.

## Boundary

This is a non-migration candidate exercised only in PostgreSQL 18.3 WASM through exact-pinned PGlite 0.5.8. It does not alter a linked database or any runtime caller.

The normal removal path remains transfer or explicit customer closure before auth deletion. The out-of-band deletion case is catastrophe recovery, not permission to bypass that policy. Closure is represented but not exercised. Current prepared-write functions still carry the legacy `owner_id` name, and the anti-revival tombstone purpose, duration, expiry and re-consent rules remain unresolved. Multi-connection transfer races, a Supabase local image, PostgREST, storage and provider receipts, and full erasure execution remain unproved.

The next gate is to bind new writes and the removal planner to stable custody without changing old receipt bytes, then resolve tombstone retention before proposing a migration.
