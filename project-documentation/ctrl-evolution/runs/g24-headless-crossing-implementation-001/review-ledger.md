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

The repair was frozen at `79cc54a62432a0d633cc30a69a2a08a48c142e13`, tree `7d415ecd59f0db431a19e501f568ac9d12a1e7b2`, with 136 focused checks, including rejection of proofless reconstructed lifecycle, execution and answer receipts. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 9

**Frozen code:** `79cc54a62432a0d633cc30a69a2a08a48c142e13`

**Adjudication:** `VETO`

Both independent reviewers confirmed that proofless lifecycle, execution and answer receipts now reject and that every earlier attack remained closed. They then reproduced four adjacent failures:

1. A successful lifecycle append reused all prior receipt objects. Mutating an older returned snapshot therefore changed a newer snapshot and destroyed its proof.
2. An issued preparation snapshot could be rebound from one named leader to another without a new identity-control version because the issued history did not seal the snapshot root.
3. A caller-created non-root lifecycle state with no receipts could start at `preparing` and reach `intensive_proof` without traversing `open_preparation`.
4. One correction receipt identity could denote two different replacements because correction had no issued ledger, exact replay or collision boundary.

The panel distinguished these as one class of defect: individual receipts were issued and shaped correctly, but the containers and correction event identities that carried them were not yet sealed as append-only history.

## Repair round 9

The current repair defensively clones the complete successful lifecycle snapshot while preserving proofs, seals every nonempty lifecycle snapshot to its exact issued root and contents, and permits empty history only at the `none` and null-version root. It adds an in-process issued correction-receipt ledger with canonical receipt and idempotency identities, exact full-object replay, separate receipt and idempotency collision failures, proof-preserving defensive clones and rejection of caller reconstructions.

The repair was frozen at `d5561f2a0bbacff0161689049c8cd93cd8447f9d`, tree `3bc4a43119b7f21def35a44f8ce4c4573002399f`, with 140 focused checks, including the exact four review-round-nine reproductions. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 10

**Frozen code:** `d5561f2a0bbacff0161689049c8cd93cd8447f9d`

**Truthful state correction:** `bff92c4779de254cc440121b1993fcaf653bdd2d`

**Adjudication:** `VETO`

Every round-nine lifecycle and correction-ledger reproduction closed. The reviewers confirmed isolated accepted snapshots, a sealed lifecycle root, rejection of non-root empty history, ordinary mutation rejection, proof-preserving replay and clone continuation, and ordinary correction collision handling. They then found two deeper identity failures and one shared serialization failure:

1. Correction replay bound answer receipt IDs but not the full issued original and replacement answer bytes. Separately issued same-ID answers with different content could therefore replay one correction as another.
2. Correction replay bound a dependency-graph version and derived impact but not the graph's complete canonical content. Distinct graphs with the same version and downstream impact collapsed into one event, while padded graph identifiers could silently under-record affected lineage.
3. Every receipt proof that used live-object `JSON.stringify` could be steered by a caller-added `toJSON` hook. Post-approval atom mutation, answer mutation, correction mutation and lifecycle receipt mutation were all reproduced despite an apparently matching proof.

The third finding reopened a previously repaired post-approval mutation class through a JavaScript serialization hook. It showed that exact receipt shape was still being measured through caller-controlled behaviour rather than plain data.

## Repair round 10

The current repair fingerprints an explicit descriptor-based plain-data projection, so object-defined serialization hooks cannot hide mutated bytes and uncloneable extra values cannot collapse every fingerprint into one fallback identity. The shared primitive now governs control, selector, atom, approval, answer, correction, Release, lifecycle, plan and execution fingerprints and replay comparisons. Correction receipts additionally bind deterministic full fingerprints of the original answer, replacement answer and complete canonical dependency graph. Dependency graphs now require a canonical version, node and dependency references, complete runtime shape, unique dependency edges and no derivative/decision node collision before impact derivation.

The repair was frozen at `c5a6432c9545f4bc04622dd6e0265fa8695cc167`, tree `f55b9e9d1b676cf8cf95cefb16928217be5cff21`, with 144 focused checks, including hidden-serialization attacks against approved atom content, answer evidence, correction history, lifecycle snapshots and execution receipts, plus same-ID answer-content collisions, distinct same-version graphs and padded graph references. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 11

**Frozen code:** `c5a6432c9545f4bc04622dd6e0265fa8695cc167`

**Truthful state correction:** `95955bfccdb00a4df2937462aa878da2ee69a950`

**Adjudication:** `VETO`

The correction fingerprints, padded-reference rejection and ordinary hidden-serialization repairs held. The exact review then proved that the descriptor projector was still lossy and that several APIs read mutable caller objects more than once:

1. Sparse arrays, non-enumerable array entries and hidden object properties were omitted from identity. A hidden option and answer effect could therefore create immutable evidence after approval, while sparse issued answer and correction arrays replayed as unchanged.
2. Custom collection prototypes could replace `includes` or `some`, admitting an unoffered answer or suppressing correction lineage without changing the recorded fingerprint.
3. Repeated references and real cycles used one marker. Two different object topologies therefore shared an identity and reopened post-approval mutation.
4. Stateful getters split checking from use across selector authority, execution budget, Release purpose and correction graph derivation. Each API could approve one value, act on another and record an internally contradictory result.
5. Sparse, extended or custom-prototype dependency collections and nonplain records such as `Map` could erase graph edges.
6. Unsupported lifecycle request fields could enter the first request fingerprint but disappear during historical reconstruction, causing the kernel to accept a transition whose own immediate retry rejected.

These defects shared one architectural cause: exactness was being inferred from live caller-owned JavaScript objects rather than one strict owned data snapshot.

## Repair round 11

The current repair replaces lossy projection with a strict recursive snapshot boundary. Admissible values are finite JSON-like primitives, ordinary own-data objects and dense vanilla arrays. It rejects accessors, functions, symbols, symbol keys, hidden properties, extra array keys, sparse arrays, custom prototypes, nonfinite values and cycles. Shared acyclic references are copied as repeated values rather than confused with cycles. Stateful APIs snapshot before semantic reads, transfer valid private issuance proofs to their owned copies where necessary, then validate, fingerprint, derive and use only those copies. Lifecycle snapshots and requests additionally require their exact known field sets before receipt issuance.

One hundred and fifty focused checks pass. The new attacks cover hidden options and effects, sparse issued answer and correction evidence, custom array behaviour, cyclic approved content, accessor-backed selector authority, dependency graphs, execution plans and Release projections, malformed graph collections and unsupported lifecycle fields.

