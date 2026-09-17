# G25 provider deletion dispatch PostgreSQL R73

**Status:** Append-only dispatch persistence is locally proved in one PostgreSQL process. Independent connections remain closed.

## What changed

R73 implements the durable ledger required by R70 through R72 without giving any runtime cell direct table access.

- The issuer records a content-free dispatch projection and appends issuer-owned lifecycle events.
- The crypto writer and deletion worker can append only the target events for their own dispatch class.
- A human operator can append only recovery events.
- Every event is immutable. The current state is a derived projection updated in the same transaction as its event.
- Exact replay converges, changed replay conflicts and a job/operation/attempt identity cannot fork.
- Retry lineage must preserve the workspace, provider exchange, encrypted-handle identity, provider, topology and target.

The ledger stores the authority-token digest and envelope digest. It never stores the short-lived authority token, a raw provider identifier, provider payload, ciphertext or result content. Completion and failure evidence are digests only.

## Recovery boundary

Automatic retry is bounded to five attempts. A retry can be recorded only after the previous dispatch has closed through `retry_requested` and named the exact next dispatch. A terminal or exhausted dispatch remains visible through `dead_lettered`. Human recovery is then a separate event chain, not a disguised sixth automatic attempt.

## What this does not claim

The test harness uses PostgreSQL 18.3 through one in-process PGlite instance and changes roles on that connection. It does not prove genuinely isolated login sessions, transaction-pooler behavior, deployed Supabase grants, Vault or pgcrypto signature verification, queue acknowledgement, provider deletion, migration safety or production concurrency. The SQL remains a dormant candidate, not a migration.

## Bounded result

Six local integration tests pass. They cover content-free storage, exact replay, identity conflict, worker completion, wrong-role and service-role denial, closed retry lineage, atomic rollback and explicit operator recovery. The next honest gate needs an empty disposable Supabase environment with separate connections. No linked database, provider or deployment changed.
