# G25 atomic Brain ingestion R107 QA record

**Observed:** 18 September 2026  
**Target:** founder-authorized isolated `legibility` project  
**Production writes:** zero

## Frozen implementation

- Route SHA-256: `55af450692e6b953a3c200202d7764ef4dde72f972ea0427ec4b4f0ae0cbf413`
- Composition module SHA-256: `e8ae4df485994c9a63d6304e0d08f69d35a75d96fea2bfcb0310419d4854023d`
- Composition tests SHA-256: `6b67a0fdbde99f902662a5e50ba543b1bd3283c26e22e2bd03ab1dfd0d24a4d1`
- Atomic authority migration SHA-256: `0b026c59c5fe8a5f0b30de5b1698a9fbf5d84647b655deece3c5438bef941957`
- Retired semantics migration SHA-256: `ba101107e3d05755a60145e6618887811e68839e7f1c239dfd385a938fb34783`
- Hosted probe SHA-256: `4bc5f72573655bf7a6e3d39ccf38c4f223cce20dca33354218127773e992c989`
- Target-neutral database runner SHA-256: `fce2450afa90970550006d7f870629bf5b8dc3b9a8e2eb31c6952bec0bb33588`
- Containment manifest SHA-256: `34922f1cbbadf2cb114175615f68fdc61ce8b24506937767f15a78cc38923f82`
- Function config SHA-256: `d694cdc16d1f7814adf2b7169d2ae4604997b82dad1b24c80c2e981094a0ecce`
- Hosted bundle SHA-256: `5c011c419296dd1125a97de470724148e5cb8ef83bd8465748496da56a9f0e44`
- Hosted version: 1, active, JWT verification enabled

## Deterministic checks

- `brain-to-evidence`, project-binding and bounded-request tests: 20 passed.
- Anonymous: `401`.
- Empty Brain: `422`.
- Wrong method: `405`.
- Wrong media: `415`.
- Extra body field: `400`.
- Oversized body: `413`.
- Forced late failure: `500`, with zero partial rows in all four written relations.
- First ingestion: `200`, two facts, one decision, three evidence rows, two constructs and one skipped rejected fact.
- Same-snapshot retry: `200`, same receipt, same source, same fingerprint and no new writes.
- Correction: `200`, new receipt, new fingerprint and exact supersession links.
- Correction retry: `200`, same corrected receipt and no new writes.
- Active receipts after correction: one.
- Accepted old construct preserved: yes.
- Stale old candidate retired: yes.
- New constructs all candidate: yes.
- Unicode offsets exact under JavaScript slicing: yes.
- Rejected fact absent from staged evidence: yes.
- Cross-person receipt rows visible: zero.
- Direct receipt insert: `403`.

## Database readback

- Receipt RLS: enabled.
- Authenticated select: allowed.
- Authenticated direct insert: denied.
- Authenticated RPC execution: allowed.
- Anonymous RPC execution: denied.
- Retired-candidate pole semantics: present.
- Retired-candidate evidence semantics: present.
- Probe trigger count after test: zero.
- Probe function after test: absent.
- Receipt rows after cleanup: zero.
- Migration history records `20260918153000` and `20260918153500`.

## Cleanup

Auth users, identities, profiles, memory facts, decisions, sources, evidence, constructs and receipts all read back as zero for the transient people.

The management credential was used only in process memory. No credential value was emitted, written to an artifact or committed.
