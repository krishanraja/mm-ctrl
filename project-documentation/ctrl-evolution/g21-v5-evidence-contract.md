# G21 v5 model-ready evidence contract

Status: implemented candidate, not council-cleared

Date: 11 September 2026

## Purpose

This contract governs the fictional internal-range canary only. It tests whether a diagnostic can receive model-ready evidence without confusing readable prose, trusted standing and exact fixture truth.

The contract has three separate success conditions:

1. an arbitrary input fails closed and never throws;
2. every model-ready evidence record earns its meaning and authority from a trusted semantic receipt; and
3. the exact canary fixture remains independently frozen for oracle comparison.

No one condition substitutes for another.

## Total arbitrary-input validation

`validateG21InternalBlindInput(candidate)` accepts `unknown` and returns a string array for every input. The public wrapper catches any unexpected validation exception and returns `blind_input_validation_failed_closed`.

Before any nested dereference, the validator checks exact object fields and dense arrays. A sparse array, malformed nested claim, invalid relation array, missing receipt, counterfeit authority or malformed current view is rejected. Validity does not depend on JavaScript array iteration silently skipping a hole.

## Trusted semantic receipt

Each internal evidence record contains one `semanticReceipt` with:

- a unique receipt identifier;
- the code-owned fictional compiler issuer;
- an issuance time equal to the evidence recording time; and
- one lifecycle role: `base`, `conflict` or `correction`.

The code-owned receipt registry binds the complete evidence record and its matching audience authority. The binding includes content, claim text, assertion kind, claim subject, record subject, source type, source locator, audience, time, claim relations, fixture authority and lifecycle role.

The runtime accepts a record only when:

- its receipt is known;
- that receipt is permitted for the declared profile;
- the complete record and audience authority match the registered binding; and
- the ordered evidence identifiers and lifecycle roles match the declared runtime state.

Changing prose while retaining metadata fails. Changing source capability, subject, audience, claim standing or lifecycle meaning fails. Swapping a conflict and correction, including their receipt references, fails.

This canary uses a code-owned in-process registry as a deterministic stand-in for trusted issuance. A production service would require an authenticated compiler receipt or server-verifiable signature. The canary does not claim cryptographic or production security.

## Safe novel evidence control

Structural validation is not canonical byte equality. One explicit fictional intake variant has its own pre-issued receipt and is accepted by the runtime validator. The canonical verifier rejects the same variant because its bytes differ from the frozen fixture.

Arbitrary new prose without a trusted receipt is rejected. Novel evidence becomes model-ready through trusted compilation, not by borrowing standing from an existing identifier.

## External evidence binding

The fixed fictional external envelope is bound in full, including source title, summary, limitations, dates, type, locator and disclosure. A changed summary cannot retain the standing of the original source merely because its identifier is unchanged.

## Visible answer contract

Every profile still carries one route-changing question, one answer shape, one safe unknown route and optional notes. The visible contract follows four rules:

1. the question and controls request the same kind of answer;
2. all numbers and comparisons needed to answer are explicit;
3. the person supplies a choice, threshold or fact rather than performing the Brain's analysis; and
4. every permitted answer selects, stops, bounds or reshapes the named consequential route.

The four manufacturing and campaign questions with the highest answerability risk use concrete delivery, funding and ticket-sale comparisons. Internal labels such as held-out test, theory-first and delivery target are not required to understand the immediate ask.

## Fixture truth and oracle isolation

`validateG21CanonicalInternalBlindInput(candidate, expectedProfile)` first requires the runtime contract, then compares the exact subject, external coverage, external evidence and state-specific internal evidence bytes with an explicit expected profile.

The 36 blind inputs contain no decision oracle, expected diagnostic behaviour, forbidden claim, route-changing question or route effect. The model therefore cannot read its answer key.

## Freeze identity

A frozen review records two different file sets:

- a clean semantic allowlist that contains only current, history-free material a judge may read; and
- a provenance set that may contain history-bearing continuity material but is never shown during first-pass review.

The freeze also records the bounded transitive closure of every repo-owned local source imported by the declared TypeScript gates. Package code and toolchain internals are version-pinned separately and are not added to the human reading pack.

## Non-claims

This contract does not prove diagnostic intelligence, improved decisions, product usability, comprehension by children, consented-private behaviour, database safety, cryptographic authenticity, customer value or longitudinal learning. It authorises no database write, account, deployment or release.