The repair is frozen at `1befb0c2d5c3d9581ebc488e9d0e9e67f822c77c`, tree `c8d3b09ccd813627a675417eff55a78bf12caceb`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 12

**Frozen code:** `1befb0c2d5c3d9581ebc488e9d0e9e67f822c77c`

**Truthful state correction:** `f3cff450c6ab08755b581a56ee903394fd32efe3`

**Adjudication:** `VETO`

All ordinary historical attacks held, including correction identity, canonical graph checks, lifecycle isolation and roots, approval mutation, stale execution replay, ranking bounds, Release purpose and audience binding, related watermark invalidation and unrelated-lineage isolation. Both independent reviewers nevertheless reproduced four defects in the strict snapshot boundary:

1. `undefined` was accepted even though JSON serialization omitted object properties carrying it. Different keysets could therefore share an issuance proof, including approved atoms and lifecycle, answer or correction receipts.
2. Object copies were built by assigning into `{}`. An own `__proto__` field invoked the inherited setter, disappeared from the owned keyset and changed the copy's prototype. The reviewers used this to inject inherited named-leader authority and make an otherwise unauthorized pending Release eligible. The same root could erase a correction dependency edge.
3. Exceptions from hostile Proxy reflection traps escaped the snapshot boundary. Public selector, Release, lifecycle, execution and fingerprint calls could throw instead of producing their defined fail-closed outcomes.
4. A plain but malformed Release authority could reach string methods before its runtime shape was checked and throw rather than return ineligible.

These are one boundary-integrity family: the copy was not fully injective or exception-total, and Release use still trusted TypeScript shape beyond that copy.

## Repair round 12

The current repair rejects `undefined`, copies every object into a null-prototype record using explicit own data properties, catches every reflection failure and preserves `__proto__` as ordinary owned data. Successful selector results no longer materialize an absent optional diagnostic as `undefined`. Pending Release use now requires an exact outer envelope, exact and fully typed projection, current control registry and named-leader authority structures before evaluating any property methods or comparisons, with a final exception boundary that returns the existing non-actionable result.

One hundred and fifty-five focused checks pass. The five new blocking reproductions cover proof-bearing `undefined` mutations, outer `__proto__` Release-authority injection, `__proto__` correction-dependency preservation, revoked Proxy traps across the public boundaries named by review and malformed plain Release authority.

The repair is frozen at `7be88d7e746996c2476d05cbe7592c767080011c`, tree `c826bdbd41010b057920c883f4bf03cf43502ae3`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 13

**Frozen code:** `7be88d7e746996c2476d05cbe7592c767080011c`

**Truthful state correction:** `3a005eedc5c78b31613991d38e44294a56d0da57`

**Adjudication:** `VETO`

The round-twelve `undefined`, prototype-authority, revoked-Proxy, malformed-authority and correction-dependency attacks held. The exact review found four connected consistency defects:

1. Several APIs took an owned snapshot but then reread the caller object while transferring issuance proofs or constructing a malformed result. Stateful Proxies could therefore throw after snapshot in selector, answer, correction, lifecycle and execution paths.
2. Release compilation built selector-index maps as ordinary objects and assigned unchecked selector versions into them. A valid selector named `__proto__` erased its own map entries, changed a map prototype and produced a non-null projection whose fingerprint was the invalid-data sentinel.
3. Canonical identity was not shared across official creation paths. Padded projection, source, Brain, authority, invalidation-receipt and approval-receipt identities could be retained in proof-bearing objects.
4. Release use checked runtime types but omitted several compiler-level semantic invariants. Self-consistent projections with blank purpose, audience, projection version, canonical-source version, selector fingerprint or control-manifest version could be paired with matching authority and evaluated as eligible. Public fingerprint and receipt-rendering helpers could also throw on plain malformed shapes.

The common root was incomplete ownership and invariant reuse: the snapshot did not carry safe source-to-copy proof provenance, and creation, fingerprint and use boundaries did not share one canonical-identity and total-function policy.

## Repair round 13

The current repair makes the snapshot return an internal source mapping for each owned object. Issuance proofs are now looked up by object identity only and compared against the owned copy's fingerprint; no caller property is reread after ownership transfer. Array length is copied from its own data descriptor so even a Proxy `get` trap is never invoked. The malformed selector branch now uses the owned snapshot.

Release compiler maps are null-prototype records populated with explicit own properties, and invalid fingerprint sentinels cannot be returned as successful projections. One canonical-identifier predicate now governs compile inputs, selector and manifest bindings, approval receipts, Release projection and authority structures, canonical source and Brain versions and invalidation receipt issuance. Release use checks exact typed bindings before evaluation. The exported selector, atom, Release, watermark and control-graph fingerprint functions and selector receipt renderer now return their documented safe result for malformed plain shapes rather than throwing.

One hundred and sixty-five focused checks pass. The ten new checks cover every round-thirteen reproduction: post-snapshot caller `get` traps across selector, answer, correction, lifecycle and execution; official `__proto__` selector compilation and eligible use without key loss; padded compile, approval, authority and invalidation identities; six blank Release bindings; and total public fingerprint and render helpers.

The repair is frozen at `685a8db4f266965834e9d06c70b3e9337fb5b272`, tree `4e7cf69f940376bea3ab0a1bcd192ecf8a801ad8`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 14

**Frozen code:** `685a8db4f266965834e9d06c70b3e9337fb5b272`

**Truthful state correction:** `3dd8fc034d482315c3db81b84a6d1a5cd9211353`

**Adjudication:** `VETO`

Every round-thirteen reproduction held, including post-snapshot ownership, `__proto__` selector identity, padded Release and approval boundaries, blank Release bindings and total public helpers. The reviewers then found four related proof-normal-form failures:

1. The invalid-data fingerprint sentinel was still a nonblank string. A malformed selector or plan could store that sentinel as if it were a genuine exact identity, allowing downstream compilation or execution to reason from stale selected fields.
2. Several official issuance paths still accepted padded selector, atom, control, channel, timing and evidence identities, while an explicitly present blank control validity bound was interpreted as no bound.
3. Pending Release use accepted duplicate selector versions, source and Brain versions, control roots and watermark keys if the caller recomputed the public projection and authority fingerprints. The compiler and use boundary therefore did not share one canonical normal form.
4. Proof-bearing atom, approval, plan, attempt and correction-graph identities still fingerprinted selected fields rather than requiring an exact outer schema. Unsupported fields could become invisible authority. Malformed plan, execution, atom-validation and control-closure inputs could also throw, and sparse arrays with very large declared lengths could drive unnecessary allocation.

