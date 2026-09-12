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

The current repair replaces object-membership proof with an approval-time proof of the exact atom and approval-receipt fingerprints; binds approval authority to the current selector authority watermark; carries approval receipt identity, authority and fingerprint into every answer; validates runtime answer kind and value; enforces compatibility with the rendered single-choice, ranked, bounded-text, scoped-write-in or voice grammar; requires a caller-supplied answer-receipt ledger; replays an exact duplicate deterministically within that supplied ledger; and rejects identity collisions. It also makes watermark fingerprinting collision-safe and refuses blank selector identities or a Release audience that differs from an included selector.

The repair was frozen at `63f0e04222a8af0eb655101e9a2955ff6f5a4158` with 126 focused checks passing. These results do not close review. The exact code bytes are under independent attack again. Until that adjudication clears, the implementation state remains `UNDER_REPAIR_REVIEW`, not verified and not runtime-ready.

## Review round 5

**Frozen code:** `63f0e04222a8af0eb655101e9a2955ff6f5a4158`

**Truthful state correction:** `23fe8e15ed49bae07eb6009622f989edc3854029`

**Adjudication:** `VETO`

The approval, authority, answer-grammar and supplied-ledger repairs all held under exact-byte replay. Three narrower defects remained. A selector could be compiled into a Release projection with an unrelated purpose despite exact audience binding. A closed-choice answer could select an answer-effect key that was never present in the rendered options. Two legacy-shaped answer receipts could both omit approval lineage and still pass correction because their absent fields compared equal.

The supplied answer-receipt ledger also cannot prove its own completeness or currentness. That remains a canonical-ingress boundary, so the QA and canonical state now describe only collision handling within a caller-supplied ledger.

## Repair round 5

The current repair requires every included selector purpose and audience to equal the pending Release purpose and audience; rejects empty, blank, duplicate or unoffered closed-choice options and undeclared effect keys; and requires nonblank approval receipt identity, authority and fingerprint on both answers before correction can compare them. Exact adversarial reproductions are blocking tests.

The repair was frozen at `9977cd0c18fdb66643ebeb3d1d6cc7562cdc423f` with 127 focused checks passing. These results do not close review. The exact code bytes are under independent attack again. Until that adjudication clears, the implementation state remains `UNDER_REPAIR_REVIEW`, not verified and not runtime-ready.

## Review round 6

**Frozen code:** `9977cd0c18fdb66643ebeb3d1d6cc7562cdc423f`

**Truthful state correction:** `f69a3418ea8b8b3fb9d6793eb128ed52ce33b5f5`

**Adjudication:** `VETO`

Every round-five defect stayed repaired, but exact hostile probes found five deeper contract failures:

1. Raw options were checked before trimming, so two visibly equivalent options could be approved and one selection could apply the other's consequence. Reserved honest-exit names could also be offered as ordinary options and resolve to the honest-exit effect.
2. `ranked_choice` was declared but accepted only one scalar option, so the kernel could not preserve the ordered answer the leader actually gave.
3. The question atom did not validate its grammar enum or the full runtime shape and semantics of honest exits and answer effects. Invalid effect types and blank retirement references could reach immutable receipts.
4. An issued enrichment plan could be widened in place without changing its plan version, bypassing the approved attempt and time limits.
5. Lifecycle actor references were normalized for authorization but recorded as raw bytes, while padded lifecycle versions were accepted and stored. Equivalent aliases could therefore acquire different receipt identities.

The reviewers independently confirmed that Release purpose and audience binding, approval authority and exact-byte proof, answer-ledger collision handling, correction lineage, selector identity, challenger binding, lifecycle ABA prevention and earlier control-lineage repairs all held. The state-correction commit changed documentation only and did not affect the reviewed code.

## Repair round 6

The current repair requires canonical, unique, non-reserved option bytes; validates the complete question grammar, honest-exit and effect contract before approval; records ranked answers as an exact complete ordered list with no missing, duplicate or unoffered values; and gives each accepted ranking one deterministic declared case effect. It rejects padded lifecycle identities and versions before authorization or storage. Enrichment plans now carry an exact fingerprint and an in-process issuance proof, every attempt receipt binds that fingerprint, and mutation or reconstruction outside the issuance boundary fails without a fabricated durable receipt.

