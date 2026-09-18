# G25 build-sort authority R108 QA record

**Observed:** 18 September 2026  
**Target:** founder-authorized isolated `legibility` project  
**Production writes:** zero

## Frozen implementation

- Route SHA-256: `8e91c307620a72ce29836dd15b24ae444429841f3654b980c55827dbe775b7b8`
- Prompt SHA-256: `4488ab1f61387d4d89f38e5c02f7370a272590f5ed1f6a336278c8d57ff94293`
- Composition SHA-256: `204b4b2ff11d12f5d426c5234d77b163da85795f53480cfbff2658895cfc0f55`
- Composition tests SHA-256: `3c086ac3d3182b687d8ee398aec795ad64d2e8ab4b56eda7fd02a7250e20d4d0`
- Authority migration SHA-256: `a877e0974b725c2e03f6c09c22a96b97cde15dcdf390e50b636c69e23fb4d660`
- Hosted probe SHA-256: `0717fdd44c8d8cc6643e254e4c0e80377d8e6d177b750ff250586c1bd4416d13`
- Containment manifest SHA-256: `34922f1cbbadf2cb114175615f68fdc61ce8b24506937767f15a78cc38923f82`
- Function config SHA-256: `d694cdc16d1f7814adf2b7169d2ae4604997b82dad1b24c80c2e981094a0ecce`
- Hosted bundle SHA-256: `2ccc36fc00e67fe46162ba31b417a782cfd8edb9b4657331105524872c1a3e5d`
- Hosted version: 2, active, JWT verification enabled

## Deterministic and hosted checks

- Sort-composition tests: 66 passed.
- Containment contracts: 58 verified.
- New type errors: zero.
- Anonymous: `401`.
- Wrong method: `405`.
- Wrong media: `415`.
- Oversized body: `413`.
- Extra field: `400`.
- Missing request ID: `400`.
- Invalid depth: `400`.
- First reservation: `202`.
- Same-input replay: `200`, same run, idempotent.
- Changed-input replay: `409 request_id_conflict`.
- Background terminal state: `done / ready`.
- Sort runs created for the primary request: one.
- Paid-call usage rows: one.
- Usage replay: idempotent.
- Final deck items: 15.
- Positions contiguous: yes.
- Repeat probes resolve to earlier items: yes.
- Every item owner exact: yes.
- Cross-person run rows visible: zero.
- Cross-person item rows visible: zero.
- Cross-person update rows: zero.
- Cross-person usage write: `403`.
- Forced late insert failure: `400`, zero items, run still running.
- Retired target finalization: `400`, zero items.
- Recorded-spend gate: `429 daily_spend_limit`.
- First five daily reservations: allowed.
- Sixth daily reservation: `429 daily_run_limit`.

## Database readback

- `harness_runs` RLS: enabled.
- Owner select policy: present.
- Authenticated reservation, usage and finalization RPC execution: allowed.
- Anonymous execution for all three RPCs: denied.
- Migration `20260918160000`: recorded.
- `harness_runs.request_id`: present.
- Reservation function overloads: exactly one.

## Cleanup

Auth users, identities, profiles, runs, items, usage rows, constructs and the transient trigger all read back as zero.

The management credential was used only in process memory. No credential value was emitted, written to an artifact or committed.
