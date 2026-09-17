# G25 whole-Brain erasure planner R15 QA record

Date: 17 September 2026

## Commands and results

- `npx vitest run supabase/functions/_shared/whole-brain-erasure-plan.r15.test.ts --reporter=verbose`
  - PASS: 1 file, 7 tests.
- `npm run typecheck`
  - PASS: no new type errors. Existing baseline: 94. Current: 94.
- `npm run brain:g25:erasure-plan-r15-check`
  - Expected gate: planner, contract, policy hold and completion boundaries agree.

## Behaviors proved

- all consequential policies must be bound;
- all nine R14 planes must be represented;
- access revocation is stage zero;
- missing or unproved results cannot complete;
- customer-controlled copies remain an explicit action state;
- hard failure and resumable pending stay distinct.
- the bound retention policy survives into the plan that an executor would consume.

## Still unproved

- live schema discovery;
- database deletion and rollback;
- provider deletion APIs and receipts;
- backup expiry and restore-time suppression;
- customer-facing interaction and copy;
- linked Supabase, PostgREST and concurrency parity;
- deployment, merge or production use.