The repair was frozen at `98dfc3c09bbf6851c01b7984a19bb504d5df6f52`, tree `64b08de9d7aa0384332c30ea91660fe2fccb7278`, with 133 focused checks passing, including exact reproductions of every round-six attack. These checks do not close review. The exact bytes are under independent attack again before any verified-state or runtime-readiness claim.

## Review round 7

**Frozen code:** `98dfc3c09bbf6851c01b7984a19bb504d5df6f52`

**Truthful state correction:** `4c02ff9c4c8ec9401e89df9551b1bb7dc26d4e9c`

**Adjudication:** `VETO`

Every round-six reproduction closed, including real complete rankings, canonical lifecycle identities and mutation-proof enrichment plans. Five exact-history and runtime-Boolean defects remained:

1. An exact enrichment retry returned an earlier `proposed_evidence` receipt before revalidating that the current selector was still exact and actionable.
2. Execution replay compared only selected identity fields, so a caller-mutated prior receipt could claim standing, canonical evidence, Brain change, approval and delivery and be returned unchanged. Unmatched malformed history could also affect budgets and later receipts.
3. Lifecycle replay trusted a matched request fingerprint without rebuilding the whole receipt. Forged state, actor, invalidation and receipt-type fields could survive replay, and forged unmatched history could be carried into later transitions.
4. Runtime string `"false"` could enable a scoped write-in because the Boolean field was interpreted by truthiness.
5. Runtime string `"false"` could also satisfy the mandatory session decline and reframe boundary.

Founder calibration found no question for Krish. It confirmed the product direction but caught two architecture-level implementation drifts: rankings must obey the locked maximum of five, and factual evidence may require case rebuilding without manufacturing a human-owned proposal.

## Repair round 7

The current repair validates the complete supplied execution ledger for identity, plan, ordering, status, source and zero-side-effect invariants before it can affect replay, collisions or budgets. It validates the complete supplied lifecycle chain against the thirteen transition definitions, exact request fingerprints, before-and-after continuity, canonical actor and authority binding, uniqueness and current snapshot tip. Both replay paths reconstruct the exact expected receipt and require full-object equality. Stale selector context now blocks execution replay without altering history. Question write-in permission must be a literal Boolean, session decline and no-contact boundaries must be literal `true`, rankings stop at five, and case rebuilding no longer fabricates a human-owned proposal where none is warranted.

The repair was frozen at `ede48c33f42a7f6859dba3a19b201ca32bf1343a`, tree `28608fa04a1a57ecf81d4567fd84384df01b78bf`, with 136 focused checks passing, including exact reproductions of every round-seven attack. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 8

**Frozen code:** `ede48c33f42a7f6859dba3a19b201ca32bf1343a`

**Truthful state correction:** `85be5e38f5e74389d55bb14acecc500a66b67981`

**Adjudication:** `VETO`

Every round-seven reproduction closed. The exact review then distinguished canonical receipt shape from actual kernel issuance. A byte-perfect but never-issued execution receipt could seed the supplied ledger, consume an attempt and influence replay or collisions. A lifecycle receipt could be altered self-consistently and its request fingerprint recomputed because historical actor, authority, precondition, identity, evidence, root and version constraints were not all rechecked against the fixed transition table. Both histories could therefore look internally plausible without having traversed the kernel.

The same reasoning applied to immutable answer evidence and correction, even though that exact path had not yet produced a separate reviewer veto. Treating old bytes as issued merely because they were well-shaped would repeat the root defect.

## Repair round 8

The current repair gives lifecycle, execution and answer receipts private in-process issuance proofs. Every supplied history requires both canonical full-object structure and exact issuance proof before it can influence state, replay, collision, budget or correction. Proofs are preserved across kernel-produced defensive clones but are not minted for caller reconstructions. Lifecycle history is anchored at `none` and `null`, matches every historical actor, authority and precondition to the fixed thirteen-edge table, binds identity control and nonempty precondition evidence, enforces continuity and historical version non-reuse, and matches the current snapshot tip. Restart rehydration remains explicitly closed until trusted canonical ingress can authenticate durable receipts.

The moving worktree retains 136 focused checks, now including rejection of proofless reconstructed lifecycle, execution and answer receipts. It remains under repair until frozen and independently reviewed.

## Preserved proof limits

This local kernel does not prove authoritative input provenance, durable approval or enrichment-plan rehydration, production concurrency, real model intelligence, customer comprehension, customer data handling, efficacy, delight, willingness to pay or any external action. Trusted canonical ingress is the next technical boundary only after the repaired-byte review clears.
