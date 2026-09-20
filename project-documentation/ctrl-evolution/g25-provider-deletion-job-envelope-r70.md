# G25 provider deletion job envelope R70

**Status:** Content-free cross-cell dispatch is locally proved. Queue behavior remains unproved.

## What crosses a boundary

Only a compact R68 authority and content-free routing metadata may cross from the issuer to a worker cell. The envelope contains the topology fingerprint, dispatch identity, retry lineage, target cell, short validity window and authority token. It contains no raw provider handle, ciphertext, encrypted envelope, customer content or provider response.

The compiler verifies the R68 token before it derives routing:

- `register` goes to `crypto_writer`.
- `lease` and `destroy` go to `deletion_worker`.

The caller cannot choose a different target. A dispatch cannot begin before its authority or expire after it, and its own lifetime cannot exceed five minutes.

## Retry meaning

Attempt one has no predecessor. Attempts two through five name a different predecessor dispatch. This records a bounded delivery lineage without changing the underlying authority or operation identity. R67 still decides whether an exact operation is new, idempotent or conflicting.

This is not yet a queue protocol. The compiler does not persist, send, acknowledge or dead-letter anything. Those lifecycle facts must be append-only and content-free before a transport is selected, otherwise queue-specific behavior would silently become product truth.

## Bounded result

Fourteen local tests pass. They cover both target cells, wrong destinations, stale topology, time containment, retry bounds, predecessor rules, token tampering, cross-job reuse and unexpected-field rejection. No queue, database, service or provider was touched.
