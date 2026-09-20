# G24 trusted canonical ingress R30

**Status:** fully materialized local repair candidate under independent review

**Authority:** the exact generated R30 JSON contract

**Frozen parent:** R29 commit `c6362ca899d164d2ec632d80f65f6c2e766f782c`, machine SHA-256 `2f020a872e112a5fc07079f9128a8ee9952b8f4741005a295c0333d680eb4395`

## Exact repairs

R30 records the complete frozen R29 identity and the corrected exact R28 checker, materializer and founder-checker blobs. The focused checker asserts every literal identity before testing semantics, so stale parent provenance cannot silently survive another extension.

The session bundle no longer contains a caller-supplied bundle ref. The server decodes the target intent, joins its workspace to the selected current partition, resolves both canonical proofs and their authority and verifier subjects, then creates one closed runtime truth projection. Every non-derived bundle key maps byte-for-byte to that projection. The projection and bundle each have one domain-separated fingerprint and one content-addressed store. The bundle ref is the SHA-256 content address of canonical bundle bytes.

Authority read sets are now a closed discriminated union. An ordinary operation carries exactly one nonce receipt. A session operation carries exactly two role-specific nonce receipts and cannot inherit a singular nonce field. Session receipt evidence and the committed receipt bind the exact projection ref, byte hash and fingerprint as well as the selected session read-set variant.

Session holds now resolve a closed fingerprinted evidence artifact. Stale-head and invalid-target holds bind the verified bundle, projection, both proofs, two nonce receipts, session read set, head, target or raw target, and result. Authorization, invalid-proof and internal-failure holds bind only the available bounded raw evidence and consume no nonce. The session hold row, held registry row, result and replay payload all bind the same evidence identity.

Replay now has one historical response store, one payload store and one envelope store. The competing generic replay-response family is absent. Committed registry rows use their canonical registry row ref; held registry rows use the exact content-addressed hold row ref with no `hold_ref` alias. The original transaction pre-materializes the historical response, payload, envelope and unique lookup atomically. First and concurrent replay only resolve existing bytes and write nothing.

## Product boundary

R30 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.

Producer checks are not approval. Independent technical review remains blocking.
