# G25 lossless producer receipts R4 QA

Date: 17 September 2026

Verdict: `PASS_WITH_BOUNDED_CLAIM`

## Executed evidence

- 12 receipt-creator tests pass.
- 40 tests pass across receipt creation, producer adaptation and prepared-object projection.
- Both receipt types are deterministic under source reordering.
- ESLint passes on implementation and tests.
- The structural checker confirms dependencies, exact test receipts and zero imports from live producers.
- Documentation links and whitespace checks pass.

## Failure cases exercised

- weak single-source news;
- unrelated cluster member;
- missing publication evidence;
- unknown runtime audience;
- non-load-bearing decision movement;
- verifier evidence with no inspectable URL;
- missing decision effect;
- malformed confidence;
- order variation in news members and decision evidence.

## Bounded claim

The repository can create lossless, deterministic producer receipts from facts already available in the legacy pipelines and carry them through the new prepared-intelligence boundary. Runtime capture and persistence remain unimplemented and unauthorised.
