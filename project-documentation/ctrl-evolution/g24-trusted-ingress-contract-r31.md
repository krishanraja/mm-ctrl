# G24 trusted canonical ingress R31

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated R31 JSON contract

**Frozen parent:** R30 commit `044f8bfe3983f955b549df698c3389a4e10ab3db`, machine SHA-256 `78bbac3dc89bb89ce4309161ab43f4e62456fb7f86616f61f7dd454a3b55b03b`

## Exact repairs

Session hold evidence no longer contains any result ref, byte hash or fingerprint. The issuance graph selects evidence inputs, derives a precommit hold-row content address, stores evidence, then computes the result that references both identities. Only after the result exists does it finalize the hold row, held registry row, historical response and replay artifacts. The hold-row precommit identity excludes every result-derived field, so neither evidence nor hold-row identity can depend back on the result.

All seventy-five held result variants now carry the exact SHA-256 `hold_row_ref`; none retains `hold_ref`. Every operation result fingerprint binds its exact selected R31 branch payload. The result, final hold row, held registry row, historical response and replay identities have explicit equality joins.

Replay is a closed committed-or-held union. A committed replay carries exactly the committed registry row ref and fingerprint. A held replay carries the held registry row ref and fingerprint plus the hold row ref and fingerprint. The pre-materialized lookup has the same discriminated source shapes, and replay remains read only with no dynamic time.

Historical response selection is a closed ninety-row matrix across every operation and every result branch. The matrix fixes one response schema ref and version. Its named response fingerprint binds operation, branch, schema identity, canonical payload identity and result identity. The caller has no response-schema authority, and replay returns the exact original canonical response artifact.

The four bundle projection subject fields now have exact domain-separated formulas. Issuer and evaluator nonce subjects join the selected R26 authority rows and the R25 capability proofs. Verifier identities bind the proof verifier ref, version and key artifact to the selected authority row.

Verified session hold evidence has a field-by-field equality table to the selected request, bundle, truth projection, proofs, two nonce receipts, session read set, head and target evidence. Raw non-consuming evidence has a complete equality table to the exact bounded raw stores and any hold-row duplicates. Every opaque raw artifact and consumer now uses a SHA-256 content address with a constant role.

## Product boundary

R31 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.

Producer checks are not approval. Independent technical review remains blocking.
