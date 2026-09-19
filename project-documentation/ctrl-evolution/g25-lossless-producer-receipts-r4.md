# G25 lossless producer receipts, R4

Status: `local_pure_receipt_gate_pass`

Machine contract: [g25-lossless-producer-receipts-r4.json](g25-lossless-producer-receipts-r4.json)

Dependency: [G25 legacy producer adapters R3](g25-legacy-producer-adapters-r3.md)

Verification: [G25 lossless producer receipts R4 QA](g25-lossless-producer-receipts-r4-qa-record.md)

## Result

Two pure local receipt creators now capture the useful legacy intelligence before its evidence is stripped away.

The full proven chain is:

`lossless news and watch facts -> producer receipts -> governed adapters -> one prepared object -> matching read and audio blocks`

This is the first executable bridge between valuable old machinery and the new Brain-led product model. It remains completely disconnected from runtime.

## Qualified-news receipt

The news creator works from normalized articles belonging to one candidate cluster, while exact source tier, URL and publication time still exist. It:

- verifies cluster membership with the existing title-token similarity rule;
- keeps one strongest receipt per distinct source host;
- retains a reputable single source without claiming corroboration;
- rejects weak single-source material;
- requires exact publication evidence;
- binds the matched Brain context, relevance and `why_it_matters` before display projection.

The receipt is deterministic under member reordering.

## Decision-observation receipt

The decision creator works from the watch transition and verifier evidence before the current alert write discards that evidence. It:

- recomputes whether the claimed trigger kind is earned;
- requires the real decision and claim link;
- retains unique inspectable source URLs and the observation time;
- requires a specific effect on the live call;
- rejects malformed confidence, missing evidence and non-load-bearing change.

The receipt is deterministic under evidence reordering.

## Honest limits

The creators do not modify either live producer and have no callers. They do not prove atomic storage, concurrency, correction propagation, erasure, live curation quality, decision-effect quality, audio delivery or customer usefulness.

Receipt evidence IDs use a deterministic locator fingerprint, not a cryptographic content receipt. The complete URL remains in the receipt, and the downstream prepared-object boundary fails closed if one identity points to conflicting facts.

## Next gate

Specify the smallest append-only persistence and transaction contract that can store these receipts without making a second Brain or weakening owner, audience, correction, retention and erasure rules. Prove it as a pure state-machine fixture before proposing a migration or runtime caller.
