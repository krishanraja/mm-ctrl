# G25 prepared-intelligence R2 QA record

Date: 17 September 2026

Verdict: `PASS_WITH_BOUNDED_CLAIM`

## Frozen review object

- implementation: `supabase/functions/_shared/prepared-intelligence.r1.ts`
- focused tests: `supabase/functions/_shared/prepared-intelligence.r1.test.ts`
- machine contract: `project-documentation/ctrl-evolution/g25-prepared-intelligence-seam-r2.json`
- structural checker: `scripts/check-ctrl-g25-prepared-intelligence-r2.mjs`

## Executed evidence

- 16 focused Vitest cases pass.
- ESLint passes on the implementation, tests and checker.
- The structural checker proves all contract paths, preservation links and named test receipts exist.
- The preservation-register checker still protects all 22 capability systems.
- Documentation links and whitespace checks pass.

## Adversarial cases included

- empty eligible supply;
- weak single-source news;
- reputable single-source news without invented corroboration;
- ordinary news posed as a decision return;
- missing decision linkage;
- cross-audience evidence;
- negative-feedback suppression;
- topic exclusion;
- duplicate signal identity;
- conflicting evidence identity;
- unknown runtime enum;
- malformed feedback control;
- candidate and evidence reordering;
- whitespace drift between source and projection.

## Honest claim

The local prepared-object boundary has a coherent and tested contract. It keeps read and audio semantically aligned while retaining provenance, Brain-selection receipts and control hooks.

It does not prove the upstream quality of news curation or decision monitoring, downstream audio playback or conversation, durable storage, production security, product delight or customer value. There are no runtime callers.

## Residual risks

- Prepared-object identity is a deterministic semantic key, not a cryptographic content receipt.
- Context references are validated identifiers, not authoritative Brain readback.
- The adapter trusts that upstream producers earned their signal classification, subject to the next producer-specific gates.
- Audio is represented as canonical spoken text only. Voice, timing, accessibility and recovery remain untested.
