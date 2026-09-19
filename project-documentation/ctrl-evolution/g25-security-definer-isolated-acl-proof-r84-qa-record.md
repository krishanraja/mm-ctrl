# G25 isolated privileged ACL proof R84 QA record

## Preflight

- Recovery target exposure count: 45.
- Recovery target exposure digest: `e2917473e664296685ec4975f658ca3b`.
- Production R82 parity: exact.

## Migration

- Applied migration: `g25_security_definer_high_risk_acl_r83`.
- Target: approved blank recovery project only.
- Statements: nine ordinary-role revokes and nine service-role grants.
- Function body changes: zero.
- Function calls: zero.
- Customer rows present: zero.

## Verification

- First verifier attempt: failed before returning evidence because the catalog scan included aggregates.
- Correction: restrict the scan to `p.prokind = 'f'`.
- Second verifier attempt: pass.
- Anonymous denials: 9 of 9.
- Authenticated denials: 9 of 9.
- Service allowances: 9 of 9.
- Owner allowances: 9 of 9.
- Definition digests unchanged: 9 of 9.
- Internal sync callers preserved: 11.
- Verification digest: `ffb416d4290ee946209916d0e11629b1`.

## Independent advisor readback

- Anonymous privileged-function warning count: 41 to 32.
- Authenticated privileged-function warning count: 45 to 36.
- RLS-without-policy count: unchanged at 24.
- extension-in-public count: unchanged at 2.

## Production postcheck

- Anonymous allowed: 9 of 9 original targets.
- Authenticated allowed: 9 of 9 original targets.
- Service allowed: 9 of 9 original targets.
- Definitions unchanged: 9 of 9.
- Production writes: zero.

## Verdict

`ISOLATED_ACL_EFFECT_PROVED_PRODUCTION_BLOCKED`
