# G25 provider deletion-handle database authority R68

**Status:** The compact authority is locally proved. The Supabase database verifier is static and unexecuted.

## The hole R68 closes

R67 separated database permissions, but PostgreSQL still trusted a worker-supplied JSON authority. A stolen worker database credential could therefore invent an authority for that worker's permitted operation.

R68 turns the R66 authority into a compact three-part token. The issuer signs the exact encoded header and payload. The token contains no provider handle or encrypted envelope. Registration carries only a fingerprint of the six bounded R64 envelope fields.

The Supabase candidate verifies the signature inside PostgreSQL using `pgcrypto`, with a 32-byte base64url verification secret read from Vault only by a private `SECURITY DEFINER` function. It recalculates the envelope fingerprint in PostgreSQL, then hands the verified payload to R67 for atomic spend. Direct R67 wrapper access is removed.

## Runtime identity decision

Supabase documents custom Postgres users, custom-role connections through the shared pooler, and transaction mode for edge or serverless workloads. The intended production shape is therefore:

1. An issuer signs five-minute authorities. It has no writer or deletion-worker database credential.
2. A crypto-writer service has one custom database login and can call only verified registration.
3. A deletion-worker service has a different custom database login and can call only verified lease and destruction.
4. Each login belongs to only its matching NOLOGIN privilege role.
5. The two database passwords, provider credentials and cryptographic capabilities must live in demonstrably separate secret domains.

The default `service_role` and `postgres` roles receive neither membership nor function access.

## Why this is still a candidate

PGlite does not ship the required `pgcrypto` or Vault extensions, so the database verifier cannot be honestly described as executed. The exact extension schema, Vault view permissions, connection usernames and transaction-pooler behavior must be inspected in a disposable Supabase environment before migration work.

The signing secret is stored as an unpadded base64url encoding of 32 random bytes. The issuer decodes it before HMAC signing, and PostgreSQL decodes the Vault value before HMAC verification. No secret value belongs in source, migration text, logs or receipts.

## Primary sources

- [Supabase Postgres roles](https://supabase.com/docs/guides/database/postgres/roles)
- [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Edge Function database connections](https://supabase.com/docs/guides/functions/connect-to-postgres)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [Supabase Postgres extensions](https://supabase.com/features/postgres-extensions)

## Bounded result

Twelve local tests prove the token, context, key rotation, tamper resistance, canonical encoding and serialization-independent envelope fingerprint. They do not prove the Supabase SQL candidate, Vault access, secret isolation, custom login provisioning or concurrent connections.
