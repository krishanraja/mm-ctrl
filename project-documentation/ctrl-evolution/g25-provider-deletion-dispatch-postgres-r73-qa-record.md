# G25 provider deletion dispatch PostgreSQL R73 QA record

## Automated evidence

- Vitest: 6 PostgreSQL integration tests passed.
- Dispatch rows contain digests and routing metadata, not raw authority tokens, provider identifiers, ciphertext or result content.
- Exact replay is idempotent; changed identity and duplicate job/operation/attempt identity fail closed.
- Retry lineage preserves workspace, receipt, handle, provider, operation, topology and target.
- Issuer, writer, worker and human-operator functions expose disjoint event powers.
- Direct table reads and the former broad `service_role` shortcut are denied.
- Invalid event detail rolls back both event insertion and projection mutation.
- Dead-letter and operator-recovery state remain inspectable rather than disappearing into retry machinery.

## Residual risks

- Role changes share one PGlite connection; independent login isolation is unproved.
- PostgreSQL row locking is exercised, but true concurrent connections and pooler behavior are unproved.
- The R68 pgcrypto and Vault verifier candidate has not executed.
- Human operator identity, session policy and RLS integration are not provisioned.
- No queue, acknowledgement, provider request, migration or deployment exists.
- A future migration must reconcile this candidate with live schema state before execution.

## Decision

Accept R73 only as a locally executed persistence candidate. Do not call it deployed, independently isolated or provider-complete. The next gate must use separate connections in an empty disposable environment and must preserve the exact R72 authority map.
