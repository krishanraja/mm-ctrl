# G25 anonymous-reader hardening proof R89

**Status:** The first reader lane is hardened and behavior-tested in the isolated recovery project. Production is unchanged.

## What changed in isolation

Eight privileged reader functions now have explicit dispositions instead of sharing the same default-public posture:

- the pure bootstrap calculation runs as the caller, not as the owner;
- conversion metrics, the unused text role overload and company hashing are service-only;
- pending memory remains available to the signed-in person and trusted service, but rejects a different subject;
- the role helper still supports existing RLS policies, but cannot reveal another person's role to an ordinary caller;
- registration intake and share-card lookup remain deliberately public, minimal and definition-identical.

Every function now denies inherited `PUBLIC` execution. The exact anonymous, authenticated and service grants are explicit.

## Runtime evidence

A self-cleaning two-user database smoke used simulated authenticated and service JWT claim contexts. Each person could read their own pending fact, one person could not read the other's fact or enumerate the other's facilitator role, and the trusted service path could still read both protected objects. All Auth, profile, role and memory fixtures were removed before the test completed.

The role helper remains attached to five production policies. The isolated replay contains the three application-schema policies; its two Storage policies remain part of the already-recorded non-schema recovery gap rather than being silently counted as present.

## Security movement

The isolated advisor moved from 17 to 12 anonymous privileged-function findings and from 21 to 17 authenticated findings. The 24 RLS-without-policy notices and two public-extension notices did not change.

This proves the database subject boundary under simulated JWT claim context. It does not yet prove the HTTP/PostgREST transport, authorize a production migration, retire any function or settle the remaining privileged routes.
