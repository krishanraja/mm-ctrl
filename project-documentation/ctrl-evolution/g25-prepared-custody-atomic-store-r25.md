# G25 prepared custody atomic store, R25

R25 is the first database candidate that can store R24 prepared intelligence under the stable custody identity proved in R23.

It uses a separate custody-native storage generation. It does not alter the legacy R7/R10 receipt, dependency or event tables. This keeps old authority fingerprints, ciphertext context and rows exact while giving new intelligence a storage model with no operator, auth-user or legacy-owner identity.

## What the local PostgreSQL canary proves

- PostgreSQL recomputes the exact R24 authority fingerprint and matches the TypeScript contract.
- One call writes the custody receipt, every dependency and its accepted event atomically.
- A forced final-event failure leaves zero receipt, dependency or event residue.
- Exact replay is idempotent. Changed ciphertext or encryption version is a conflict, not a silent replay.
- Unknown identity fields, including a smuggled legacy owner, fail closed.
- Current authority is recomputed from the underlying Brain row. Changed authority is rejected.
- The stable custody principal remains the same after an authorised operator transfer and a new write still succeeds.
- Missing active operator authentication makes custody unavailable for new writes.
- Receipt IDs and workspace ingest keys cannot collide across the legacy and custody generations in either direction.
- The unchanged R10 writer still creates a non-conflicting legacy receipt after the R25 overlay is present.
- The pre-existing legacy row is byte-equivalent before and after the custody-native writes.
- Reading still requires both a current workspace role and the exact audience-purpose grant.
- A wrong-purpose reader sees zero rows, and an already-issued JWT sees zero rows after role revocation.
- Removing either fingerprint verification or active-custody verification makes the negative-control run fail.

## Why two storage generations are correct here

Changing the meaning of the legacy `owner_id` column would risk both decryption and provenance. Making it nullable would weaken the old composite authority constraint. Copying a new stable identifier into that field would make the data look compatible while changing what it means.

R25 instead makes the boundary explicit. Legacy receipts remain historical evidence. New receipts are custody-native. A later read projection may unify them for the product without pretending their cryptographic formats are the same.

## Boundary

This is a disposable PGlite/PostgreSQL canary, not a migration or runtime path. It does not yet provide custody-native payload encryption, decision-case authority adapters, correction and erasure for the new generation, a unified read projection, multi-connection race proof, Supabase-local or PostgREST parity, storage-provider coverage or any production rollout.

The next gate is custody-native payload encryption whose authenticated context matches R24. The principal-removal planner must then consume live R23 custody state, and the correction, erasure and unified-read paths must cover both generations before a migration can be proposed.
