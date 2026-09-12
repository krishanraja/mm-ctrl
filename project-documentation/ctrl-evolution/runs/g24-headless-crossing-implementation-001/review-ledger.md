# G24 headless Crossing implementation review ledger

**Scope:** first bounded local implementation only

**Founder authority:** Krish's 12 September 2026 answer "yes to both"

**Architecture authority:** founder-locked G24 R1 through R5 chain at `9fdca0a` and `997ab55`

**External actions:** none authorised or performed

## Review round 1

**Frozen submission:** `5f3cccba3efa05b93616dec7d53d57aa500d2a4b`

**Adjudication:** `VETO`

The first submission was useful as a prototype but did not earn a verified-state claim. Two independent implementation reviews reproduced semantic failures rather than merely disagreeing with style.

### Durable judge positions

| Judge role | Round 1 position | Durable reason |
|---|---|---|
| Implementation defense | Veto | A held selector could compile to Release; trusted evaluation and authority were not exactly version-bound; multi-selector lineage could be deleted; malformed inherited keys could throw; cross-case provenance and complete lineage were self-asserted; execution, lifecycle version and receipt identity checks were incomplete. |
| Implementation adjudicator | Veto | The caller could delete a dependency edge, carry forward unversioned semantic standing, approve or answer an insufficiently bound intervention, transition lifecycle state through generic booleans, and claim correction repair from caller-written impact lists. |
| Founder calibration | Likely aligned only within the narrow backstage scope | The product direction remained consistent with Krish's approved spine, but stale state routing and the absent trusted canonical ingress made any broader completeness claim misleading. |

### Why the first attempt missed the standard

The implementation translated nouns from the locked architecture into types, but several decisive verbs still trusted caller attestations. `true`, a copied version label, or a caller-supplied list could stand in for current authority, complete lineage or actual repair. That is exactly the kind of technically impressive theatre this product is meant to reject. A passing happy-path suite therefore overstated progress.

## Repair contract

The repair must preserve the frozen architecture while closing the reproduced seams:

1. Reject held or mutated selectors before pending Release compilation.
2. Bind trusted evaluation to the exact current decision, coverage, cutoff, policy, challenger and control-graph versions.
3. Bind every intervention to the sealed selector plus exact purpose, audience, sensitivity, decision frame and evidence coverage; reject answers until approval.
4. Materialise all six lifecycle states and thirteen exact transition contracts, including actor class, authority class and version, precondition class and evidence, version advance, invalidation and receipt type.
5. Derive correction impact transitively from a versioned dependency graph and reject cross-atom replacement.
6. Reject malformed execution envelopes, materially changed replays and duplicate receipt identities.
7. Carry a versioned applicable-control manifest and dependency-graph fingerprint through selector and pending Release checks so deleting a declared applicable edge fails at selection, compile and before use.
8. Narrow every written claim to structural consistency within caller-supplied data until a server-only canonical ingress proves authenticity and completeness.

## Review round 2

**Frozen code:** `adfa6e0bd126d1b223e915fe2622cdc28356cef5`

**Truthful state correction:** `7f898adc8ea822e93c6f1c5bf7c2a651d5449d01`

**Adjudication:** `VETO`

The broad first repair closed the original five root defects, but fresh exact-byte attacks found six remaining structural seams. The sealed selector omitted its current case, evidence namespace and trusted evaluation binding. A candidate could contradict a private envelope by self-labelling reuse public. Correction compared only atom version and did not traverse decision-to-decision dependencies. Canonical-version arrays used a delimiter-collidable comparison. An invalid actor reference could satisfy an actor class. Malformed execution emitted a purported append-only receipt without valid identity, and a handcrafted enrichment plan could execute against a reuse selector.

The documentation-only state correction passed review and remains valid history. It did not alter code and could not cure the veto.

## Repair round 2

The current repair seals case, evidence namespace and full trusted evaluation into the selector fingerprint; requires reuse evidence namespace consistency; binds answer correction to the exact intervention fingerprint; traverses derivative and decision dependencies to a fixed point; compares exact arrays without delimiters; binds lifecycle actors to the snapshot's named leader and identity-control version; refuses blank answer receipts; emits no durable execution receipt for malformed envelopes; and requires the exact current selector to be actionable enrichment before accepting an enrichment attempt.

The repair worktree has 113 focused checks passing. These results do not close review. The bytes must be frozen in a new commit and independently attacked again. Until that adjudication clears, the implementation state is `UNDER_REPAIR_REVIEW`, not verified and not runtime-ready.

## Preserved proof limits

This local kernel does not prove authoritative input provenance, production concurrency, real model intelligence, customer comprehension, customer data handling, efficacy, delight, willingness to pay or any external action. Trusted canonical ingress is the next technical boundary only after the repaired-byte review clears.
