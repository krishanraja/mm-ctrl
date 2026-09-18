# G25 R111 QA record

**Date:** 18 September 2026  
**Target:** isolated Supabase project `legibility` (`cgkcplcamsijghalintq`)  
**Production writes:** zero  
**Production deploys or secret changes:** zero

## Focused deterministic checks

- 163 package, provenance, demotion, release, project-binding and request-boundary tests passed.
- 58 trust-containment contracts passed after the critique route boundary was added.
- Typecheck stayed at the accepted baseline: current 94, baseline 94, new 0.

## Hosted proof

The hosted route returned the expected strict boundary statuses:

- anonymous `401`;
- wrong method `405`;
- wrong media type `415`;
- oversized body `413`;
- unexpected field `400`;
- missing request identity `400`;
- direct capability RPC `403`; and
- direct generated-artifact insert `403`.

One real model-backed request produced exactly one run, one skill export, one generated artifact and one private ZIP. The final frozen run produced fifteen provenance rows, one cited transcript source, two cited evidence spans and two paid-call receipts because the provenance repair used its one permitted second pass. Counts may vary with model output, but the contract requires at least one provenance row and one cited span, never a fixed flattering total.

An exact retry returned the same run and artifact. Reusing the request identity with changed input returned `409 request_id_conflict`. A second tenant read zero artifact rows.

Five prior runs produced `429 daily_run_limit`. Recorded daily spend over the hard ceiling produced `429 daily_spend_limit`.

Changing a source decision after reservation produced `409 source_changed_retry`. It left zero exports, artifacts and storage objects, and the run closed as failed.

A forced artifact-write failure occurred after ZIP upload. The database transaction rolled back the export and provenance writes, the route removed the uploaded object, and the run closed as failed. Zero partial package rows or objects survived.

## Cleanup

The final proof removed all transient auth users, runs, exports, artifacts, provenance, usage rows, storage objects and failure triggers. Every cleanup count was zero.

## Database and deployment readback

- migration `20260918173000` is recorded;
- hosted function version 1 is `ACTIVE` with JWT verification enabled;
- Edge and Vault capability names exist without exposing their values;
- reserve and finalize each have one overload;
- authenticated users cannot directly insert skill exports, generated artifacts or provenance rows; and
- the owner-folder private Storage insert policy exists.

## Boundary

This is isolated proof of authority, provenance, recoverability and rollback. Real-leader usefulness, multi-environment package performance, production scale, production cutover and legacy retirement remain open.
