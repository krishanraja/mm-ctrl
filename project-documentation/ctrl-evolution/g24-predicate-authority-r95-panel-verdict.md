# G24 R95 seven-role panel verdict

Status: `VETO`

Reviewed commit: `23ce92adfc7a9abdf7551a6d4d9adefd69de41b8`

Reviewed tree: `35135f6e9ceb42d6e0777da42c23e48b4a130b5e`

Parent: `fee6bfa0d4547e93b1b2b34eada756fb3ccce1c5`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Exact evidence

- Manifest blob: `461fb872ddf9b980f1b588d367a7074fe99485f4`
- Effective-contract blob: `b1d7a7a0dc2e5c2aae14c4892605424c6186edea`
- Correction-contract blob: `8b361abea7bab81f4eb230950e41b9707ba3514b`
- Checker blob: `fc8f118015defc4f220cf9d0e2a76352a6245a9e`
- Materializer blob: `bc1055ef0b64da918208c12554d0c7edab98cee2`
- Effective-contract SHA-256: `e949430c6feab6493f0ded26bb9206f29797bf676f34247bc14449887ef90038`
- Manifest bundle: `62edf1fe477280cd88a1306008dcc639867af53a4fa64593fa3e9f5c8c37e557`
- Authority bundle: `f400a73657f3a58cc5ed20bc77c778a8e01d05dd87ab9344dff4374f9d6a3960`

The full regression and focused suite passed. Human Agency, Human Comprehension, Consequential Leader Value and Architecture/Integration passed. Epistemic Integrity, Lifecycle/Security/Privacy and Implementation Correctness vetoed a deeper provenance flaw.

## Decisive defect

`validateCurrentStatusProjection` compares a projection with a caller-supplied `authoritativeObligations` array. `currentStatus` constructs one array and passes that same array as both claim and supposed authority. Equality is therefore tautological.

Owner attribution is also re-read from mutable transition specimens by reference. The read path does not compare the current event bytes with the accepted transition fingerprint or revalidate signature and accepted-decision context. Replacing the event's owner with another globally registered person can reassign the displayed obligation without a new signed transition.

## Role verdicts

| Durable role | Verdict | Decisive reason |
|---|---|---|
| Human Agency | PASS | Honest unmutated states retain signed ownership and exact review timing. |
| Human Comprehension and Access | PASS | Repeated, split and sole-leader copy remains clear and exact. |
| Consequential Leader Value | PASS | Recovery remains complete and non-ceremonial in the valid path. |
| Epistemic Integrity | VETO | “Who must act” is not earned from an independently sealed authority source. |
| Lifecycle, Security and Privacy | VETO | Post-acceptance registered-principal substitution can change who is named without new authority. |
| Implementation Correctness | VETO | The internal fail-safe compares a derived object with itself and does not verify referenced signed bytes. |
| Architecture and Integration Reality | PASS | The intended private resolver architecture is implementable, but its immutable-source constraint must be carried forward. |

## Retained gains

Unknown owners, unsafe counts, unsafe sums, bad ordering, duplicate owners, false copy and mismatch against a genuinely independent expected set reject. All R94 recovery behavior and earlier causal, listener, replay, baseline and privacy protections remain. The only blocker is the provenance and immutability of the authority source used by the status read path.

## Mandatory R96 repair

1. Remove raw obligation arrays as authority inputs.
2. Resolve obligations internally from the exact accepted record, immutable baseline and current missing heads.
3. At challenge creation, preserve the responsible named human and exact signed transition fingerprint.
4. On status read, re-verify challenge fingerprint, stored transition fingerprint, signature and exact decision context; any mismatch returns the trusted unavailable/hold state.
5. Derive permitted humans from the exact accepted decision's authority roles, not the global authenticator registry.
6. Add end-to-end `currentStatus` attacks for registered-owner, unknown-owner, action, context, signature and event-byte mutation, plus self-consistent inflated counts.

R75 and R77 remain unchanged. R95 opens no runtime, database, UI, deployment, merge, release or external authority.
