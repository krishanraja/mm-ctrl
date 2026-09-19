# G24 trusted canonical ingress R34

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R34 JSON contract

## What R34 repairs

R34 removes `result_ref` from every committed and held result payload. A result now contains only its semantic result fingerprint. After those exact bytes are serialized, the result artifact store derives `artifact_ref` as the SHA-256 of the canonical result bytes. An outcome can no longer claim the content address of bytes that contain that claim.

The selected result artifact is the only source for historical and replay result identity across all ninety operation branches. Historical `result_ref` equals the artifact reference, `result_bytes_sha256` equals the artifact's canonical byte hash, and `result_fingerprint` equals the fingerprint decoded from those exact canonical bytes. The committed or held registry binds that same triple and the already-materialized historical response.

One generated dependency graph now covers the active result, history, final receipt or hold, registry and replay identities. It is built from explicit derivation rules, checked for exact edge closure and cycles, and enforces the same branch order: precommit material, result fingerprint, canonical result artifact, historical response, final receipt or hold, registry, replay payload and replay envelope.

A ninety-row binding inventory proves source existence, SHA-256 type parity and exact local mapping for all fifteen committed and seventy-five held variants. No replay path may read a result artifact reference from decoded outcome bytes.

## Boundary

R34 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