The common root was now narrower than the previous ownership defect: exact copied bytes were available, but not every proof boundary rejected unknown fields, duplicate canonical forms or the reserved invalid identity before semantic use.

## Repair round 14

The moving repair makes the invalid fingerprint a reserved value that can never satisfy identity validation or issuance. Selector, intervention atom, approval receipt, enrichment plan, execution attempt, execution receipt and answer-dependency graph boundaries now require exact known field sets, canonical identifiers and valid non-sentinel fingerprints before they can create, transfer or consume an issuance proof. Atom approval state and receipt presence must agree.

Control closure now validates its complete runtime envelope before traversal. Explicit validity bounds must be canonical parseable dates. Release compilation and use reject duplicate selector, canonical source, canonical Brain, root, manifest-control and watermark identities; Release use also recomputes the controlling-watermark fingerprint as a derived invariant. Array ownership validates a bounded dense keyset before allocating or iterating by the declared length. Malformed atom, plan, execution and closure calls return or throw only their defined fail-closed outcomes.

One hundred and seventy-nine focused checks pass locally. Fourteen new checks cover reserved-sentinel selectors and plans; padded selector, authority-control, atom, channel, timing and evidence identities; blank explicit validity; duplicate Release forms after recomputed public fingerprints and matching authority; unknown atom, approval, plan, attempt and correction-graph fields; malformed public entry points; and a maximum-length sparse array without proportional allocation.

The repair is frozen at `5f18f2cfc39996a3136cd96112a58fa8cb5ed918`, tree `66a750c4263a854eb581109cac0661bdf7517731`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 15

**Frozen code:** `5f18f2cfc39996a3136cd96112a58fa8cb5ed918`

**Truthful state correction:** `6940d66229cbefca9dc58e6d3d7a971c99d710a8`

**Adjudication:** `VETO`

Every round-fourteen reproduction held. Both reviewers independently reproduced a selector-result semantic bypass: a genuine quiet hold could be changed to an invented route and truthy non-Boolean actionability, paired with malformed reason, diagnostic, namespace or trusted-evaluation values, then given a new public fingerprint. Release compilation accepted the self-consistent but semantically invalid bytes and matching structural authority made the projection eligible. The result validator checked exact outer keys and selected identifiers, but not the complete nested runtime schema or route/reason/actionability and trusted-evaluation relationships.

Three adjacent defects were also reproduced:

1. Compiler-sorted canonical source and Brain arrays could be reversed after issuance without changing the sorting fingerprint. Use required uniqueness but not canonical order, so the mutated non-normal bytes remained eligible under matching authority.
2. A session payload with the declared keys but a non-string agenda item reached `.trim()` and threw a raw TypeError instead of the defined fail-closed contract error.
3. An answer command could carry an unsupported own field which was silently ignored while immutable evidence was issued.

These are current-gate implementation defects, not trusted-ingress limitations. They show that exact outer keysets must be paired with complete nested runtime schemas, cross-field semantics and one byte-normal form wherever a public fingerprint canonicalizes order.

## Repair round 15

The moving repair adds one strict runtime selector-result schema covering all outer and nested fields, exact optional fields, route and reason enums, literal Boolean actionability, trusted-evaluation and challenger bindings, evidence namespace and case equality, canonical dates, valid fingerprints, unique and canonically ordered alternatives, controls, evidence references and watermarks, and route/reason/actionability agreement. The public selector fingerprint now returns the reserved invalid sentinel for semantic-invalid bytes, and every consumer continues to require both a valid stored fingerprint and exact recomputation.

Release compilation emits sorted selector-root maps. Projection and authority use now require compiler-canonical order for selector, canonical source, canonical Brain, manifest-control, root and watermark arrays, so order mutation cannot preserve usable identity even where the public fingerprint sorts. Session and question payload shape checks validate every nested collection and every value used through string or array operations before semantic validation. Answer commands now admit exactly `receiptId`, `kind` and optional `value`.

One hundred and eighty-three focused checks pass locally. Four new tests collectively attack eleven self-refingerprinted selector semantic mutations, reordered Release bytes, malformed session agenda values and answer-command extra fields.

The repair is frozen at `dc587da3719bd737c56f2418b8be1c806cecc832`, tree `e26ac437ccb4905379aacb2c23160dee92e49daa`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 16

**Frozen code:** `dc587da3719bd737c56f2418b8be1c806cecc832`

**Frozen source blob:** `229d8eaca0ae7c7f166c118fa538a03ab3b7b133`

**Frozen test blob:** `06e1ca3da197f934066435d1779a4539b2f5a6aa`

**Truthful state correction:** `37566b541958f737e6a6528b07fd8cfd08f64423`

**Adjudication:** `VETO`

Every round-fifteen reproduction held. Both reviewers then showed that the strict selector schema still did not bind the five trusted semantic evaluation versions to their same-key controlling watermarks. Canonical but invented decision-requirement, evidence-coverage, cutoff, policy and challenger versions could be self-refingerprinted and compiled. The selector also admitted an expiry before its trusted time, an actionable indeterminate challenger, contradictory reuse, actionable diagnostic text, an empty alternative set, an ineligible selected route and an ask route without a named gap or evidence reference. Duplicate unresolved input could make the official selector produce an actionable-looking result whose fingerprint was the reserved invalid sentinel. Release compilation compared watermarks but did not rederive selector expiry from the fresh closure.

Two adjacent proof-boundary families remained:

1. Intervention atom fingerprints sorted `evidenceVersions`, while creation, validation and approval did not require one stored order. Different raw bytes could therefore share the same payload and approval identities.
2. Approval, answer and correction paths still called array, object or string operations before complete runtime validation. A numeric approval evidence list, malformed selector watermark, malformed atom payload, null answer-ledger item or null correction receipt identity could escape as a raw TypeError rather than a defined fail-closed result.

These were current kernel failures. They were not deferred to canonical ingress because each occurred after the public boundary had accepted caller-owned plain data.

## Repair round 16

The repair binds each trusted decision-requirement, evidence-coverage, cutoff, epistemic-policy and challenger-result version to the same-key controlling watermark. It requires expiry to follow trusted evaluation time, indeterminate challenge to remain non-actionable, reuse to carry no unresolved evidence, every other actionable route to carry a named gap and evidence reference, actionable results to carry no diagnostic failure text, and the chosen alternative to exist and be eligible. Duplicate input control and evidence identities now force the official selector to hold. Release compilation rederives expiry from the fresh control closure.

