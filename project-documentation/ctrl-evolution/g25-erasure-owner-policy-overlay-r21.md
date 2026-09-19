# G25 erasure owner-policy overlay, R21

R21 binds the R19 founder decision and R20 planner to the four exact `owner_id` foreign-key paths that R18 left unresolved.

## What changed

The policy question is no longer unresolved. Every owner match now means `operator_custody_gate`:

1. revoke the removed operator's access;
2. never treat ownership as authority to erase the Brain;
3. preserve differently-subjected Brain data;
4. require authorised transfer or explicit customer closure;
5. keep auth-user deletion blocked until that custody action is proved.

## Why execution is still blocked

The current workspace, prepared receipt, correction and erasure-tombstone owner references cascade from `auth.users`. Prepared receipt custody is also bound into compound scope and encryption context. Changing a label in the registry cannot make those mechanics safe.

R21 therefore converts four policy blockers into four explicit schema blockers. The separate two tombstone-retention blockers remain unchanged. A non-cascading custody candidate and a multi-identity database canary are required before any auth deletion or runtime use.

R21 is an immutable overlay on the exact R18 registry hash. It does not rewrite R18's decision-time evidence.
