# G25 provider deletion handle PostgreSQL R65

Status: encrypted-handle custody verified in local PostgreSQL. Trusted writer still required.

R65 persists R64 envelopes in a private, forced-RLS table and exposes three function-only operations: register, lease and destroy. A handle must belong to an accepted, provider-coherent exchange. A lease lasts no more than five minutes. Expired exchange-window handles are wiped before ciphertext can be returned.

Operational deletion and Stripe account closure require an active lease plus a matching R63 `operational_deletion_succeeded` fact. Successful destruction removes the ciphertext and lease token while retaining only the content-free custody receipt and closure link.

## What the database proves

Seven PostgreSQL integration tests prove registration ordering, provider coherence, actual R64 encryption round-trip, exact replay, competing-lease rejection, expiry wiping, closure-fact-gated destruction, account-lifetime Stripe custody and denial of direct service-role inserts.

## What the database cannot prove

PostgreSQL validates the envelope's exact shape, algorithm label, bounded fields and lifecycle. It cannot prove an envelope-shaped value was actually encrypted by R64 because the database deliberately does not possess the key. The tested path uses real R64 encryption, but runtime registration still needs a dedicated trusted crypto writer. Likewise, the broad service role can currently invoke lease; production needs a narrower deletion-worker capability.

Giving the database the decryption key solely to authenticate registration would worsen custody. The correct next gate is workload identity and least-privilege authority, followed by a real multi-connection lease race.

R65 is a candidate overlay, not a migration. It does not call any provider or edit a live route.

No provider call, linked database, migration, deployment, merge or release is performed by R65.
