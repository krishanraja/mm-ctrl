# G18 synthetic population and edge-case lab

Status: local deterministic corpus, test oracle and unlinked UI range harness complete; database seeding and diagnostic model evaluation pending

Date: 8 September 2026

## Product rule

Synthetic accounts exist to reveal where the Brain, diagnostic or interface breaks. They are not testimonials, efficacy evidence or a substitute for testing with real consenting users. Every account is visibly marked `synthetic_demo`, uses the reserved `.invalid` email domain and has a deterministic subject ID.

The corpus must test four different questions:

1. Can the system receive the source faithfully?
2. Can it decide whether the source may become durable evidence?
3. Can the diagnostic notice the consequential tension without inventing a person?
4. Can every approved UI surface render the resulting state without clipping, leaking, overstating or collapsing?

The fixture is therefore an oracle, not just sample copy. Each account records what a strong diagnostic must notice, what it must not infer and the smallest defensible next move.

## Population

The first curated population contains 48 synthetic leaders across multiple regions, scripts, roles, organisations and AI-transition decision families. Deterministic volume expansion currently produces exactly 1,672 input events without creating more fictional people.

The accounts cover:

- every G16 source type: voice, text, meeting, document, correction, observed action and external;
- every G16 audience: person-private, delivery-team-private, named company or project, approved pattern commons and public release;
- every designed UI state: ready, empty, sparse, quiet, loading, stale, error, rejected and deleted;
- every first-pass processing result: accept exact evidence, stage, clarify, abstain, quarantine, replay without duplication, reject a conflicting retry, propagate a correction, expire, erase, reject audience widening and decline an out-of-scope named-person evaluation;
- diagnostic postures: use, clarify, contrast, abstain, correct, quarantine, delete and decline.

## Failure and range coverage

### Evidence and time

- no evidence and one-source cold starts;
- exact retries and same-key conflicting retries;
- stale evidence, expired retention and future timestamps;
- late delivery versus valid-time ordering;
- direct correction, partial source erasure and whole-Brain erasure;
- stated preference versus observed action;
- held-back decision outcomes and disputed causal interpretation;
- two current sources containing materially different numbers.

### Consent, identity and audience

- off-record speech leaving no durable trace;
- consent withdrawal and item-level pattern-sharing approval;
- private personal evidence alongside company-scoped evidence;
- attempted private-to-public widening;
- sensitive third-party information requiring exclusion;
- role and employer change with different portability rules;
- two people with the same name in different workspaces;
- public efficacy copy without evidence or publication approval.

### Ingest and security

- low-confidence voice transcription, silent audio and overlapping speakers;
- corrupt OCR, password-protected documents, truncated uploads and unsupported large media;
- prompt injection embedded in a vendor document;
- HTML and script-shaped source text that must remain inert;
- redacted source material that must not be reconstructed;
- AI-generated prose that must not be attributed to the person;
- unsupported statistics and unverifiable external claims;
- a 1,000-event synthetic burst that must preserve ordering and idempotency.

### Language and interface

- English, Spanish-English code switching, Traditional Chinese, Arabic, Japanese and common accented Latin text;
- right-to-left text and mixed-direction metadata;
- very long names, roles and organisation names;
- more than 1,000 characters of prose;
- a single unbroken token longer than 500 characters;
- smart punctuation, emoji, slashes and non-ASCII names;
- zero-source, high-volume, dense, stale, loading, error and deletion states.

## Non-negotiable oracles

- Empty evidence cannot produce a personality or capability judgement.
- Frequency cannot masquerade as importance or corroboration.
- A repeated request cannot create repeated evidence.
- A later received event cannot automatically become the latest valid belief.
- AI-written material cannot become the person's belief without human evidence.
- Untrusted source text can be stored as content but cannot instruct the system.
- A display name can never resolve identity or tenancy.
- Off-record material cannot leave a hidden summary, embedding or diagnostic residue.
- Removing a source must repair every derived current projection whose support changed.
- Private material cannot cross to a company, commons or public view without exact permission.
- The system must refuse named-person employment evaluation.
- Unsupported numerical and efficacy claims must be surfaced as gaps, not polished into confidence.

## Technical artifacts

- `src/features/operator-brain/syntheticPopulation.ts`: typed curated population, deterministic IDs and volume expansion.
- `src/features/operator-brain/syntheticPopulation.test.ts`: coverage, safety, identity, replay, adversarial-content and layout-range checks.
- `src/features/operator-brain/SyntheticPopulationLabPage.tsx`: unlinked, non-indexable account, source-path and diagnostic-oracle inspector.
- `src/features/operator-brain/SyntheticPopulationLabPage.test.tsx`: all-account render gate plus inert-adversarial-content and empty-state checks.
- `/operator/lab/synthetic-population/:accountId`: synthetic-only preview route, available only in development or when the existing synthetic Decision Bench preview flag is enabled.
- `npm run brain:g18:check`: focused deterministic gate.

## Next implementation sequence

1. Seed the population only into the approved data-less Supabase branch after G16 migrations and the four-identity RLS suite pass.
2. Preserve all source content through strict G17 encryption. Never place plaintext fixture content in production.
3. Run the diagnostic against each oracle and score missing notices, prohibited inference, audience mistakes and next-move quality.
4. Use the internal range harness to switch account and inspect the exact source path, expected processing outcome, diagnostic oracle and layout pressure without changing product navigation.
5. Render the range harness and every approved Brain and Decision Bench surface at narrow and wide widths, including 200 percent zoom and reduced motion.
6. Convert every located failure into the lowest shared contract, renderer, validator or processing repair plus a regression fixture.
7. Keep real customer creation, public navigation and production seeding closed.

## Current boundaries

- No Supabase branch or auth account has been created.
- No fixture has been inserted into any database.
- No diagnostic model has been run or judged against the oracles.
- No current customer-facing product route reads this population. The unlinked preview-only lab reads it for quality assurance.
- The React lab passes all-account render checks, but no cross-viewport UI result is claimed until the preview is rendered and independently checked.
- The 48 accounts are curated coverage, not a claim that every future edge case is known. Every production failure class must add a fixture before repair is accepted.
