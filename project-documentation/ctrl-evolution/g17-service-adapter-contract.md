# G17 service-side Brain adapter contract

Status: provisional technical contract; no database branch, function, key, workspace or row created

Date: 8 September 2026

## Outcome sought

Prove the smallest trustworthy path from one deliberately supplied synthetic source to an encrypted, evidence-bound Brain record and back to an audience-scoped read model. This is plumbing for the approved Living Brain and Decision Bench, not a new product surface and not permission to ingest customer material.

G17 stops before diagnostic inference. It must first prove that CTRL can receive, preserve, correct and retrieve exact evidence without widening its audience, losing provenance, duplicating a retry or silently accepting corrupt ciphertext.

## Evidence-led architecture calls

### Do not reuse the legacy memory cipher

`supabase/functions/_shared/memory-crypto.ts` exists to preserve compatibility with old `user_memory` rows. It pads or truncates text into a key and keeps a published development-key fallback. That behaviour is not acceptable for new Brain data.

The new `brain-crypto.ts` contract instead requires:

- an exact 32-byte random key supplied as base64 or base64url;
- no fallback, default, passphrase padding or silent replacement value;
- AES-256-GCM with a fresh 96-bit IV and a 128-bit authentication tag;
- associated data binding workspace, subject, record kind, record ID and field;
- a versioned envelope with an explicit key ID so rotation is possible;
- hard failure for missing keys, changed context, malformed envelopes or authentication failure;
- no plaintext, key material or ciphertext in logs.

AES-GCM is an authenticated-encryption mode defined by [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final). The key and lifecycle choices also follow the separation, generation and rotation principles in the [OWASP Cryptographic Storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html). NIST has announced a revision of SP 800-38D, so the implementation must remain versioned rather than treating today's envelope as permanent.

### Make the whole write one database transaction

The canary's deferred constraints require evidence before a held or trusted item, and before any semantic relationship, can commit. A chain of independent REST inserts can leave a source without assertions or an item without its intended evidence if the network fails between calls.

The adapter therefore prepares IDs and ciphertext in the Edge Function, then calls one narrowly granted database function that applies one bundle atomically. The database function must be `security invoker`, use explicit schema-qualified objects, revoke execution from `public`, `anon` and `authenticated`, grant execution only to the backend role, and validate the workspace, subject and payload fingerprint before writing.

No atomic database function will be authored or applied until it can be syntax-checked and exercised on a writable isolated database.

### Treat retries as a first-class truth problem

Every write request must carry an opaque `ingest_key`. Before encryption, the Edge Function canonicalises the complete logical payload and records its SHA-256 fingerprint.

- New key plus no prior receipt: create once.
- Existing key plus identical fingerprint: return the original receipt without another write.
- Existing key plus different fingerprint: reject with conflict; never reinterpret the earlier request.
- Concurrent identical requests: one transaction wins and the other returns the same receipt.

The key is not derived from a person's words and must not contain personal data. Random AES-GCM output is intentionally different on every encryption, so idempotency is based on the canonical plaintext payload fingerprint, not ciphertext equality.

### Separate write authority from read eligibility

The first canary writer is machine-only, has no browser CORS contract and is restricted to one configured synthetic workspace. It uses a dedicated, independently rotatable backend key and never exposes that key to the client. Current Supabase guidance recommends secret keys for backend components because each key can be rotated independently; secret keys bypass RLS and must remain server-side. See [Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

The later read projector must not select with backend authority. It validates a non-anonymous user session, queries ciphertext through a user-scoped client so the existing workspace and audience RLS decides eligibility, then decrypts only the rows that survived that selection. The browser receives the smallest plaintext projection needed by the approved view, never encryption metadata or unrestricted table access.

No authenticated browser integration is authorised in G17.

## Smallest write envelope

The first implemented bundle will contain only:

1. one `brain_sources` row;
2. one or more `brain_assertions` rows bound to exact source spans;
3. an immutable receipt containing workspace ID, source ID, assertion IDs, ingest key, payload fingerprint, created-versus-replayed state and recorded time.

It will not create Brain items, relationships, embeddings, summaries, scores or model-generated interpretations. Source preservation comes before synthesis.

The request is plaintext over TLS to the server boundary. The function generates all row IDs before encryption, binds each encrypted field to its final row context, calls the atomic database function once and returns identifiers only. Request and response logs contain status, duration, counts and non-sensitive identifiers, never content.

## Correction propagation gate

Before the Decision Bench or Living Map can read real data, a second atomic path must prove:

1. a correction arrives as a new source and assertion;
2. the old item meaning remains preserved in its earlier version;
3. a new item version points to its exact predecessor and correction evidence;
4. the earlier version is closed with `superseded` standing, `valid_until` and `superseded_by_version_id`;
5. every relationship that pointed at the old current endpoint is either revised to the new current endpoint or removed from the current projection;
6. the same correction replay creates no additional version;
7. a conflicting replay is rejected;
8. audience scope cannot widen anywhere in the chain.

This is the minimum self-healing proof. A model noticing a contradiction is not self-healing; the durable correction graph and its verified downstream consequences are.

## Verification ladder

### Complete locally

- `brain-crypto.ts`: strict key parsing, versioned AES-GCM envelope, contextual authentication and explicit keyring rotation.
- `brain-ingest-core.ts`: canonical JSON, SHA-256 payload fingerprinting, ingest-key validation and exact-replay versus conflict logic.
- 13 focused tests pass, including wrong context, tampering, missing key, wrong key length, rotation, canonicalisation and conflicting retry.

### Blocked on an exact external gate

The production Supabase project has no development branch. A new isolated branch currently costs **$0.01344 per hour**. Supabase states that branch database, data, API, Auth, Storage and Edge Functions are isolated from production. Branch secrets are also separate. See [Working with branches](https://supabase.com/docs/guides/deployment/branching/working-with-branches).

Creating that billable resource requires the founder to confirm the cost immediately before creation. No branch has been created.

### Required on the isolated branch

- apply the existing three G16 migrations to a fresh schema;
- run the committed four-identity transactional suite successfully;
- add and test a partial unique ingest-key constraint plus stored payload fingerprint;
- prove atomic source and assertion creation, exact replay and conflicting replay;
- prove two concurrent identical calls leave one source bundle;
- prove anonymous, anonymous-auth and ordinary authenticated callers cannot invoke the write function;
- prove the machine caller cannot target a workspace other than the configured synthetic workspace;
- prove key absence fails before any database call;
- query security and performance advisors after every DDL change;
- finish with zero retained rows unless a separately approved synthetic fixture is being inspected.

## Gates that remain closed

- no production migration or Edge Function deployment;
- no encryption key or backend API key creation;
- no synthetic or real account, workspace or row;
- no customer source, transcript, work tool or meeting data;
- no UI read or write wiring;
- no model inference or automated memory promotion;
- no GitHub customer repository or export;
- no public feature flag or navigation entry.

## Next exact decision

Approve or reject creation of one isolated Supabase development branch at the quoted hourly cost. If approved, create it, record its lifecycle owner and deletion condition, apply the existing G16 migrations, run the already committed behavioural suite, and only then author the transactional database function against observed branch behaviour.