Intervention creation rejects duplicate evidence identities and stores the accepted set in canonical order. Fingerprinting, validation and approval require those exact normal-form bytes rather than sorting at comparison time. Approval validates the selector watermark and binding collections before lookup or comparison. Answer and correction ledgers require complete exact receipt shapes before proof transfer, destructuring, replay or identity methods, so malformed plain values fail with defined contract errors.

One hundred and eighty-nine focused checks pass locally. Six new grouped tests reproduce all five forged evaluation bindings, seven route-semantic contradictions, duplicated unresolved evidence input, stale selector expiry at Release compilation, evidence-order equivalence and malformed approval, answer and correction boundaries.

The repair is frozen at `57e959e44634f24fdb5175d62f2d4aea2a9d0539`, tree `751736d2b669b66d12ea0d9860eb98a8b812d4b1`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 17

**Frozen code:** `57e959e44634f24fdb5175d62f2d4aea2a9d0539`

**Frozen source blob:** `c707847579616cc4eb21afd8e76cb684f6ad238e`

**Frozen test blob:** `e21caa3b05cdbd3dc21aa3939756be313ebc3c61`

**Truthful state correction:** `6365b74ac166ba24bd05341fd34c3017332b1ee9`

**Adjudication:** `VETO`

Every round-sixteen reproduction held. Exact review then found three selector-consistency gaps. A genuine ask could be relabelled as session with the paired reason code even though a lower-burden ask remained eligible. An actionable resolving route could call its gap `sufficient`. An alternative could simultaneously claim eligibility and carry rejection reasons. Each contradiction could be self-refingerprinted, compiled and evaluated as Release-eligible. The selector result omitted route burden, so Release could not replay the frozen least-burden precedence.

Two producer and time defects were also reproduced. Padded challenger-boundary or candidate-rejection input could pass route selection and produce an actionable result bearing the reserved invalid fingerprint instead of holding. `earliestExpiry` sorted valid date strings lexically, so different valid timezone encodings could select an instant one hour later than the true earliest expiry.

Finally, approval and Release invalidation receipt identities were not collision-safe. Two different officially created atoms could be approved under one receipt ID. Two different changed-control events could each issue an append-only invalidation receipt under one ID. This was the same local event-identity class already closed for answer, correction, lifecycle and execution receipts, not a deferred durable-ingress concern.

## Repair round 17

The selector result now carries each alternative's finite nonnegative burden inside its fingerprinted bytes. Validation replays the deterministic least-burden and route-order precedence for resolving routes, requires every alternative's eligibility to equal the absence of rejection reasons, and excludes `sufficient` from actionable unresolved gaps. Non-normal challenger boundaries and candidate rejection reasons are caught before selection and converted to a non-actionable, internally valid hold.

Expiry derivation now orders parsed instants and uses the source text only as a deterministic tie-break. Approval and Release invalidation issuance maintain local exact receipt-ID registries: an exact repeated event is stable, while the same ID for different event bytes fails before another proof-bearing receipt is returned. Durable restart rehydration and transactional uniqueness remain later-gate requirements.

One hundred and ninety-three focused checks pass locally. Four new grouped tests reproduce route-precedence forgery, eligibility and gap contradictions, padded producer inputs, timezone-offset expiry order and approval and invalidation identity collisions.

The repair is frozen at `79d39b681781514e38b28c4039948e40d618574c`, tree `a9d60542f1085e933dd3929e4e25d84cf443a04e`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 18

**Frozen code:** `79d39b681781514e38b28c4039948e40d618574c`

**Frozen source blob:** `5019aca11ddfc94e45b60f6cb381fc295c4fad47`

**Frozen test blob:** `94e8b67831666c2c321e708b3e9eacdf1032a54c`

**Truthful state correction:** `9dd5cd9fa5ebbae666e6aba306af0bb7c0c99340`

**Adjudication:** `VETO`

Every direct round-seventeen reproduction held. The defense reviewer then proved that burden-bearing alternatives were still caller-mutable derived facts rather than issued selector evidence. A caller could change the winning burden, delete the genuine winner or invent eligibility for a rejected route, update route and reason consistently, recompute the public fingerprint and cross Release. The adjudicator classified authenticity of otherwise internally coherent rewritten burdens as a later ingress concern; the defense reviewer classified same-process post-return mutation as current. The stricter current-gate interpretation governs this repair: kernel consumers must distinguish a selector actually issued by the kernel from a coherent reconstruction.

Three exact-identity defects also remained:

1. Timezone-less instants were accepted. Identical bytes changed expiry, route and selector fingerprint under different process timezones.
2. JavaScript negative zero survived as a burden but serialized identically to positive zero, so mutation could preserve the fingerprint.
3. Invalidation receipts omitted the exact projection fingerprint and exact observed current-control state. Different projections, or different versions of the same changed control, could therefore issue byte-identical receipts under one ID. The compiler also allowed one projection version to denote different exact content.

## Repair round 18

Selector results now receive a private in-process issuance proof at finalization. The proof is transferred only across the strict owned snapshot and is required by atom creation, approval, Release compilation and enrichment planning and execution. Public fingerprints remain inspectable, but coherent reconstruction or post-return mutation cannot impersonate kernel issuance. Official special-key identities such as `__proto__` remain supported by entering through selector input before issuance.

Temporal fields must now use an explicit `Z` or numeric-offset instant before parsing, making validity and route decisions independent of host timezone. Negative-zero burden is rejected at input, normalized out of held diagnostic alternatives and forbidden in selector-result semantics.

Invalidation receipts bind the exact projection fingerprint and a deterministic fingerprint of trusted time plus the observed control registry. The local compiler also prevents one projection version from denoting different exact projection content. Exact same-event replay remains stable; changed-event reuse of an identity fails closed.

One hundred and ninety-six focused checks pass locally. Three new grouped tests reproduce all three coherent selector rewrites, timezone-less authority divergence, negative-zero equivalence, same-version projection collision and same-key different-version invalidation collision.

The repair is frozen at `c006c6518e4488c32778bf1afc72fae218fc3759`, tree `7d67a63dae3bcad121ef28e774d9156a8d0d179a`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 19

**Frozen code:** `c006c6518e4488c32778bf1afc72fae218fc3759`

**Frozen tree:** `7d67a63dae3bcad121ef28e774d9156a8d0d179a`

**Frozen source blob:** `1c2ead6c5ccbc3be35e81ee3e4c689ddeecce3a1`

**Frozen test blob:** `c2b2e336878a516d067cee4151d7c511229a3f84`

**Truthful state correction:** `3e3041fca05e0f55f0b5ce0358aed2a9901268fc`

**Adjudication:** `VETO`

The selector issuance proof held across atom creation, approval, Release compilation and enrichment planning and execution. Coherent selector reconstruction, post-return route rewriting and prior attacks were rejected. The reviewers nevertheless found five remaining identity and claim-boundary defects:

