# G25 build-sort authority R108

**Status:** `build-sort` now passes an isolated hosted proof with an actual model call. Production was not targeted.

## What changed

The old route named the production project in source, switched all background work to service role, accepted an unbounded request, made request IDs optional, treated the daily spend cap as a warning, and wrote each deck row separately before marking the run complete.

The route now:

- binds itself to one configured Supabase project and fails closed on a mismatch;
- authenticates the caller and retains that caller's RLS boundary throughout the background build;
- accepts one exact, bounded request shape and requires a stable request ID;
- fingerprints every normalized input, so a replay reuses one run while changed inputs with the same ID return `409`;
- reserves the run under a per-person database lock;
- blocks a sixth daily build or a build after two dollars of recorded daily AI spend;
- records one paid-call receipt per run, including provider, model, token counts, latency and estimated cost;
- validates the whole deck in the database, rechecks every targeted construct is still the caller's current candidate, inserts all items and advances the run in one transaction;
- records a terminal failure instead of leaving a background run apparently active forever.

No target-person field exists. No service-role credential is consumed by the route. User identifiers are not written to route logs.

## What the hosted proof established

One transient person supplied five verified Brain facts. R107 converted them to current candidate constructs. R108 then made one real model call and produced a ready 15-screen deck. Fifteen, rather than the 22-screen short target, is honest: the fixture supplied no qualifying own artefacts and the public peer corpus remains deliberately empty, so the builder recorded those shortfalls rather than inventing work or attribution.

The same request ID and same inputs returned the original run without another paid-call receipt. The same ID with changed context returned `409`. The completed deck had contiguous positions, all repeat probes pointed to earlier screens, every row belonged to the caller, and exactly one usage receipt existed.

A second person saw none of the first person's runs or items, could not update the run, and could not record usage against it. A transient trigger then failed the final item insert. The transaction left zero items and the reserved run remained available for an explicit failure decision. After the trigger was removed, retiring the targeted construct caused finalization to refuse the stale deck, again with zero items.

The recorded-spend gate returned `429` at two dollars. Five run reservations succeeded for another person and the sixth returned `429`. All transient people, Brain material, runs, items, usage rows and trigger machinery read back as zero after cleanup.

## Boundary

This is authority and failure-integrity proof, not evidence that the generated pairs are world class or that the instrument measures judgement accurately. The peer corpus is still empty. No real leader graded the deck. Provider invoices were not reconciled against the estimate. Production cutover and legacy retirement remain closed.

The next safe step is `grade-sort`: one owner-bound, idempotent submission path that cannot partially grade a deck or let a stale or foreign item alter the judgement record.
