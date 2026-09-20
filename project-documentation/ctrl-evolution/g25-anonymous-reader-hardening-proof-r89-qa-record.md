# G25 anonymous-reader hardening proof R89 QA record

## Static and catalog proof

- Target functions: 8.
- Functions resolved: 8.
- Security-mode matches: 8.
- Anonymous ACL matches: 8.
- Authenticated ACL matches: 8.
- Service ACL matches: 8.
- Inherited `PUBLIC` execution denied: 8.
- Subject and service guard markers present: 4 of 4.

## Runtime smoke

- Authenticated self pending-memory read: pass.
- Authenticated cross-subject pending-memory read: blocked.
- Authenticated self role read: pass.
- Authenticated cross-subject role enumeration: blocked.
- Service pending-memory read: pass.
- Service role read: pass.
- Persistent synthetic fixture rows: zero.

## Advisor readback

- Anonymous privileged-function findings: 17 to 12.
- Authenticated privileged-function findings: 21 to 17.
- RLS-without-policy findings: 24 unchanged.
- Public-extension findings: 2 unchanged.

## Boundaries

- Production grants remain unchanged on all eight targets.
- Production function definitions remain unchanged on all eight targets.
- Production writes: zero.
- PostgREST transport smoke: not yet run.
- Production mutation readiness: false.

## Verdict

`ISOLATED_SUBJECT_BOUNDARY_AND_LEAST_PRIVILEGE_PASS_PRODUCTION_UNCHANGED`
