# G24 trusted canonical ingress R37

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R37 JSON contract

## What R37 repairs

R37 separates session holds into two exact classes. Stale-head and invalid-target holds may use the verified-consuming path only when the dual proofs, authority read set, truth projection and two nonce receipts exist. Authorization, invalid-proof and internal-failure holds use the raw-non-consuming path, which forbids truth projection, read set and nonce material. The exhaustive selector now contains fifteen committed, sixty ordinary-held, six session-verified-consuming and nine session-raw-non-consuming rows.

The selected row identity, proof family, branch class, evidence kind and selector version are persisted and fingerprinted in every original committed or held registry row and every hold row. Replay reads those durable values from the original registry. It never reinterprets historical work through a newer selector table.

Selector, replay-classifier and normative-manifest rows now have closed exact schemas, no caller-writable fields and no fallback. The authority manifest is independently pinned by exact path, authority and local schema versions and object hash. Recursive authority-marker discovery must equal the frozen manifest, including nested objects.

Every replay path begins with its exact committed or held registry authority, uses unique ordered vocabulary, resolves result before history and payload before envelope, and retains exact source-precedence and anti-splice contracts.

## Boundary

R37 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
