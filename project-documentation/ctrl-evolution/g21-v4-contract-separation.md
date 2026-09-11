# G21 v4 validation and review architecture

Status: frozen as Run 004 and blocked by four valid vetoes

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

Run 004 showed that this boundary was incomplete. The trusted runtime binding contained security-relevant metadata but omitted evidence content and claim text. Arbitrary meaning could therefore borrow trusted standing, subject, audience and lifecycle metadata. Safe novel text remains a requirement, but it must enter through trusted semantic issuance rather than inheriting authority from unchanged metadata.

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

## Run 004 result

Run 004 froze the candidate at local artifact commit `63b8550`. Its seven fresh judges received the clean semantic allowlist and attested that excluded history was not encountered. Human Agency, Consequential Usefulness and Living Brain Integrity passed. Four valid vetoes blocked the run:

- arbitrary evidence meaning could inherit trusted epistemic standing;
- malformed sparse arrays could throw and personhood or consent meaning could inherit safe metadata;
- FORGE-I3 asked for a named person while offering roles; and
- conflict and correction meaning could be reversed while the runtime projection remained green.

Both adult answerability screens also failed FORGE-I2, FORGE-I3, STORY-I2 and STORY-I3. These are adult proxy findings only. The Standards Prosecutor reproduced every technical failure and preserved all three narrow passes. Founder Calibration authorised exactly one bounded terminal Run 005 rather than another open-ended synthetic design cycle.

The prosecutor also found that the semantic composite omitted the locally imported `g21PublicRowCanary.ts` dependency used by the declared gates. The artifact commit still fixes those bytes, so this does not alter the sealed Run 004 rulings. Run 005 must nevertheless identify the complete bounded repo-owned compilation closure.

## Non-claims

This architecture does not prove diagnostic efficacy, improved judgement, customer value, child comprehension, consented-private behaviour, production safety or permission to write data. It does not authorise a diagnostic model run, database change, deployment or release.

## Next gate

Implement one terminal Run 005 repair with four boundaries: total nonthrowing validation, one trusted semantic receipt that binds meaning and authority, four plain answer-contract repairs and dependency-complete freeze identity. Freeze it once and repeat the independent council. If it clears, synthetic contract work ends and the fixed diagnostic model runs blind across all 36 inputs before any cold product proof.
