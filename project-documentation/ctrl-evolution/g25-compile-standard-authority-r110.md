# G25 compile-standard authority R110

**Status:** `compile-standard` now passes an isolated hosted proof with real model use. Production was not targeted.

## What changed

The old compiler was pinned to production, switched to service-role authority, accepted an open request, admitted incomplete decks, used warning-only spend control and wrote the rubric in pieces. It superseded the old criteria first, then inserted the new criteria, then updated constructs, then attempted the downloadable artifact. An artifact failure was explicitly swallowed. A late failure could therefore leave a new standard without its promised file, or old criteria retired without a complete replacement.

The compiler now:

- binds itself to the configured isolated project and retains the caller's RLS boundary throughout background work;
- requires both the person's JWT and a private function-to-database capability that is not available to the browser;
- accepts only a strict, bounded request with a stable request ID;
- reserves one compile from a ready owned sort only when every item has an atomic grading receipt;
- fingerprints the exact grades in position order before work begins;
- refuses finalization if any answer changes while the model is working;
- records exactly one paid-call receipt and enforces five daily compiles plus the two-dollar recorded-spend gate;
- keeps criterion names in the person's vocabulary, validates deterministic observables and leaves uncheckable constructs visibly untested;
- writes supersession, new advisory criteria, construct poles, the complete standard artifact and the terminal run state in one transaction;
- routes a confounded instrument to `halted` and an inconsistent grader to `template_and_voice` without paying for a model call;
- uses the same stable request identity for the client's bounded retry.

## What the hosted proof established

A transient person supplied four fully graded matched pairs and three repeat judgements around one concrete construct. One real model call produced one current advisory criterion, one non-empty standard artifact, one exact provenance chain and one usage receipt. The identical retry returned the first run; changed input under the same request ID returned `409`.

Anonymous, malformed, oversized and unexpected requests failed. A second person could neither see the sort through the route nor reserve it directly. More importantly, the owning person also received `403` when attempting to call the database reservation without the private compiler capability. Direct criterion insertion was denied. Incomplete, unreceipted and unfinished sorts were all refused before spend.

A transient usage trigger changed one answer after the grade snapshot was pinned. The compiler failed and left zero criteria and artifacts. A separate artifact trigger failed after the final transaction had begun; criteria, artifact and construct changes all rolled back. A deliberately confounded deck reached `halted`, while repeat disagreement reached `template_and_voice`; neither created a usage row. The sixth compile returned `429 daily_run_limit`, and a separate person at two dollars of recorded spend received `429 daily_spend_limit`.

Every transient person, source row, compiled row, usage row and trigger read back as zero after cleanup.

## Boundary

This proves one isolated authority and transaction boundary, not that one synthetic construct predicts a leader's judgement in the wild. Criterion validity, generalization, capability rotation under incident conditions and concurrent use at scale remain open. Production cutover and legacy retirement remain closed.

The next restoration stage must be chosen by product value and dependency order. Existing news curation, audio briefing and Brain-control machinery remain preserved until each path has explicit parity and improvement evidence.