1. Negative zero was rejected only in selector burden. An execution attempt with `elapsedMs: -0` and one with positive zero still shared JSON identity and could replay as the same event.
2. Explicit-zone date syntax still admitted impossible calendar and clock values because `Date.parse` normalized values such as 30 February and hour 24 instead of rejecting them.
3. The projection-version registry protected compilation but was not consulted at use. A returned projection could be rewritten, publicly refingerprinted and paired with matching authority while retaining the issued version.
4. Invalidation replay fingerprinted the entire supplied control registry. An unrelated control change, or dependency order alone, could turn an exact relevant event into an identity collision even though neither changed the applicable closure.
5. The public selector receipt renderer checked structure but not issuance. A structured clone or coherent self-refingerprinted rewrite could therefore display eligible standing even though every action path rejected it.

The panel treated the fifth finding as especially instructive: a read-only explanation is still a claim boundary. Visible standing must carry the same authenticity standard as an action-bearing consumer.

## Repair round 19

The strict owned-data boundary now rejects negative zero for every numeric field. Date validation now checks the actual Gregorian day, clock components and RFC 3339 numeric-offset range before parsing, so an explicit zone cannot make an impossible instant actionable.

Release use now requires the exact projection-version and fingerprint pair recorded by local issuance. Invalidation identity is derived only from the projection's applicable control closure, with canonical key and dependency ordering, while still binding each relevant control's lineage, version, state and validity bounds plus trusted evaluation time. Unrelated lineage and nonsemantic input order no longer disturb exact replay.

The selector receipt renderer now transfers proof only through the strict owned snapshot and requires the exact private selector issuance proof before it may render eligible standing. Structured clones and coherent public refingerprints render only the existing held result.

One hundred and ninety-nine focused checks pass locally. Three new grouped checks cover impossible instants, shared negative-zero rejection, exact issued projection use, relevant-closure invalidation replay, dependency-order normalization and renderer rejection of structured clones and coherent rewrites.

The repair is frozen at `e77609806c3526ccd62205ce550723f4871bfa8e`, tree `946e4a44f477d434527fe00d883e16e75146ee4e`, source blob `3e12e6fa25d147680c893f7b9e3d0097eef3d279` and test blob `c25eb50f8cbb830d3516e0429ff9d60eb624ed30`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 20

**Frozen code:** `e77609806c3526ccd62205ce550723f4871bfa8e`

**Frozen tree:** `946e4a44f477d434527fe00d883e16e75146ee4e`

**Frozen source blob:** `3e12e6fa25d147680c893f7b9e3d0097eef3d279`

**Frozen test blob:** `c25eb50f8cbb830d3516e0429ff9d60eb624ed30`

**Truthful state correction:** `753661af2e0f2bf8df1980927227f5a4587602f7`

**Adjudication:** `VETO`

All five direct round-nineteen repairs held. Global negative zero, impossible instants, explicit-zone timezone determinism, issued projection use, unrelated-lineage and dependency-order replay, relevant recorded-control sensitivity, selector receipt proof and every historical selector action boundary survived. The reviewers found four adjacent integrity failures:

1. A coherent but unissued projection could not become eligible, but its projection-integrity error still entered invalidation receipt construction. It could register an attacker-chosen receipt ID and cause the genuine issued projection's later invalidation to collide.
2. Invalidation observation included the old applicable manifest but not newly reached transitive descendants. Changing the version of a newly added relevant child or grandchild therefore replayed the same receipt even though current closure correctly reported the new relevant lineage.
3. An exactly issued held selector could place a false eligible-standing line inside `expectedMaterialEffect`. The line-oriented renderer authenticated the selector object but interpolated control characters without protecting the visible protocol.
4. If one nested command field made the root enrichment snapshot fail, the malformed result returned an empty receipt ledger. The attempt was correctly rejected, but its result could masquerade as replacement state and erase already issued history.

These findings sharpen one invariant across the product: refusal alone is insufficient. Invalid input must neither consume durable identity, visually impersonate standing nor erase prior valid state.

## Repair round 20

Projection fingerprint, issuance and selector-binding integrity now fail before invalidation construction, and invalid trusted evaluation time likewise returns no receipt. Only an exact issued projection may mint or register control-change history.

Invalidation observation now walks the current transitive graph from every recorded root and applicable key. It includes newly reached children, deeper descendants and missing-node sentinels while excluding unreachable registry entries. Current relevant state changes therefore alter receipt identity without restoring unrelated-lineage noise.

The line-oriented selector renderer fails closed when any interpolated value contains line or control characters, so issued free text cannot create an apparent protocol field. Malformed enrichment commands independently recover only a canonical sequence of exact issuance-proven prior receipts and return a proof-preserving clone; untrusted receipt combinations remain discarded.

Two hundred and two focused checks pass locally. Three new grouped checks cover projection receipt-ID poisoning and invalid trusted time; direct, deep and missing-to-present dependency observation; visible-standing line injection; and malformed-command ledger preservation followed by continued valid use. One historical assertion was deliberately tightened: projection-integrity failures now return no invalidation receipt rather than documenting attacker-controlled projection bytes.

The repair is frozen at `a08978a5e8518d6059f9963a6a4238d341ae84bd`, tree `5c49f8159f7f79396570c2a1abb9212a343039ad`, source blob `e755382546f5f48d2c8cc0dd8aae9e298e63fece` and test blob `bbc8c2a679e9df7d1adad0045a8ae4c78a0d4af5`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 21

**Frozen code:** `a08978a5e8518d6059f9963a6a4238d341ae84bd`

**Frozen tree:** `5c49f8159f7f79396570c2a1abb9212a343039ad`

**Frozen source blob:** `e755382546f5f48d2c8cc0dd8aae9e298e63fece`

**Frozen test blob:** `bbc8c2a679e9df7d1adad0045a8ae4c78a0d4af5`

**Truthful state correction:** `2b1cb0d8ce64ced17ad9420b9d661b5c129739e0`

**Adjudication:** `VETO`

Every direct round-twenty repair held. Projection-integrity and invalid-time failures minted no receipt; current children, deeper descendants, cycles and missing-to-present controls changed invalidation identity; unreachable controls and dependency order did not. C0, C1 and Unicode line separators could not inject protocol lines, and a genuine canonical ledger survived malformed command data. Two narrower defects remained:

1. Execution issuance proof authenticated each receipt but not its causal predecessor. Two independent branches under the same plan could therefore be spliced into a sequence of genuine attempt-one and attempt-two receipts, preserved as apparently valid history and extended with a third receipt even though attempt two had never followed the supplied attempt one.
2. The visible renderer's control filter omitted Unicode format characters. Bidirectional overrides, isolates, zero-width format characters and BOM could remain in an issued visible field and alter how the authenticated line protocol appeared.

The first finding distinguishes authentic records from authentic history: a list of individually genuine events does not prove that those events form the sequence claimed by their container.

## Repair round 21

Every execution receipt now carries the exact canonical fingerprint of its complete prior ledger. Genesis binds the empty prefix; each later receipt binds the exact ordered predecessor history. Normal validation and malformed-command recovery both verify every prefix link before replay, budget calculation, preservation or append. Mixed branches, reordered authentic receipts and causal splices cannot be treated as append-only history.

Visible receipt fields now also reject the Unicode `Cf` format category in addition to C0, C1 and Unicode line separators. The regression set includes bidirectional overrides, isolates, terminators, zero-width characters and BOM.

Two hundred and three focused checks pass locally. The new grouped execution test builds two independently genuine same-plan branches, attempts both ordinary append and malformed recovery of a splice, and requires an empty untrusted replacement while preserving valid branch continuation. The renderer test probes RLO, LRO, LRI, PDF, PDI, zero-width and BOM controls.

The repair is frozen at `012b119af208011aab3eb4540601ce6d160825fd`, tree `59ba8df181c6fc35ff584da49727befff8e89c62`, source blob `baa6dcb701c87cbf3eaee25c52b76f358196a85b` and test blob `2f65279be175501e8f4e0f6d98dd1bd925872924`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 22

**Frozen code:** `012b119af208011aab3eb4540601ce6d160825fd`

**Frozen tree:** `59ba8df181c6fc35ff584da49727befff8e89c62`

**Frozen source blob:** `baa6dcb701c87cbf3eaee25c52b76f358196a85b`

**Frozen test blob:** `2f65279be175501e8f4e0f6d98dd1bd925872924`

**Truthful state correction:** `5904489a5226deb59b69a4a419cd198ad9520f0e`

**Adjudication:** `VETO`

The causal chain closed branch splicing in ordinary validation, and exhaustive visible probes rejected all 237 tested `Cc`, `Cf`, `Zl` and `Zp` code points. Longer forks, reordering, reconstruction, output mutation and genuine replay also behaved correctly. Two implementation flaws remained:

1. `priorLedgerFingerprint` stored the complete prior ledger as JSON, including every earlier embedded prefix. Genuine history therefore grew exponentially: approximately 135 KB at attempt one, 240 MB at attempt eight, then an invalid-string-length exception at attempt nine. A low plan budget did not bound this because every additional over-budget call could still mint another held receipt.
2. A plain but semantically invalid command such as an unknown outcome passed the strict snapshot and reached a malformed branch that directly cloned the supplied receipt list before causal validation. A spliced authentic branch or even a junk object could therefore be returned as if it were preserved state, despite no new receipt being issued.

This was an important availability correction: a sound authenticity mechanism is not sound if normal valid use makes its representation explode, and every malformed path must preserve only verified history rather than merely avoid new action.

## Repair round 22

The execution ledger now uses a fixed 256-bit SHA-256 chain. Genesis is domain-separated, and every next chain tip hashes the prior fixed digest with the canonical current receipt. Each receipt stores only the fixed digest of its prior history. Validation walks once through the ordered chain rather than recursively embedding earlier ledgers.

Enrichment plans are capped at 32 executable attempts. At most one further append-only `attempt_budget_held` receipt may document the first over-budget attempt; later new attempts return `attempt_budget_exhausted` without another durable receipt. Plan creation, public plan fingerprinting, ledger validation and recovery share that bound.

Every post-snapshot malformed result now returns only the independently recovered, issuance-proven and causally valid prior ledger. Spliced and junk ledgers return an empty untrusted replacement even when the malformed command itself is ordinary plain data.

Two hundred and four focused checks pass locally. The new tests independently verify the SHA-256 genesis digest, fixed 71-character chain identities, bounded ledger size, plan-limit rejection, one terminal over-budget receipt, no later receipt, and both splice and junk recovery through a plain malformed outcome.

The repair is frozen at `2b91f104dd22f9696aa24fcaeb3cc18bf4d3b474`, tree `5321a7103dbf22a769fe0df5b7feac92a4db5b70`, source blob `5d251648861a00e1cb09f0478aca0cdc008966ec` and test blob `58b148ae8863af1163045104bd30b7804c05d4ba`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 23

**Frozen code:** `2b91f104dd22f9696aa24fcaeb3cc18bf4d3b474`

**Frozen tree:** `5321a7103dbf22a769fe0df5b7feac92a4db5b70`

**Frozen source blob:** `5d251648861a00e1cb09f0478aca0cdc008966ec`

**Frozen test blob:** `58b148ae8863af1163045104bd30b7804c05d4ba`

**Truthful state correction:** `7caed974980a7d0ad6727eaa2422b27c8bcbe3f3`

**Adjudication:** `VETO`

The adjudicator passed the exact round-twenty-two bytes after independently matching the pure SHA-256 implementation to standard vectors and Node, replaying all 33 chain positions, closing branch splice and malformed plain-scalar recovery, and confirming all 204 focused checks plus the adjacent gates. The defense reviewer reproduced those successes but found two narrower defects. The stricter current-gate verdict governs:

1. The 33-receipt bound was checked only after recursively snapshotting the caller's ledger. Dense oversized input was therefore rejected eventually but could still consume work proportional to its supplied size before rejection. The reviewer measured approximately 793 milliseconds for 100,000 entries and 5.47 seconds for 500,000 entries.
2. The one-terminal-receipt rule applied only to the returned full ledger. Reusing the same authentic pre-terminal prefix with different receipt and idempotency identities could mint multiple distinct `attempt_budget_held` receipts. Exact replay from the full ledger worked, but the terminal boundary was not final from the authentic prefix that created it.

The SHA-256 chain itself remained correct under standard vectors, Unicode and large payload probes. The availability concern is now bounded input admission, not digest correctness. Durable restart, concurrent writers and authoritative prefix acceptance remain outside this local kernel; same-process terminal finality is a current obligation because the kernel explicitly claims one terminal receipt.

## Repair round 23

Receipt-ledger admission now reads the caller's own `priorReceipts` data descriptor and performs a guarded plain-array length preflight before any recursive snapshot or entry inspection. Oversized, inherited, accessor-backed, custom-prototype and otherwise non-admissible ledgers return the defined malformed hold with no recovered replacement. The independent recovery path repeats the bound so no later path can re-enter an oversized ledger.

