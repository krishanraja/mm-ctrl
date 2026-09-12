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

The repaired commit had 113 focused checks passing. Those checks did not close review. The bytes were frozen at `6dc6a0e5b3230384b1e2cc8cffc8319deb7de68b` and independently attacked again.

## Review round 3

**Frozen code:** `6dc6a0e5b3230384b1e2cc8cffc8319deb7de68b`

**Adjudication:** `VETO`

The exact third-round bytes repaired every round-two defect, but two independent reviewers reproduced six further structural failures:

1. The selector fingerprint did not carry the challenger outcome or exact search boundary.
2. A current case and evidence namespace could contradict each other while same-case reuse remained actionable.
3. Release invalidation could claim an append-only receipt with a blank identity.
4. A lifecycle version could be reused after later versions, making stale history current again through an ABA sequence.
5. A caller could handcraft an atom whose mutable state merely said `approved` and record immutable answer evidence without traversing Krish's approval transition.
6. The approval function rechecked much of its supplied binding against the atom, but did not re-establish that the atom's purpose, audience, sensitivity, frame and evidence matched the exact current selector.

The reviewers also confirmed that every round-two failure was genuinely repaired. This third veto therefore records deeper progress rather than regression or a shifting standard.

## Repair round 3

The current worktree seals the challenger outcome and exact boundary into both trusted evaluation and selector identity; explicitly binds the evidence namespace to the current case; refuses identityless Release invalidation; fingerprints control state and validity windows; rejects empty canonical source or Brain version sets; prevents lifecycle reuse of every historical before or after version; validates current lifecycle identity and authority before idempotent replay; and adds a version-matched Krish approval receipt plus an in-process transition proof before an answer can become immutable evidence. Approval now reconstructs the canonical atom against the exact current selector, including purpose, audience, sensitivity, frame and evidence, rather than trusting a self-consistent handcrafted envelope.

The repair had 120 focused checks passing, including exact reproductions of the third-round attacks. It was frozen at `3f399992b3273e896e292d4be0ab6ff4c5e52aa7` for another independent exact-byte review.

## Review round 4

**Frozen code:** `3f399992b3273e896e292d4be0ab6ff4c5e52aa7`

**Adjudication:** `VETO`

Both independent reviewers reproduced a post-approval mutation bypass. The in-process proof remembered only the approved object's identity, so a caller could mutate that same object, recompute every public fingerprint and record answer evidence against bytes Krish never approved. The implementation defense additionally found that approval authority was required only to be nonblank rather than equal to the selector's current authority watermark, and that unknown or grammar-incompatible answer kinds could create immutable evidence. The implementation adjudicator separately found that answer receipt IDs were not checked against a current receipt ledger, so one ID could denote different answer evidence.

Every earlier veto reproduction remained repaired. Founder calibration found no product-direction conflict and no question for Krish, while warning that this local mechanism still does not authenticate a human approval or survive restart.

## Repair round 4

The current repair replaces object-membership proof with an approval-time proof of the exact atom and approval-receipt fingerprints; binds approval authority to the current selector authority watermark; carries approval receipt identity, authority and fingerprint into every answer; validates runtime answer kind and value; enforces compatibility with the rendered single-choice, ranked, bounded-text, scoped-write-in or voice grammar; requires a current answer-receipt ledger; replays an exact duplicate deterministically; and rejects identity collisions. It also makes watermark fingerprinting collision-safe and refuses blank selector identities or a Release audience that differs from an included selector.

The repair was frozen at `63f0e04222a8af0eb655101e9a2955ff6f5a4158` with 126 focused checks passing. These results do not close review. The exact code bytes are under independent attack again. Until that adjudication clears, the implementation state remains `UNDER_REPAIR_REVIEW`, not verified and not runtime-ready.

## Preserved proof limits

This local kernel does not prove authoritative input provenance, durable approval rehydration, production concurrency, real model intelligence, customer comprehension, customer data handling, efficacy, delight, willingness to pay or any external action. Trusted canonical ingress is the next technical boundary only after the repaired-byte review clears.
