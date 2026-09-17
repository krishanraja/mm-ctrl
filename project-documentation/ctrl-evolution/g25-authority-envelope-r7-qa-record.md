# G25 authority envelope R7 QA

Date: 17 September 2026

Verdict: `PASS_FOR_LOCAL_CONTRACT_SCOPE`

## Mechanical evidence

- 14 focused authority-envelope tests pass.
- Workspace, owner, subject, audience and purpose mismatches fail closed.
- Both friendly audiences map to the existing canonical Brain vocabulary.
- Missing, duplicate, malformed and stale authority dependencies fail closed.
- Reordering dependencies and authority readback produces identical output and fingerprint.
- The repository checker pins the code, tests, contract, bounded claim and two remaining blockers.

## Honest boundary

This is not database authority. Current authority is represented by explicit fixture input, so R7 does not prove read locks, transactional currentness, purpose-sensitive RLS, ciphertext context, authenticated service behavior or production integration.

No Supabase call, migration, runtime producer change, UI, deploy or retirement occurred.
