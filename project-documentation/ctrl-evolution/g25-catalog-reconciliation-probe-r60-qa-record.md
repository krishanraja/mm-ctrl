# G25 catalog reconciliation probe R60 QA record

Status: compiler and exact SQL frozen. Execution deferred.

## Positive evidence

- The compiler executes the R57 discovery script rather than maintaining a second hand-written target list.
- The resulting query contains 193 unique targets: 77 migration-only candidates and 116 generated-schema opaque JSON columns.
- Every table and column name passes a restrictive identifier grammar before interpolation.
- String literals are escaped even though the discovery grammar excludes quotes.
- The query reads only four `pg_catalog` relations and its own common-table expressions.
- Mutation keyword checks reject insert, update, delete, merge, truncate, alter, create, drop, copy, call, do, grant and revoke.
- Exact compiler and SQL SHA-256 values are checked.

## Residuals

- No database returned these metadata rows yet.
- Catalog existence does not establish which JSON rows contain personal data.
- Constraints do not by themselves prove semantic ownership or safe deletion authority.
- Triggers, policies, functions, storage, provider state and backups are outside this query.
- Generated types must still be regenerated from the accepted catalog after reconciliation.

No database connection, application row read, live deletion edit, migration, external call, deployment, merge or release is authorised.
