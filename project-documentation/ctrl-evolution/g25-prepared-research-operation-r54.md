# G25 prepared research operation, R54

R54 composes the previously independent controls into one dormant corridor. Public evidence is admitted by R52, the smallest allowed provider request is prepared by R50 and the corresponding digest-only R51 receipt command is produced under the R53 route matrix.

The result is intentionally not a provider client. Its provider command carries `execute_authorized: false`, and the whole operation remains `receipt_required_before_dispatch`. A later runtime must persist the receipt successfully before it can cross the external boundary. This prevents an external request from happening first and an audit trail being manufactured afterwards.

The request digest is identical on the provider and receipt commands. The operation idempotency digest remains separate, so the same query may be a different real operation later. Fixed public fetches carry no outbound query or query-minimisation digest and require the fixed-fetch control. Customer-shaped public queries cannot borrow that standing.

## Boundary

Nine R54 tests and 28 upstream R50 and R52 tests pass. Typecheck reports no new errors. The test fetcher is synthetic, no provider client is present and no receipt is persisted. No network request, linked database, live route, migration, deployment, merge or release was touched.

The next gate is the post-dispatch outcome classifier. It must represent accepted, rejected and unknown outcomes with HMAC or digest evidence and never expose a raw provider request identifier.
