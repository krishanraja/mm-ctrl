# G24 predicate authority R84 panel verdict

Status: `VETOED_REPAIR_REQUIRED`

Date: 2026-09-16

## Frozen submission

- Commit: `571e6497c6b75f4a6a742f366b54517f9f1916cc`
- Tree: `ae45d6c45a303d6757d82acdfc8f965a6712afed`
- Parent: `7ad53b0137a24b58b145f062883745030e198a01`
- Effective-contract blob: `98462674da042f7f8d01dae856b84dfce1629fa2`
- Manifest blob: `29beeb0610f1d6e8aa84bebbaf99e2430ce0996b`
- Contract-document blob: `3634b38fb696153ce0e5d3cdea34e0d2f0c9bed7`
- Authority bundle fingerprint: `15b4169be667016c3984f9e215a9bb3370e98b567afe032a5acd654e24a8bb20`
- Manifest bundle fingerprint: `88d82c090e94c9475dfd267a40df44c0de639190043a20d0c1649bbdb5082bb9`
- Effective-contract SHA-256: `5305e852581140c4a8036e5261916f6eb645dee4f4807b9476762422cbfc83ad`

The official materializer and checker pass all thirteen predicate and final-authority transition paths, 197 executable vectors and 282 generated totality probes. All reviewers independently verified the frozen identity and a clean worktree.

## Seven-role verdict

| Durable role | Verdict | Reproduced blocking escape route |
|---|---|---|
| Human Agency | VETO | Final authority signs an opaque decision hash and lifecycle label, not the reconciled decision and complete visible delta. Confirmed free expression is also unconditionally classified as transition-supporting. |
| Human Comprehension and Access | VETO | Route receipts are unsigned, caller-reproducible hashes with no authoritative lookup or consumption; a caller-minted Krish-session receipt validates after reservation state is erased. |
| Consequential Usefulness | VETO | The composed decision exists internally but never reaches the final human-visible authority surface; stop-valued free expression can be treated as support. |
| Epistemic Integrity | VETO | `all_dependencies_fresh` trusts one `all` label and falls through to `true`; expired grant status is ignored. The underlying registered derivations are still not all executed. |
| Living Brain Integrity | VETO | Unreferenced unsigned normative evidence is included in reconciliation and can change the current accepted Brain state while the predicate still returns `satisfied`. |
| Subject, Audience and Lifecycle Safety | VETO | Reopening uses three unjoined conventions: `closed-7`, a fixture named `closed_before` and an unrelated assertion hash. Freshness compares to a magic timestamp rather than a resolved closed predecessor. |
| Behavioural and Implementation Reality | VETO | A failed external sequence consumes authority before returning failure, making an exact retry nondeterministic; an accessor-backed transition companion still throws. Final validation succeeds without resolving predicate or evidence. |

## Genuine R84 repairs retained

R84 closes the named R83 aggregate failures. Proceed-versus-stop and conflicting same-path values now produce `contradicted`; the six-gap predicate without route evidence returns `route_invalid`; initial review reuse and generic old purpose fail; a missing closed decision returns `decision_invalid`; reconciled-final tampering returns `binding_invalid`. Changed-byte replay, test/effective separation, early protocol-evidence shape, ordinary null/cycle/accessor/sparse probes and exact thirteen-transition coverage also hold. The cross-process claim is honestly narrowed.

## Root cause

R84 links more stages by fingerprint but still treats several authoritative relationships as caller-resolvable conventions. The complete evidence set is not closed before reconciliation; the final human gate does not resolve what it asks a person to authorize; routing has no issued standing; derivation dispatch has a permissive default; and the closed predecessor is not one typed authority record. External state mutates before the request reaches an accepted terminal result.

## R85 repair rule

R85 must execute one fully resolved, human-visible authority path:

1. evidence-store keys must exactly equal unique dependency-result references; reject extras and reconcile only validated referenced normative evidence;
2. final validation must resolve and revalidate the exact predicate proof, evidence, route receipts and reconciled decision bytes, deriving its binding rather than accepting caller context;
3. render the exact reconciled decision and complete changed-path delta in plain language before final signing, and bind the signature to that render;
4. make free-expression transition disposition explicit, signed and executed, with stop, pause and remain-closed attacks;
5. issue authenticated route/session receipts from an authoritative private store and atomically bind them to the accepted predicate proof;
6. replace all derivation fall-through with closed dispatch, compute dependency freshness from complete boundary records and enforce grant expiry/status;
7. add a typed closed-predecessor record joining lifecycle version, close time, previous purpose, decision reference and fingerprint, source heads and revocation standing;
8. bind reopened decision and grant evidence to that predecessor and compare issuance to its resolved `closed_at`, not a literal timestamp;
9. validate transition identifiers before interpolation and add hostile transition-companion probes;
10. stage external seen, consume and completion mutations and commit them only for an accepted terminal result; exact failed retries must be stable; and
11. pin attacks for orphan evidence, final validation without proof/evidence, caller-minted routes, missing predecessor joins and failed-request token burn.

No R85 founder-ready receipt may exist until all seven roles pass one exact frozen commit. Runtime, database, UI, deployment, merge, release and external authority remain closed.
