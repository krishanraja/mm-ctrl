# G21 v4 validation and review architecture

Status: implemented candidate, not yet frozen or council-cleared

Date: 10 September 2026

## Outcome

G21 now treats fixture truth, runtime safety and human judgement as three different contracts. They share evidence types, but they do not share an implicit authority or a success condition.

This separation matters because an exact answer key cannot prove that unseen input is safe, and a structurally safe input cannot prove that its diagnostic is useful. A clean human review cannot remain independent if its readable pack contains prior verdicts.

## Contract 1: total structural runtime validation

`validateG21InternalBlindInput(candidate)` accepts arbitrary unknown input and always returns an error array. It does not accept an optional expected profile.

The runtime contract validates:

- every top-level, nested and array shape before dereference;
- the code-owned v4 task and R1 authority boundary;
- one trusted fictional profile identity, external and internal depth, source metadata and lifecycle sequence;
- the fixed evidence clock plus publication, retrieval, validity and recording order;
- source type, subject capability, claim kind, claim subject and relation chronology;
- exact evidence-specific authority identifier, type, audience and time;
- a current claim view derived from immutable source and claim records;
- no known oracle value anywhere in the reachable input graph.

The trusted runtime binding contains security-relevant metadata, not the full evidence prose. Safe novel text can therefore pass structural validation. It cannot pass the canonical fixture verifier.

## Contract 2: canonical frozen-fixture verification

`validateG21CanonicalInternalBlindInput(candidate, expectedProfile)` first requires the structural runtime contract to pass. It then requires an explicit canonical profile and compares the complete identity, external coverage, external evidence and state-specific internal evidence bytes.

The profile validator separately freezes the complete non-oracle substrate and the oracle. This prevents a test author from synchronising source and claim prose around the expected answer while leaving identifiers and relations intact.

Omitting the canonical profile returns `canonical_profile_required`. It can never turn exact fixture verification into a permissive generic validation path.

## Contract 3: history-free semantic judgement

Run 004 and later use a strict semantic allowlist plus a separate hash-only provenance list.

The semantic pack may contain the current source, tests, direct-gate script, clean current council brief and exact question pack. It may not contain:

- durable judge histories;
- prior judge or proxy rulings;
- prior adjudications;
- standards prosecution or founder calibration;
- review-protocol failures;
- current project documents that narrate prior verdicts and repairs;
- the historical council verifier.

Every v4 ruling must include a `reviewBoundaryAttestation` bound to the semantic-review composite and state that excluded history was not encountered. A missing, mismatched or contaminated attestation invalidates the ruling before adjudication.

Hash-only provenance remains available to prove where the candidate came from. It is not placed in front of a first-pass semantic judge.

## Consequential answer contract

Every profile freezes these elements together:

1. decision magnitude and focus;
2. strongest supported view and countercase;
3. unresolved uncertainty;
4. one plain route-changing question;
5. visible answer shape, options or measurement frame;
6. an explicit route effect for every permitted answer;
7. a separate route effect and evidence request for `unknown`;
8. the human decision boundary.

Finite choices map one for one to route effects. Open answers carry one declared effect for any valid answer. `Unknown` may stop, bound or reshape a route, but it cannot silently select one.

The current repairs make five boundaries explicit:

- care scale requires continuity without executive rescue;
- research scale requires delivered challenge without a senior researcher, not purchase intent alone;
- manufacturing customer-impact exceptions terminate in a named human owner;
- the GBP 18 million campaign choice retains new-viewer purchase and core-fan purchase conditions;
- the later campaign gate uses observed ticket purchase rather than stated intent.

## Memory and self-healing contract

Sources remain immutable receipts. Individual claims carry subject and epistemic kind. Challenges can preserve live disagreement. Supersession requires a later authorised correction aimed at the same claim subject. The current view is always derived after relation validation, so a plausible projection cannot hide invalid lineage.

## Deterministic proof

The direct v4 gate currently proves:

- 12 profiles and four matched families;
- 36 lifecycle cases and 36 oracle-free inputs;
- 12 inputs in each lifecycle state;
- recursive oracle isolation;
- 108 adversarial mutations rejected;
- separate structural and canonical success paths;
- exact route-effect coverage;
- eleven council-contract and review-boundary attacks rejected.

The focused TypeScript compilation and changed-file lint pass. Normal Vitest remains blocked before collection by the current filesystem restriction while esbuild loads the repository config. That is an open execution-environment gap, not a passing result.

## Non-claims

This architecture does not prove diagnostic efficacy, improved judgement, customer value, child comprehension, consented-private behaviour, production safety or permission to write data. It does not authorise a diagnostic model run, database change, deployment or release.

## Next gate

Freeze the verified candidate as Run 004. Build its semantic-review composite only from the clean allowlist, keep history in hash-only provenance, collect fresh adult answerability screens, then collect seven isolated attested rulings. Stop on any valid veto before a diagnostic model run or product surface.
