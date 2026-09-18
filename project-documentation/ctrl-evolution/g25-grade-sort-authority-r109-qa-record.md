# G25 grade-sort authority R109 QA record

**Observed:** 18 September 2026  
**Target:** founder-authorized isolated `legibility` project  
**Production writes:** zero

## Frozen implementation

- Route SHA-256: `d915fe8ae49ffc1808a9fb43e35514e9f094a28c9adfc179f7f32f1c63651634`
- Authority migration SHA-256: `adb123b263e81ed4b0606b8cf3fda89adc2e2e009cae2c4052b275805ca85c59`
- Client hook SHA-256: `4e646a95b06ec07c24791efd9c11e450587d125938e84fb167adce0b35ec44db`
- Hosted probe SHA-256: `e7c9e0839e82dc7a50a76fd87b3e6558d9e0c9fe9e407d79bcb824c246b93143`
- Containment manifest SHA-256: `7a49b0443961d4ad4fc222fedc697dd0800ebd851ae7a9c5653017f5d77e8dab`
- Function config SHA-256: `0fe35a3db600aabd8733ec590c6faf8c10d89c934cd677a233dac60cae89891f`
- Hosted bundle SHA-256: `3e89d71061882780b907d5db18c36f54cb23849cc44cbac1307476749fe6a4b8`
- Hosted version: 1, active, JWT verification enabled

## Deterministic and hosted checks

- Sort-composition and request-boundary tests: 66 passed before freeze.
- Containment contracts: 58 verified after the critique boundary was added.
- New type errors: zero before freeze.
- Anonymous: `401`.
- Wrong method: `405`.
- Wrong media: `415`.
- Oversized body: `413`.
- Extra field, missing request ID, invalid timing, overlong explanation and unpaired manipulation answer: `400`.
- First grade: `200`, non-idempotent.
- Same-input retry: `200`, idempotent.
- Changed-input retry under the same ID: `409 request_id_conflict`.
- Current grades after retry: one.
- Submission receipts after retry: one.
- Emergent candidates from the novel explanation: one.
- Grade evidence body and kind: exact.
- New-request amendment: persisted and prior explanation cleared.
- Matched pair split: one of one.
- Manipulation scoring and answer: written atomically.
- Repeat self-agreement: one of one.
- Cross-person route: hidden `404`.
- Cross-person RPC: `403`.
- Direct receipt insert: `403`.
- Incomplete run: `409`.
- Forced construct failure: `500`, zero grade, evidence and receipt.
- Forced run-detail failure: `500`, zero grade and receipt, unchanged flags, no answer.

## Database readback

- Receipt RLS: enabled.
- Owner select policy: present.
- Authenticated atomic submission execution: allowed.
- Anonymous atomic submission execution: denied.
- Authenticated direct receipt insertion: denied.
- Migration `20260918163000`: recorded.
- Atomic submission function overloads: exactly one.

## Cleanup

Auth users, identities, profiles, runs, items, grades, receipts, evidence, constructs and both transient triggers all read back as zero.

The management credential was used only in process memory. No credential value was emitted, written to an artifact or committed.
