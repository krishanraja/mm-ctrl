# G24 lifecycle precondition evaluator R70 QA record

Status: candidate, independent frozen review pending

Date: 2026-09-15

No runtime, database, UI, deployment or external action was performed.

This record covers executable loading mechanics only.

## Intended observable outcome

The production-shaped structural gate accepts no caller-owned authority object, authenticates exact local R66 and R70 raw bytes before parsing or dereference, rejects lossy UTF-8 input before parsing, and returns only a hard-coded trusted hold on any failure. No semantic success branch, result, evidence row or write is possible.

## Repaired R69 failures

1. Literal lone surrogate input is compared with its UTF-8 round trip before JSON parsing.
2. Hard-coded source and machine paths are read only inside the fail-closed boundary.
3. The production gate has no R66, R70, executable, selection or options object parameter.
4. The rejection envelope is constructed from trusted constants rather than machine or caller data.

## Predeclared gates

- machine materialization exact;
- exact R66, R70 and source identities;
- focused adjacent Vitest;
- permanent R69 regression attacks;
- missing and mutated local artifact-path tests;
- zero caller Proxy traps;
- exact primitive input limits and lossy UTF-8 rejection;
- static import reachability;
- founder-lock check;
- typecheck, strict lint, repository tests and documentation checks;
- changed-path and package-lock containment;
- clean single freeze commit;
- independent review of the frozen commit and tree.

## Current local evidence

- R70 source: 7,451 bytes.
- Source SHA-256: `e7b70f3816b38fa3744c1a86e627e835b770765745e370e569a350ddb1df05c9`.
- Git blob: `27a9d8767d6e666bcdd184f7b511951f6bb4026e`.
- Founder lock: `8ee0ef4dd286e7f13f54f2d80d26ea341783d2dc89bb858e91b865fa2ce77fbf`.
- R70 machine SHA-256: `bc83f908bc9b4a2fee46917ab9501b6ae730c5fe419b7f3c1e2a55c59314cb80`.
- The gate loads only to `verified_not_runnable` and otherwise returns the same trusted hold.
- Caller-owned authority objects have no production API slot.
- Raw R66 and R70 bytes are checked before JSON parsing.
- No semantic success branch exists.

## Producer verification before freeze

- Focused R70 package gate: pass. Exact materialization, 6 adjacent tests, 5 process restarts and 24 structural attacks.
- R66 parent authority replay: pass. 49 attacks, 20 of 20 exact selection proofs, 20 of 20 metadata export surfaces and 21 of 21 ordering bindings.
- Founder-lock checker: pass.
- Full Vitest: pass. 74 files and 1,315 tests.
- Typecheck: pass against the accepted baseline. Current 94, baseline 94, new 0, fixed 0.
- Strict ESLint on every changed JavaScript and TypeScript file: pass.
- Basic documentation and link integrity: pass across 428 current and reference Markdown files.
- `git diff --check`: pass.
- Changed-path credential-pattern scan: pass, zero files matched.
- Direct production Vite bundle: pass. The existing mixed Supabase client import and large-chunk warnings remain.
- Prerender: pass, 7 of 7 routes.
- `package-lock.json`: unchanged.

The full R66 parent replay was compute-heavy but completed successfully. That cost is a harness-efficiency observation for later modular optimization, not a reason to weaken or skip the authority check.

The top-level `npm run build` wrapper remains red because its prehook finds 29 em dashes in four untouched R2 council records. The direct bundle and prerender both pass, and R70 does not rewrite historical judge evidence to conceal the baseline failure.

All producer gates are now complete. Independent review remains after freeze. Until the exact frozen commit and tree pass that review, R70 is not authority.
