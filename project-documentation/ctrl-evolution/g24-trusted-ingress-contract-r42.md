# G24 trusted canonical ingress R42

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R42 JSON contract

## What R42 repairs

R42 removes the last fixture-only row identity rule. Every stored registry and hold row now derives its row reference from the exact normative preimage declared by its selected closed schema. Registry identity excludes precisely its own row reference and final fingerprint. Hold identity uses the declared hold fields, domain and version. The checker independently reads those declarations, recomputes all seven identities and rejects a coherent request change that tries to retain the prior row reference.

The four restart cases now bind the complete durable lineage. Request, operation, idempotency, selection, result, history, hold, session evidence, proof, nonce, registry, replay payload and replay envelope fields must satisfy one closed correlation table before issue or replay. A cross-row splice remains invalid even if the attacker reseals the changed artifact.

The owned snapshot boundary now captures its trusted primitives during isolated module bootstrap and never invokes caller-mutable collection or JSON methods afterward. Exact depth, node, string-byte, array-length and object-key limits are applied before output allocation or child traversal. Huge sparse arrays, descriptor traps, prototype pollution and unsupported values fail before validation, hashing, use, write or disclosure.

The semantic-reference universe is independently specified from authoritative schema and control vocabulary, not inherited from the R40 or R41 registry. It covers 5,236 exact occurrences across 210 manifested authorities, including singular and plural references, source references, transaction, branch table, matrix, result-store, effect, encoding and transition controls, discriminated compound results, replay paths and non-suffix semantic references. Every observed occurrence has exactly one registered owner and version.

## Boundary

R42 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
