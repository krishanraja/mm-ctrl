# G25 legacy producer adapters R3 QA

Date: 17 September 2026

Verdict: `PASS_WITH_TWO_RUNTIME_BLOCKERS`

## Executed evidence

- `prepared-intelligence-producer-adapters.r3.test.ts`: 12 passing cases.
- Prepared-object plus adapter suites: 28 passing cases.
- ESLint passes on the adapter and test.
- Structural checker validates the contract, exact findings, paths, test names and absence of runtime imports.
- Documentation links and whitespace checks pass.

## Blockers found

### News qualification receipt

The current display payload cannot prove single-source standing or exact freshness because source tier and exact publication evidence were discarded before caching.

### Decision-watch evidence receipt

The current watch alert cannot prove the evidence that moved the decision because `verifyClaim` evidence is not carried into the alert. It also lacks a specific effect on the live call.

These are productive failures. The old gathering, verification and scoring logic remains protected. The next work is to preserve its receipts, not replace it or claim parity prematurely.

## Bounded claim

Complete legacy-shaped evidence can be mapped into the new prepared object without weakening audience, provenance, freshness, Brain-context or read/audio parity rules. Current production-shaped rows cannot yet satisfy that contract.