Terminal issuance is now registered against the exact issued plan object and a domain-separated digest of plan fingerprint, authentic prior-chain tip and terminal ordinal. The first exact over-budget request may mint the sole terminal receipt. An exact repeat from the same pre-terminal prefix returns a defensive proof-preserving replay of that receipt; any different request from the terminalized prefix returns `attempt_budget_exhausted` without a new receipt. An invalid or stale selector cannot consume the terminal slot, and caller mutation of returned terminal bytes cannot poison the stored replay. The registry is plan-owned through a weak key, so a discarded issued plan does not create permanent global retention.

Two hundred and six focused checks pass locally. The new checks prove that a 34-entry dense ledger containing hostile proxies is rejected with zero entry inspections, and that stale boundary calls, exact stale-prefix replay, competing terminal identities, full-ledger replay and caller mutation all preserve one terminal event.

The repair is frozen at `d2d20616e0000d01fbf1f95409260487c0479eaa`, tree `f2cf807a0b772fd473966693c63cec5249fbbce1`, source blob `f6e23fe3f19ab437a21f6606cf60607f3228d854` and test blob `855c65f2d483dcf0134fa217b349c939d0e8bd47`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 24

**Frozen code:** `d2d20616e0000d01fbf1f95409260487c0479eaa`

**Frozen tree:** `f2cf807a0b772fd473966693c63cec5249fbbce1`

**Frozen source blob:** `f6e23fe3f19ab437a21f6606cf60607f3228d854`

**Frozen test blob:** `855c65f2d483dcf0134fa217b349c939d0e8bd47`

**Truthful state correction:** `5119ca7c431d5cd6f1696deef6a565af916ed108`

**Adjudication:** `VETO`

Both reviewers verified that the ordinary round-twenty-three attacks closed, all 206 focused checks passed and the adjacent gates remained stable. They then independently reproduced two current-gate defects:

1. Terminal state was keyed by the issued plan object's JavaScript identity. Two separately and legitimately issued byte-identical plans had the same canonical fingerprint but different weak keys, so each could mint a different terminal receipt from the same authentic prefix. Separate authentic branches under one plan could also each retain a terminal entry, making the nested per-plan map grow with forks.
2. The ledger preflight and full input snapshot observed caller-owned values separately. A stateful command proxy could present an empty ledger to preflight and a 100,000-entry ledger to the later snapshot, which traversed every hostile entry before rejection. A zero-length array with 400,000 unrelated own keys also forced full key enumeration despite having no receipt entries.

The review clarifies the correct boundary: exact terminal identity belongs to the canonical plan, not an incidental object instance or caller-selected branch. Bounded receipt work also requires one captured command view and a projection of only semantic receipt indices and fields; repeatedly asking adversarial objects to describe all their properties cannot provide a meaningful local work bound.

## Repair round 24

The command root is now captured once from exact own data descriptors before any nested snapshot. The later owned snapshot receives only those captured values, so a time-varying outer object cannot substitute a different ledger between checking and use.

Receipt-ledger capture checks one observed array length before reading indices, caps it at 33 and copies only those bounded numeric entries. Each entry is reduced through the fixed receipt-field allowlist before proof and causal-chain validation. Unrelated container keys, symbols and accessors are neither enumerated nor read; they cannot enter the owned semantic value. Receipt extras likewise cannot enter calculation, while every allowlisted receipt value must still match the private issuance proof. This is deliberate bounded canonical projection, not acceptance of an extra field as evidence or instruction.

Terminal state is now keyed by the exact canonical plan fingerprint and contains one prefix plus one terminal receipt. A separately issued byte-identical plan therefore sees the same final boundary. The first authentic branch to terminalize the plan establishes the sole terminal state; exact same-prefix and same-request use replays it, while a different request or a competing authentic branch returns `attempt_budget_exhausted` without minting. Registry growth is reduced to at most one terminal state per exact plan rather than one per caller-created fork; durable lifecycle and rehydration remain the later ingress obligation.

Two hundred and nine focused checks pass locally. Three new checks cover separately issued equivalent plans, competing authentic branches, exact equivalent-plan replay, one-view stateful command capture with a hidden 100,000-entry alternative, and a zero-length ledger carrying 10,000 unrelated accessor keys with zero accessor reads.

The repair is frozen at `8ac8f6a8e2f48eb56f7b8ac80c17401d34e1b30f`, tree `8552dc3554646a60daa7485b7ad8bf3912120e5a`, source blob `1faeb23d341d1f6f90c8707bafb322d507c90490` and test blob `729161718eda4065d8922a3f80c28f541772d207`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 25

**Frozen code:** `8ac8f6a8e2f48eb56f7b8ac80c17401d34e1b30f`

**Frozen tree:** `8552dc3554646a60daa7485b7ad8bf3912120e5a`

**Frozen source blob:** `1faeb23d341d1f6f90c8707bafb322d507c90490`

**Frozen test blob:** `729161718eda4065d8922a3f80c28f541772d207`

**Truthful state correction:** `8dcf0504c545e003b33f5d0013098e4b568f56f8`

**Adjudication:** `VETO`

Both reviewers verified that equivalent-plan and authentic-branch terminal finality held, the stateful outer command attack no longer traversed its hidden 100,000-entry ledger, and all 209 checks plus adjacent gates passed. Three current defects or claim conflicts remained under the combined stricter verdict:

1. A malformed outer command with an extra string key, symbol or missing non-ledger field returned before independently recovering its valid receipt history. The rejection was correct, but the empty returned list could again masquerade as replacement state and erase authentic history.
2. Allowlisted projection accepted a proof-bearing receipt after unsupported string and symbol fields had been added, silently removing those mutations. The fields could not influence semantics, but accepting the post-issuance mutation contradicted the exact-envelope and mutated-history rejection claims.
3. The canonical terminal registry retained the complete large plan fingerprint and complete terminal receipt for every terminalized plan. One hundred plans retained approximately 25.5 MB after garbage collection; an ordinary fixture's stored receipt serialized to approximately 135 KB. Canonical finality was correct, but the registry itself created avoidable permanent amplification.

The adjudicator accepted bounded receipt projection as a safe semantic boundary if documented precisely. The defense reviewer correctly required issuance-time immutability of the keyset so projection could not launder a post-issuance mutation. The combined resolution is to seal the exact issued receipt envelope, then inspect only that bounded envelope, and to retain fixed cryptographic identities rather than full event payloads.

## Repair round 25

