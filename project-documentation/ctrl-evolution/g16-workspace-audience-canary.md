# G16 workspace and audience canary

Status: live substrate verified; behavioural transaction pending a writable database test connection

Date: 8 September 2026

## Outcome

The first real Living Brain substrate is now present in the production Supabase project `Mindmaker AI` (`bkyuxvschuwngtcdhsyg`). It is additive, empty and disconnected from existing customer paths. It does not migrate, reinterpret or delete any legacy memory or decision row.

This canary proves the storage and containment boundary before an ingestion pipeline, synthetic workspace, customer account or UI adapter is allowed to write to it.

## Live schema

Eleven tables now separate:

- workspaces, roles and audience grants;
- encrypted sources and source-bound assertions;
- stable Brain item identities and append-only versions;
- evidence links between item versions and assertions;
- stable typed relationship identities and exact-endpoint versions;
- evidence links between relationship versions and assertions.

The migration enforces one current item version, one current relationship version, sequential predecessor chains, exact current relationship endpoints, source and evidence scope equality, and deferred evidence requirements for trusted or held truths and every semantic relationship.

## Containment contract

- All 11 tables have row-level security enabled and forced.
- All 11 tables have one SELECT policy for the `authenticated` role.
- Every SELECT requires a non-anonymous JWT session.
- Workspace content also requires an active workspace membership and an active, unexpired exact-audience grant.
- The `anon` role has no table privileges.
- The `authenticated` role has SELECT only and no INSERT, UPDATE or DELETE privilege.
- `service_role` retains CRUD for a future server-side adapter.
- All seven private guard functions are non-definer and are not executable by `public`, `anon` or `authenticated`.
- Source content, assertion statements, meanings and explanations have ciphertext fields and explicit encryption versions.

Audience equality is deliberately conservative in this canary. It prevents evidence from silently widening a conclusion. A future item-level release workflow may create a separately authorised broader projection, but it cannot mutate the private source into a wider audience.

## Applied receipts

| Repository migration | Live version | Live name | SHA-256 |
|---|---|---|---|
| `20260908111121_brain_workspace_audience_canary.sql` | `20260908112247` | `brain_workspace_audience_canary_20260908` | `882a3658f5d3d4704fad7e1bc2f344085d451169dd4fd8e08a27d5de2ea812a5` |
| `20260908112440_brain_anonymous_session_and_fk_hardening.sql` | `20260908112649` | `brain_anonymous_session_and_fk_hardening_20260908` | `c9e18e5d86b6c151377578a298161d728242b6104eada91e2734da85fb08f7bc` |
| `20260908112746_brain_rls_initplan_hardening.sql` | `20260908112847` | `brain_rls_initplan_hardening_20260908` | `0a51965af353619b47bd4f6b3d7c8b3ad02630525a2f777ef27df6cc32b0426d` |

The first live advisor pass revealed two useful defects before data existed. Anonymous-auth users receive the database `authenticated` role, so all policies were hardened to reject an `is_anonymous` JWT. The live performance advisor also identified missing foreign-key coverage and per-row JWT evaluation; 18 indexes and scalar-subquery JWT initialization corrected those issues.

## Verification receipt

Live readback after all three migrations returned:

- 11 policies, all 11 explicitly anonymous-session closed;
- all 11 JWT checks initialized once per statement;
- 18 advisor-requested covering indexes;
- 9 custom guard triggers, including 4 deferred constraint triggers;
- effective ACLs of anonymous none, authenticated SELECT only and service-role CRUD on every Brain table;
- zero rows across all 11 Brain tables;
- zero Brain security-advisor findings;
- zero Brain performance findings other than expected `unused_index` information on a new empty schema.

The committed behavioural suite is `supabase/tests/database/brain_workspace_audience_canary.test.sql`, SHA-256 `9a85bf40f607c2451d873886dd3b0da3da2d4f968dad9f7fc97f0a2e816203ae`. It creates two workspaces and four identities inside a transaction, tests workspace and audience separation, rejects anonymous-auth sessions and browser writes, rejects cross-audience evidence, and ends with `ROLLBACK`.

The Supabase management SQL connection rejected the suite at its first INSERT with SQLSTATE `25006` because that connection is read-only. No synthetic row was written. This is recorded as a proof limitation, not represented as a passing behavioural run.

Repository release gates on the complete working branch passed after the live readback:

- documentation, standards and G16 static canary contracts;
- 44 trust-containment contracts and 4 service-auth tests;
- G14 Decision Bench contract, React and rendered interaction checks;
- G15 Judgement Resolution and retained R2 interaction checks;
- 920 tests across 59 files;
- type checking with zero new errors against the recorded 94-error legacy baseline;
- changed-file lint and Git whitespace validation;
- a production Vite build across 2,796 modules and 3 of 3 prerender routes.

The build retains the repository's known large-chunk and mixed static/dynamic Supabase import warnings. This canary introduces neither warning and adds no client bundle dependency.

The destructive rollback source is `supabase/rollback/20260908111121_brain_workspace_audience_canary_rollback.sql`, SHA-256 `85f06aa16d40222c1ff819d8bdc9bf5d9d1904c19c379c830851743441a6bf51`. It has not been executed. Once real Brain data exists, rollback requires a separate exact approval and an export or confirmed zero-row readback.

## What this does not prove

- No customer, operator or synthetic account has been created.
- No UI reads these tables.
- No ingestion, encryption-key, projection or export adapter writes these tables.
- The committed transaction suite has not run against a writable test connection.
- No claim is made yet about diagnostic quality, memory usefulness, retrieval quality or customer value.
- The existing `user_memory`, `memory_edges` and decision architecture remains untouched.

## Next exact gate

Build the smallest server-side Brain adapter against one designated synthetic workspace. It must encrypt source and interpretation payloads, use service-role writes only, run the committed behavioural suite through a writable non-customer test connection, expose a read-only audience-scoped projection, and prove correction propagation before the approved Decision Bench or Living Map consumes it.
