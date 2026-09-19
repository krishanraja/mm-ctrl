# G24 trusted canonical ingress R49

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R49 JSON contract

## What R49 repairs

R49 rebuilds the session-committed fixture from one internally consistent lineage. The committed registry binds the exact target-intent reference, byte hash and fingerprint. The selected projection uses the target intent's actual workspace throughout, and the target-partition fingerprint is recomputed from that workspace and the exact session partition. Both role proofs begin before the server commit and expire after it. Bundle, authority read set, receipt evidence, committed target, result, receipt, registry, history and replay are regenerated in dependency order.

The old unmatched-reference fallback is removed. A non-artifact identity is accepted only through an explicit schema, variant, field and identity-kind row. Any internal content artifact or authority-row reference must resolve exactly once.

Persisted identity coverage now comes from the complete active schema universe rather than fixture roles. It includes all 15 requests, 15 target intents, four proof schemas, 90 result variants, every supporting content-addressed store, both registry variants, both hold variants, both receipt variants, the nonce row and all six committed target stores. Every identity authority reference resolves to a real versioned object. Complete cross-artifact equality rows are generated from all persisted schema variants rather than the selected fixtures alone.

## Boundary

R49 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
