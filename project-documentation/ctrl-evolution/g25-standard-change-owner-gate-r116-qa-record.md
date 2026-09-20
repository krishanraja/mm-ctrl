# G25 standard-change owner gate R116 QA record

Observed: 2026-09-19
Target: isolated Supabase project `cgkcplcamsijghalintq`
Production writes: zero

## Predeclared acceptance

1. Only a passed R115 Check with all findings holding can become review-ready.
2. The owner sees exact before, after, evidence, consequences and planned hashes.
3. Rejection cannot mutate the active standard or criteria.
4. Approval is atomic, hash-bound, idempotent and serialized per owner.
5. Two simultaneous approvals have one winner.
6. Stale source, stale criteria, changed replay and non-current reversal fail closed.
7. Reversal restores exact prior standard bytes and the complete prior criteria snapshot.
8. Cross-owner reads look absent and browser table writes remain closed.
9. Deployment and release authorization remain false.
10. Rollback and exact restore preserve R115 and pass the hosted proof again.

## Result

All ten signals passed. The hosted probe used three real R115 candidate conveyors, recorded one rejection, raced two approvals, forced one stale packet, inserted an unrelated later head to challenge reversal, then restored exact bytes and criteria. Every synthetic row cleaned to zero.

The rollback operator removed five R116 tables, seven R116 helper and owner functions, one Edge function and the R116 migration row. It read back all five R115 tables and all three R115 Edge functions intact. The restore operator re-applied the one migration, re-deployed the JWT-enabled endpoint and passed source-download identity and hosted behavior again.

The first fresh independent review vetoed the frozen candidate for two rollback defects. The database rollback trusted an R116-owned standard head without also proving that the current criteria still matched that head's exact R116 snapshot. The operator also removed the Edge route before the transactional database preflight, so a refusal could leave the route missing. The repair now binds every affected owner's current standard artifact and complete criteria snapshot to one `standard_versions` record before any mutation. It also completes the transactional database rollback and migration-history repair before removing the route.

The corrected failure path was then exercised live. A criteria-only later change was introduced after a complete owner application and reversal. Rollback refused with `r116_rollback_unknown_later_criteria_head`; all five R116 tables, the fixture application, the migration row, the changed criterion and the active Edge route remained present. After the exact R116-owned criteria snapshot was restored, the complete rollback succeeded, R115 remained intact, restore succeeded and the full hosted proof passed again with zero fixture residue. This chronology is retained because the important standard is not merely that rollback eventually passes, but that an unsafe rollback cannot partially erase the live control plane.

The second fresh review vetoed the repair because the preflight and mutation shared a transaction but did not yet prevent a concurrent writer from entering between them. It also found three deterministic rollback exceptions still using retryable SQLSTATE `40001`, the same class already removed from forward application. The next repair moved an access-exclusive lock over all R116 authority tables, `standard_change_requests`, `criteria` and `generated_artifacts` ahead of all snapshot derivation. It also changed every deterministic rollback refusal to the non-retryable application code. The live race proof holds that exact lock while a concurrent criteria write attempts to enter and confirms the writer cannot cross the preflight boundary.

The third fresh review found that a waiting access-exclusive lock sequence could invert the live RPC order: rollback originally named review packets before owner decisions, while the decision RPC touches those tables in the opposite order; reversal receipts and applications had the equivalent inversion. The final lock statement now follows receipt-first ordering and uses `NOWAIT`. A live authenticated prepare RPC was held open inside its transaction while rollback ran. Rollback refused immediately, no `40P01` deadlock occurred, the owner transaction completed after release, and database plus route state remained unchanged. This test complements the criteria-writer proof: one proves a writer cannot cross a held rollback boundary; the other proves rollback does not wait into an active owner transaction.

Database readback found five forced-RLS tables, five owner-select policies, zero ordinary-role write grants, zero exposed helper functions, three authenticated owner RPCs and zero retained R116 data rows. The database linter returned no finding for any R116 routine after the final repair. Existing unrelated lint findings remain baseline debt and were not changed.

Focused tests passed in two files with fifteen tests. TypeScript no-emit passed. Full repository gates are recorded in the machine contract after the final frozen run.

## Historical integration replay

The final replay found and repaired four stale preservation assumptions outside the R116 runtime:

- The repository function manifest now fingerprints 122 routes and 189 shared files, with 88 JWT-enabled and 34 JWT-disabled routes. The transitive environment map covers all 122 routes and still has zero missing imports or unclassified symbols.
- R57 now records 105 migration-only identity candidates. The eleven new R116 entries are JSON-bearing owner-review, application, reversal and standard-version receipts. R60 therefore compiles 221 read-only catalog targets rather than 210.
- R79 now distinguishes the 115 functions observed both live and local from seven later local-only routes, including `review-standard-change`, without inventing production deployment.
- The archived R77 founder-lock checker now accepts only the exact R116 next-action boundary for a minimal human review projection while production, merge, cutover, release and legacy retirement remain closed.

The complete documentation inventory passed at 122 Edge Functions, 51 hooks and 196 migrations. The historical post-documentation chain then passed from R66 through R93 after the stale guards above were corrected. The standard prebuild still reports nine inherited em-dash files outside R116; the actual application compiler passed and those historical files were not rewritten to conceal baseline debt.

## Honest limit

R116 proves the data and authority seam, not the customer experience. A leader-facing review surface must still prove plain-language comprehension, low cognitive load, mobile interaction, evidence drill-down and calm reversal. No claim beyond the isolated headless gate is unlocked.
