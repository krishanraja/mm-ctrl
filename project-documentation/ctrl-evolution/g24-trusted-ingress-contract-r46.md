# G24 trusted canonical ingress R46

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R46 JSON contract

## What R46 repairs

R46 removes the hand-selected lineage list left in R45. It traverses every reference-bearing field in the exact selected closed schema for all four restart branches. Each field must resolve to exactly one artifact or authority-row identity, be an explicit self identity, or appear in the closed non-artifact and sentinel allowlist. The traversal finds 104 inter-artifact references, including all 26 R45 omissions, and generates 312 byte, fingerprint and reference correlations.

The complete R44 runtime-semantic manifest structure is restored and extended. Two hundred and twenty authority paths carry semantic kinds, exact keysets, schema versions, direct and transitive dependency sets and hashes, content hashes and a self-sealed envelope. The regenerated reference registry contains 6,407 exact occurrences.

The committed target row is now a complete projection of submitted intent plus server-derived time and order. Its expiry is strictly later than commit time, and its row-version identity binds every mutable authority field. The bootstrap nonce subject uses the normative R26 verifier-set fingerprint over both distinct signer and key-artifact tuples.

## Boundary

R46 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
