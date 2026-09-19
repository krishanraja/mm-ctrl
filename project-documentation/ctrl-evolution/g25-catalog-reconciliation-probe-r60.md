# G25 catalog reconciliation probe R60

Status: deterministic read-only probe compiled. Database execution deferred.

R57 exposed two uncertainties that static files cannot honestly settle: 105 identity candidates appear in migration history but not in generated types, while 116 current generated-schema JSON columns can conceal identifiers that their column names do not reveal. R60 compiles one metadata-only PostgreSQL query covering all 221 targets exactly once.

## What the probe can establish

For each public-schema table and column, the query returns:

- whether the table and column currently exist;
- whether the relation is a table, partition, view, materialized view or foreign table;
- the current PostgreSQL type and nullability;
- whether row-level security is enabled on the relation;
- constraints attached to the column, including foreign-key definitions.

That is enough to separate generated-type drift from migration archaeology and to identify JSON columns that still need row-content policy. It does not inspect a single application row or reveal the values stored in those columns.

## Safety boundary

Targets come only from executable R57 discovery and must match a conservative identifier grammar before SQL is composed. The exact compiler and SQL hashes are pinned. Static checks allow only catalog relations plus the query's own common-table expressions and reject data or schema mutation statements.

The probe has not been executed because this branch is not authorized to connect to a linked or production database. Once a separately authorized environment runs it, the returned metadata still needs a signed receipt before R58 classifications can change.

No database connection, application data read, live deletion edit, migration, provider call, deployment, merge or release is performed by R60.
