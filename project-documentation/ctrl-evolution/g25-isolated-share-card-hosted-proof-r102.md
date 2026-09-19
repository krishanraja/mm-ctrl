# G25 isolated share-card hosted proof R102

**Status:** The first bounded Edge Function is live and passing on the reused development project. This proves one route, not the function estate.

## The useful failure

The first valid image request returned 503. Wrong methods and oversized input were already rejected correctly, so the function itself was running. The missing dependency was the distributed rate-limit routine: it existed in an old migration but not in the production-derived baseline replayed into the replacement project.

The guard was not removed. R102 adds a hardened rate-limit authority with strict inputs, row-level security, no public, anonymous or authenticated execute grant, and one service-role execute grant. The migration is now recorded in the isolated project's history.

## Hosted result

The deployed `share-card` function now returns a real PNG, advertises public caching, emits `nosniff`, rejects POST with 405 and rejects an oversized URL with 413. A distributed counter appeared during the request and the exact test row was removed afterwards.

This is a small but meaningful vertical proof: repository source, explicit gateway posture, hosted Edge runtime, service-role-only Postgres authority, external font loading, image rendering, response security and test cleanup all worked together.

## Boundary

No email, payment, AI-model or customer-data route was deployed. No secret value was retrieved. Production was not changed.
