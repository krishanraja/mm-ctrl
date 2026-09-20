# G25 prepared runtime privilege cutover, R32

R32 turns the generation transition into an enforceable database capability boundary.

After this overlay, the service role has four prepared-intelligence entrypoints: create through stable custody, correct across both generations, erase across both generations, and read through the unified current reader. The three legacy-only operations remain in history but are no longer executable by the runtime role.

## Why this matters

A documented preference for the new path is not a cutover. If old code can still call a legacy-only erasure, or write rows directly around the new functions, one deployed caller can silently recreate the partial-Brain states R29 through R31 were built to prevent.

The database should make the wrong path unavailable, not merely unfashionable.

## Verified locally

- The service role cannot execute legacy-only create, correction or erasure.
- The service role can execute custody-native create, both-generation correction, both-generation erasure and unified current read.
- All four active entrypoints are security-definer functions with fixed empty search paths.
- Calls under the service role reach each active function's own strict shape validation rather than failing at the privilege boundary.
- Direct service-role inserts are closed on eight prepared receipt, dependency, event and correction tables.
- Direct service-role updates are closed on the five lifecycle columns previously exposed for invoker functions.
- Seven weakened privilege mutations fail the canary.

## Preserved history

R32 does not drop old functions or tables. R31 still reads valid legacy rows, while R29 and R30 can still correct or erase them through the active cross-generation operations. This preserves six months of proven machinery and historical evidence without leaving the old partial writers live.

## Security boundary

The custody writer and both-generation correction function become security definers because their callers no longer hold raw insert or lifecycle-update privileges. Both functions already use an empty search path and validate stable workspace, custody, subject, audience and purpose scope before consequential work. R30 and R31 were already service-only security definers.

This is a privilege cutover, not yet proof of valid end-to-end operations after the cutover. R32 proves that calls reach the active contracts and that wrong capabilities are absent. A following canary must execute valid create, correct, erase and read sequences through the service role before migration planning.

## Boundary

This is a non-migration local PostgreSQL proof. It does not alter application callers, remove historical database objects, test concurrent callers, prove Supabase-local or PostgREST behavior, deploy a runtime, or authorise a linked database change.
