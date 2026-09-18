# G25 memory-mutator hardening proof R90

**Status:** Five memory mutations are caller-bound and behavior-tested in isolation. The production risk is recorded but not remediated because production is unchanged.

## The defect

The live functions combine owner privileges with ordinary-role execution. Four of the five also contain a missing-identity defect:

- `verify_memory_fact` compares an owner to `auth.uid()` with SQL inequality. When the caller has no user identity, the comparison is `NULL`, not `true`, so the denial branch does not run and the fact can be updated by id.
- `fix_memory_fact` has the same three-valued comparison. Its fact update is constrained by the missing identity, but it can still insert a false dispute event against another person's fact and report success.
- both touch functions explicitly treat `auth.uid() IS NULL` as trusted. Because anonymous execution is currently allowed, a known fact id can receive false reliance signals.

`strengthen_memory_fact` was not vulnerable through the same route because its update requires an exact user match, but it shared the unnecessary anonymous grant.

## Isolated repair

All five functions deny anonymous and inherited `PUBLIC` execution. Fix, strengthen and verify are authenticated-user actions only. Touch remains callable by authenticated users and the service role because eight deployed workers use the batch route. Its body now distinguishes the service role from an anonymous null identity.

A self-cleaning two-person smoke proved that cross-subject fix, verify, strengthen and touch operations do not change the other person's fact. The owner can still strengthen, correct and dispute their own fact, with exactly one correction and one dispute event. The service path still records reliance. No fixture remains.

The isolated anonymous privileged-function count fell from 12 to 7. The authenticated count correctly remains 17 because the five customer actions are still intentionally callable after sign-in.

This is strong isolated database evidence, not a claim that the production exposure is fixed or that historical abuse has been ruled out.
