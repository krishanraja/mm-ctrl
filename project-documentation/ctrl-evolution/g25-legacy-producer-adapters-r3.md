# G25 legacy producer adapters, R3

Status: `local_characterization_pass_with_required_producer_repairs`

Machine contract: [g25-legacy-producer-adapters-r3.json](g25-legacy-producer-adapters-r3.json)

Prepared-object dependency: [G25 prepared-intelligence seam R2](g25-prepared-intelligence-seam-r2.md)

Verification: [G25 legacy producer adapters R3 QA](g25-legacy-producer-adapters-r3-qa-record.md)

## Result

Two dormant pure adapters now describe the evidence that existing news and decision-watch machinery must preserve before it may enter the new prepared-intelligence boundary.

When given complete evidence, they produce compatible `news_signal` and `decision_return` objects. Both then compose into one prepared object with the same written and audio blocks.

The exercise also found two real legacy handoff defects. Treating the current display rows as sufficient would have hidden both.

## News finding

The old news pipeline does valuable work before display:

- AI-native filtering;
- cross-source clustering;
- source-tier admission;
- freshness scoring;
- category balance;
- Brain-lens relevance;
- exclusion and dislike handling.

However, the cluster knows more than the cached display card retains. The display card loses exact publication time, representative source tier and a source-to-URL evidence structure. `timeAgo`, a numeric freshness score and a source count are not evidence receipts.

R3 therefore holds the current display-card shape. A news item adapts only when it carries exact source evidence, source tier, publication time, matched Brain context and a decision-specific `why_it_matters` statement. Reputable single-source reporting remains possible without pretending it was corroborated.

## Decision-watch finding

The watch loop correctly limits itself to load-bearing, web-checkable claims and detects meaningful verdict or confidence movement. Its verifier returns the sources used. The watch loop currently discards those sources when it creates `decision_alerts`; the briefing helper then turns the alert into a spoken announcement and a generic prompt to re-run the decision.

R3 refuses that lossy row. A decision return adapts only when it carries:

- the real decision and claim identity;
- an open status;
- the exact watch kind;
- a bounded evidence snapshot from the verification;
- a specific statement of how the live call may change.

This protects the useful return loop while removing the “business horoscope” failure mode.

## What passed

- 12 producer-adapter tests;
- 28 combined prepared-intelligence tests;
- corroborated and reputable-single news;
- stale, thin, incomplete and miscounted-news holds;
- evidenced decision return;
- missing evidence, missing decision effect, resolved alert and unknown-kind holds;
- mixed legacy news and decision return through one read/audio object.

## Authority limit

No live producer was edited. No runtime imports either adapter. No schema, row, external source, model, user interface, delivery path or deployment changed.

## Next gate

Build two pure receipt creators at the point where the legacy systems still possess the necessary facts:

1. a qualified-news receipt created from the cluster plus matched Brain lens before display fields are stripped;
2. a decision-observation receipt created from the watch verification result before its evidence is discarded.

Prove their deterministic shape and failure behavior with fixtures. Only then propose any runtime or storage integration.
