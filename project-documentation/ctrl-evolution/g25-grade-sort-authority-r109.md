# G25 grade-sort authority R109

**Status:** `grade-sort` now passes an isolated hosted proof. Production was not targeted.

## What changed

The old route was pinned to production, accepted an open-ended payload and performed separate writes for the grade, grade evidence, emergent construct, manipulation flags and diagnostic answer. A failure near the end could leave a confident-looking but incomplete judgement record. It also logged user identifiers, had no request identity and allowed a slow older write to arrive after a later amendment.

The route now:

- binds itself to the configured isolated project and fails closed on mismatch;
- retains the authenticated caller's RLS boundary and never consumes service-role authority;
- accepts one exact request shape with a 4 KiB body limit and strict field bounds;
- requires a stable request ID and fingerprints the normalized answer;
- replays identical submissions without another write and returns `409` if the same ID carries changed content;
- accepts only a ready owned sort run and an item inside that owned run;
- commits the grade, optional person-authored candidate, exact evidence, optional manipulation answer, pair flags and receipt in one database transaction;
- lets a person amend a grade with a new request while preserving one current grade per item;
- serializes client writes so a slow earlier tap cannot overwrite the person's later correction;
- records progress only after the transaction has committed.

## What the hosted proof established

One transient person graded a synthetic ready deck. The first submission created exactly one grade, one receipt, one emergent candidate and one exact grade-evidence row. The identical retry returned the prior result and created no duplicates. Reusing the request ID with changed content returned `409`.

A new request amended the current grade and cleared its prior explanation. Completing the matched pair produced a one-of-one split and atomically stored the open manipulation answer and both pair flags. A later repeat agreed with the amended original. A second person received a hidden `404` from the route and `403` from direct RPC use. Direct receipt insertion was denied and an unfinished run returned `409`.

Two late-failure probes then tested the transaction itself. A forced construct insertion failure left no grade, evidence or receipt. A forced run-detail failure after the grade and pair-flag steps left no grade, no receipt, unchanged flags and no diagnostic answer. Every transient person, run, item, grade, receipt, evidence row, construct and trigger read back as zero after cleanup.

## Boundary

This proves authority, idempotency and atomicity for one grading interaction. It does not prove that generated pairs reveal a leader's actual judgement, that the instrument is valid across people, that compiled standards are useful or that multi-device offline amendments merge correctly. Production cutover and legacy retirement remain closed.

The next safe step is `compile-standard`: make the first judgement-compilation stage consume only a complete, owned and internally coherent sort record, with an atomic terminal result and honest halt states.
