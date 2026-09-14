# G24 trusted canonical ingress R50

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R50 JSON contract

## What R50 repairs

R50 makes persisted identity formulas match the identities already used by the stores. Payload, authority-row and nonce-receipt content addresses are raw SHA-256 digests of their exact canonical bytes. Payload, wrapper, row, receipt and version fingerprints remain separate, versioned and domain-bound identities. The complete index covers every active payload schema, all 133 wrapper schemas and every durable row variant. Each indexed formula has executable evidence, and every materialized artifact is checked against its selected formula.

The session-committed fixture now resolves two actual current authority rows and two deterministic Ed25519 public-key artifacts. Both proofs carry valid 64-byte signatures over their declared canonical signed preimages. Proof, selected authority row, authority read set and projection fingerprints are identical per role. Nonce-subject and verifier-identity fields are recomputed from the exact R31 formula table before bundle, nonce, receipt and replay lineage is issued.

Reference classification and typed equality coverage now come from the complete active payload, wrapper and row schema universe. Every reference field records its exact source type, target schema or discriminator, target identity kind or explicit external classification, and all declared byte and fingerprint companions. Internal references remain exact-one. The manifest envelope, hash contract, resource and field specifications and schema-change record are final before the immutable semantic source snapshot is captured.

## Boundary

R50 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
