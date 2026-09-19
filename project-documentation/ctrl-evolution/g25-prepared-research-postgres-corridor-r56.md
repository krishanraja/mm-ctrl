# G25 prepared research PostgreSQL corridor, R56

R56 proves that the in-memory corridor and the database corridor agree. The exact receipt produced by R54 and the exact initial event produced by R55 are accepted by the R49 registry with its R51 identity correction and R53 route matrix.

The ordering invariant is executable: PostgreSQL rejects the event before its receipt exists. Once the receipt is recorded, the accepted event persists. Exact retries converge. Reusing the event operation identity with changed response evidence fails closed.

Database readback contains neither the transient provider request ID nor the outbound public query. Rejected and outcome-unknown paths also persist, keeping provider identity null when none was returned.

## Boundary

Four integration tests run PGlite in a dedicated Node test environment. Provider dispatch and public-source fetch are synthetic. This is still single-process and does not prove independent-connection races, Supabase-local policies, PostgREST, provider parsers or production transport.

No provider was called and no linked database, migration, live route, deployment, merge or release was touched.