Every newly issued execution receipt and every proof-preserving receipt clone is now sealed with its exact canonical keyset. Recovery first requires the original source object to carry an issuance proof and remain sealed, then performs exact-key capture. Unsupported string or symbol additions therefore cannot be made to an authentic receipt. Canonical fields remain writable only so the boundary can detect and reject their mutation through the existing fingerprint mismatch; callers cannot expand or shrink the envelope.

Outer command capture now acquires the prior-ledger descriptor first and retains it independently from the envelope-exactness verdict. Extra keys, symbols, missing non-ledger fields, custom shape or later reflection failure still reject the command, but a valid issuance-proven causal ledger is returned as preserved state. The command is never acted on unless the complete outer envelope is exact.

Terminal state is keyed by a domain-separated SHA-256 digest of the exact canonical plan fingerprint. It stores only the fixed prefix digest, fixed request digest and fixed receipt digest. Exact replay deterministically reconstructs the receipt from the newly validated request, verifies its fixed digest and issues a fresh sealed proof-preserving result. Full plan, request and receipt payloads are no longer retained by the registry. The registry remains same-process state with later durable lifecycle, restart and concurrency requirements, but its value size no longer scales with fixture or identifier size.

Two hundred and eleven focused checks pass locally. New checks cover outer string extras, symbol extras and missing non-ledger fields over a valid two-receipt history; sealed original and cloned receipts; rejection of string and symbol additions at mutation time; and continued detection of canonical-field mutation.

The repair is frozen at `5dc193851a2452d77fc2080c195028adf9ab1115`, tree `61d87d44ab39a027d50b8707ddf64cfdfacf5880`, source blob `872d3da1b57ac7c4c2c3cda43a12cce039bf7654` and test blob `213caa0b0735ac394a3d8263a36ade7723ea250c`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 26

**Frozen code:** `5dc193851a2452d77fc2080c195028adf9ab1115`

**Frozen tree:** `61d87d44ab39a027d50b8707ddf64cfdfacf5880`

**Frozen source blob:** `872d3da1b57ac7c4c2c3cda43a12cce039bf7654`

**Frozen test blob:** `213caa0b0735ac394a3d8263a36ade7723ea250c`

**Truthful state correction:** `45004a0ad1eb4f79775ca42be4395fae997dd5b1`

**Adjudication:** `VETO`

The adjudicator passed the exact bytes after verifying outer-malformed history preservation, sealed receipt behaviour, fixed-digest terminal replay, equivalent-plan and branch rejection, all 211 focused checks and adjacent gates. The defense reviewer reproduced those successes and measured the fixed-digest registry improvement: retained heap for 100 terminalized plans fell from approximately 25.5 MB to 0.7 MB. The defense reviewer then found one finality hole, and that stricter verdict governs.

After a one-attempt plan issued its ordinary receipt and terminal over-budget receipt, the same already-terminalized plan could be called again with an empty ledger. Because terminal state was looked up only when the caller-supplied ordinal was over budget, each fresh empty-ledger branch appeared to be attempt one and could mint another `proposed_evidence` or held receipt. Terminal receipt uniqueness therefore held only at the terminal ordinal, not across every later new issuance for the canonical plan.

This finding sharpens terminal meaning: finality is a property of the canonical plan, not merely a particular terminal call. Once terminalized, caller-selected history cannot reopen the plan. Exact replay of an event already present in a valid supplied ledger remains different from new issuance and may remain available.

## Repair round 26

The canonical terminal-plan digest is now derived and looked up on every valid enrichment-attempt call, regardless of caller-supplied ordinal. If the plan is terminalized and the requested idempotency identity is not already present in the valid supplied ledger, the call is accepted only when it exactly matches the stored terminal prefix and request for deterministic reconstruction. Every other new call, including a fresh empty-ledger branch that appears under budget, returns `attempt_budget_exhausted` without a receipt.

Exact replay of an ordinary receipt already carried by valid causal history still follows the existing idempotency path. Exact terminal replay from a full ledger likewise remains stable. The focused test now asserts post-terminal empty-branch rejection and ordinary in-ledger replay alongside equivalent-plan and competing-branch finality. The total remains two hundred and eleven focused checks.

The repair is frozen at `807f1d659888d1bdd57acf9ba314e0c72316cf02`, tree `510651e652463feffcd0a4ed6fd157aa8d22f097`, source blob `a2a8fd9a0b82a70c174ad01a00d887b0405874ff` and test blob `dd3801426161c7fb099030926dd2393db803e0a5`. The exact bytes are under independent review and remain unverified until that review clears.

## Review round 27

**Frozen code:** `807f1d659888d1bdd57acf9ba314e0c72316cf02`

**Frozen tree:** `510651e652463feffcd0a4ed6fd157aa8d22f097`

**Frozen source blob:** `a2a8fd9a0b82a70c174ad01a00d887b0405874ff`

**Frozen test blob:** `dd3801426161c7fb099030926dd2393db803e0a5`

**Adjudication:** `PASS`

The implementation defense and independent adjudicator both verified the exact identities and passed the same frozen bytes. They independently reproduced the round-twenty-six bypass on `5dc193851a2452d77fc2080c195028adf9ab1115`, then confirmed it is closed on `807f1d659888d1bdd57acf9ba314e0c72316cf02`.

After terminalization, fresh empty, truncated, complete pre-terminal, alternate authentic branch and separately issued equivalent-plan prefixes cannot mint another receipt. New, colliding and competing terminal identities likewise remain exhausted. Exact ordinary in-ledger replay, terminal-prefix replay and full-terminal-ledger replay remain valid and proof-bearing. Mutation of a returned terminal receipt cannot change deterministic reconstruction. Proofless, spliced, reordered, canonically mutated and malformed histories do not reopen issuance, while a malformed outer command preserves only genuine sealed causal history.

Both reviewers passed the five frozen G24 contract checks and all 211 focused tests. The adjudicator additionally passed 66 adjacent G21 checks, documentation checks, changed-file lint, zero-new-error TypeScript comparison and `git diff --check`. The defense measured approximately 0.6 MB retained after 100 distinct terminalized plans, compared with approximately 25.5 MB before the fixed-digest repair. No current local-gate defect was reproduced.

The exact local kernel is therefore independently verified within this build contract. This pass does not extend authority or evidence into trusted ingress, restart durability, transactional concurrency, production runtime, user experience, model intelligence, external action or customer value.

## Preserved proof limits

This local kernel does not prove authoritative input provenance, durable approval or enrichment-plan rehydration, production concurrency, real model intelligence, customer comprehension, customer data handling, efficacy, delight, willingness to pay or any external action. The repaired-byte review has cleared; trusted canonical ingress is now the next technical boundary.
