# G25 provider exchange receipt registry, R49

R49 turns the R45 through R48 provider findings into a dormant database enforcement candidate. It records what class of data was allowed to leave, for what bounded purpose, under which proved control and what later happened to the external copy. It does not store the material itself.

## What the local PostgreSQL canary proves

- Private Brain material for model or audio processing needs a contractual or request-verified zero-retention control.
- Research providers cannot receive private data classes. A customer-shaped query also needs a query-minimisation digest; fixed public feeds remain context-free.
- Delivery uses an explicit provider-retention standing. Billing uses regulated retention rather than pretending operational deletion erases legal records.
- A delivery receipt can move from accepted to delivered, expiry pending and expired. Terminal states cannot be reopened.
- Exact retries are idempotent. Reusing an identity with different evidence fails closed.
- Authenticated users cannot call the writers and the service role cannot bypass them with raw inserts.
- Tables use forced row-level security and contain no raw prompt, query, content, email, recipient or provider request identifier.

## Why this is not a universal deletion claim

The states distinguish an operationally deleted copy from residual legally retained data. A recipient inbox, provider backup, payment record or provider-side exception does not disappear merely because CTRL erased its local source. The lifecycle is evidence about bounded control, not a promise that CTRL can recall every downstream copy.

## Boundary

This is a non-migration overlay exercised in single-process PGlite. It is not imported by a provider caller and changes no live route. Independent-connection races, Supabase-local policy behaviour, PostgREST and provider account configuration remain unproved. No linked database, external provider, production data, deployment, merge or release was touched.

The next gate is a typed query-construction boundary. It must accept only already-public identifiers or deliberately bounded public search terms. It must reject arbitrary private prose rather than claiming that lossy redaction makes it safe.
