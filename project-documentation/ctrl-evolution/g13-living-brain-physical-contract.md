# G13 Living Brain physical contract

**Status:** Executable contract proof complete; material interface proof not yet approved

**Authority:** `D-055` authorises this contract and local proof-fixture work. It does not authorise a production schema, migration, customer repository, material interface implementation, merge or release.

**Machine contract:** [`g13-living-brain-contract.json`](g13-living-brain-contract.json)

**Proof pack:** [`g13-living-brain-proof-fixtures.json`](g13-living-brain-proof-fixtures.json)

**Executable check:** `npm run brain:g13:check`

## The decision in one sentence

CTRL will store one versioned, authority-aware Brain and derive both the concise portrait and immersive Living Map from it, so the experience can feel alive without inventing relationships or allowing a model to become the memory authority.

## Strategy brief

### Outcome

A fresh engineer should be able to implement the Brain kernel, projections and correction cascade without guessing what is true, what the user can see, what AI may alter or what the map is allowed to imply.

### Why this route

The chosen route proves the kernel and projection invariants before designing the new interface. The rejected material alternative is a visual-first rebuild that preserves the current graph and retrofits meaning later. That route is faster to demo but creates a blocking credibility risk: visual connections could outrun the evidence and correction model beneath them.

### User and stakes

The first subject is a decision-owning leader inside a Mindmake engagement. Krish may operate the system backstage, but the Brain belongs to the subject. A failure is not merely a wrong card or edge. It can distort a consequential decision, expose private judgement, preserve a correction incorrectly or make a portable release untrustworthy.

### Authority

Local documentation, machine contracts, fixtures, validators and non-production rendered proofs are allowed. Production database changes, customer data migration, GitHub App creation, material UI implementation, merging and deployment remain separate gates.

### Verification

The contract passes only when deterministic fixtures prove:

- the portrait and map refer to the same eligible canonical versions;
- every semantic edge is typed, current, audience-eligible and evidence-bearing;
- staged or proposed material cannot appear as accepted Brain truth;
- disputed or superseded material cannot steer current work;
- private state cannot cross its audience boundary;
- a correction is append-only, replay-safe and complete across known dependencies;
- consequential downstream artifacts are flagged for human review rather than silently rewritten; and
- representative scale preserves bounded semantic zoom and deterministic output.

## The physical topology

The canonical runtime is an append-only event and version model with replaceable projections. The seven concepts remain the product kernel; physical records make their boundaries enforceable.

| Record | Physical role | Mutable? | User normally sees it? |
|---|---|---:|---:|
| Workspace | Binds subject, owner and tenant scope | narrowly | no |
| Source | Immutable evidence envelope or governed external pointer | no | on inspection |
| Assertion | Atomic statement tied to a source span, speaker and epistemic basis | no | on inspection |
| Brain item identity | Stable identity across revisions | no | indirectly |
| Brain item version | One immutable meaning, scope, authority and time-bound state | no | yes, through projections |
| Relationship identity | Stable identity for one relationship across revisions | no | indirectly |
| Relationship version | One typed, evidenced relationship between exact item versions | no | yes, through the map |
| Decision case | Complete human-owned decision and later outcome | append-mostly | yes |
| Learning proposal | A requested state transition, never accepted truth by itself | append-mostly | when useful |
| Correction event | Human-authorised reason for changing current understanding | no | yes, in change history |
| Dependency use | Where a version materially influenced a projection or artifact | no | on inspection |
| Repair receipt | Outcome for one affected dependency | no | concise receipt |
| Release | Deterministic portable projection plus manifest and verification | no | yes |

No source row becomes a Brain item merely because it exists. No assertion becomes durable judgement merely because a model extracted it. No relationship becomes visible merely because vector similarity is high.

## Workspace, subject and ownership

Every record carries a workspace. Every personal Brain workspace names one subject and one owner. The initial case uses the same person for both. Company transition maps require a separate workspace and audience contract rather than a broad permission on the personal Brain.

The minimum workspace fields are:

- stable workspace ID;
- subject ID;
- owner ID;
- tenant or engagement boundary;
- allowed contributors, viewers and approvers;
- default retention policy; and
- current lifecycle state.

The viewer context is evaluated at projection time. It contains the viewer identity, subject identity, audience grants, purpose, task context and consequence level. Trust and sharing remain separate. A trusted private item stays private.

## Source and assertion contract

A source preserves what happened before interpretation. It contains source type, actor or speaker, captured time, purpose, audience, retention and an integrity hash or stable external pointer.

An assertion contains exactly one claim. It must reference a source and a source span or equivalent integrity proof. It records:

- subject;
- speaker;
- whether the claim was user-stated, demonstrated, observed, inferred, outcome-tested or external;
- the atomic statement;
- source offsets or a content hash; and
- system time separately from valid time where those differ.

Summaries may be regenerated. Assertions and source evidence are not silently rewritten when a summary changes.

## Brain item identity and version

`brain_item_id` is the stable identity. `brain_item_version.id` is the immutable version. A canonical reference is:

```text
item:<brain_item_id>@v<version>
```

Every version requires:

- workspace, subject and owner;
- semantic type: aim, standard, preference, pattern, example, tension or context;
- plain-language meaning;
- one or more human-view memberships;
- epistemic basis;
- maturity;
- standing;
- audience;
- consequence permission;
- applicability across domains, roles, tasks, conditions and exclusions;
- supporting assertion IDs and contrary assertion IDs;
- exceptions and counterexamples;
- separate confidence components for evidence quality, corroboration, recency, transfer and human confirmation;
- valid time and recorded time; and
- predecessor and supersession lineage.

The four axes are independent:

1. Maturity: staged, proposed, held or trusted.
2. Standing: current, disputed, superseded, retired or expired.
3. Audience: person-private, delivery-team-private, named company or project, approved pattern commons or public release.
4. Consequence permission: personalise presentation, suggest or retrieve, shape reversible work, confirm before consequential use or prohibited in context.

Exactly one version of a Brain item may have current standing. A new version closes the valid time of its predecessor. History remains available where lawful but cannot steer current work.

## Relationship contract

Relationships connect exact versions, not vague topics or only stable item IDs. This prevents an old relationship from surviving a material change in meaning without review.

V1 relationship types are:

| Type | Direction | Meaning |
|---|---:|---|
| supports | directed | one item provides a reason or mechanism for another |
| contradicts | undirected | the two meanings cannot both be relied on without resolution |
| qualifies | directed | one item narrows where another applies |
| in tension with | undirected | both may remain valid but require a trade-off |
| depends on | directed | one item loses force if another fails |
| informs | directed | one item changes interpretation or use of another |
| exemplifies | directed | an example demonstrates a standard, preference or pattern |

Every current relationship requires:

- a stable relationship identity and immutable version;
- two existing current canonical item-version references;
- one allowed relationship type;
- a plain-language explanation;
- at least one valid evidence assertion;
- epistemic basis, maturity, standing, audience and consequence permission; and
- predecessor and supersession lineage.

A Brain item or relationship cannot widen the audience of its supporting evidence unless it carries a separate, explicit item-level audience authorization. V1 defaults to the evidence audience as a hard ceiling.

Similarity can nominate a relationship proposal. It cannot create a visible semantic edge. Hub tethers used by the layout engine are explicitly non-semantic and never appear in the relationship inspector.

## Decisions remain first-class

A decision is not compressed into a generic memory. Its physical record preserves:

- the original pressure;
- the human prior;
- alternatives and the evidence that could change the call;
- the independent AI view and strongest counter-case;
- accepted, resisted, corrected and unresolved points;
- the person's owned call;
- commitments and reopen conditions; and
- later outcome and process-quality evidence.

The portrait may show an active decision in My calls. The map may show the same decision as a first-class node. Any proposed Brain learning derived from it remains a separate learning proposal until authority is granted.

## Learning proposals

A proposal describes a requested transition: add, revise, narrow, merge, dispute, demote, retire or erase. It includes candidate meaning, source assertions, intended scope, expected downstream effect and required authority.

Pending proposals may appear in an explicitly provisional review layer. They cannot appear in the confident portrait, map or context planner as accepted truth. Silence and repeated exposure never count as approval.

## Projection service

The portrait and Living Map are read models built by one deterministic projection service. They are disposable and rebuildable. Neither becomes canonical truth.

The projector receives:

```text
workspace + viewer + purpose + task context + consequence + as-of time
```

It applies, in order:

1. workspace and subject scope;
2. audience access;
3. current standing and valid time;
4. maturity allowed for the requested layer;
5. consequence permission;
6. applicability and exclusions;
7. task relevance; and
8. deterministic budgets and ordering.

It emits a projection manifest containing contract version, workspace, subject, canonical references, relationship versions and a deterministic content hash. Selection reasons remain inspectable.

### Current portrait

The portrait uses five human meanings:

- What matters;
- How I judge;
- My calls;
- Unresolved; and
- What changed.

These are lenses, not storage buckets. One version may belong to more than one lens. The everyday portrait contains at most twelve high-value cards. Proposed or disputed material appears only in a clearly provisional or unresolved layer and never adopts the visual treatment of accepted current judgement.

### Living Map

Every portrait reference must resolve to the identical canonical version in the Living Map for the same viewer, purpose and task context. The map can reveal more eligible items through navigation, but it cannot show a conflicting version or cross an audience boundary.

The physical contract permits the visual system to encode only supported semantics:

| Visual property | Permitted meaning | Forbidden implication |
|---|---|---|
| Node presence | eligible current entity in this projection | universal importance or objective truth |
| Node kind | Brain item type or first-class decision | personality diagnosis |
| Node size | relevance to the current projection | value, certainty, intelligence or moral importance |
| Semantic link | current typed relationship with inspectable evidence | similarity, association or causality without support |
| Link treatment | approved relationship state or maturity | false numerical precision |
| Change motion | newly accepted, corrected, disputed or repaired state | decorative proof that the AI is thinking |
| Spatial distance | navigation and legibility only | semantic closeness, strength or causality |
| Hub tether | non-semantic layout physics | a real relationship to the subject |

The exact colours, shapes, movement and transitions remain a material design decision. The next rendered proof must make these meanings understandable without a legend-heavy technical interface.

### Semantic zoom

The map has three levels:

1. Orientation: at most eighteen current entities, selected by task relevance and balanced across the human meanings.
2. Neighbourhood: the selected entity plus at most twenty-three directly relevant or related entities.
3. Item and evidence: one item, its meaning, applicability, exceptions, sources, change history and available correction.

The full graph may contain far more records than any one frame. Progressive disclosure is a truth and cognitive-load mechanism, not a way to hide weak evidence.

## Correction and repair

A correction is an event, not an overwrite.

The deterministic path is:

1. Authenticate the actor and authority.
2. Check the idempotency key.
3. preserve the prior version and evidence;
4. append the corrected version;
5. mark the prior version superseded and close its valid time;
6. supersede or dispute every relationship whose meaning may no longer hold;
7. enumerate known dependency uses;
8. rebuild disposable projections, indexes and caches;
9. quarantine or flag consequential delivered artifacts, shared releases and published skills for human review;
10. produce one repair receipt per dependency; and
11. verify no eligible current projection retains the prior version.

Automatic repair is allowed for portrait projections, map projections, retrieval indexes and caches. CTRL may mark a consequential artifact as requiring review. It may not silently rewrite an already delivered board paper, shared Brain release, published skill or another person's Brain.

Repair is complete only when every known dependency has one terminal receipt: rebuilt, quarantined, review required, unaffected with reason or erased. An unenumerated dependency is a graph-coverage failure, not a successful repair.

## Deterministic portable release

A release compiles accepted state into human-readable files and a machine manifest. It is immutable and includes:

- workspace and audience boundary;
- Brain contract version;
- exact included item and relationship versions;
- provenance references allowed for that audience;
- decision and unresolved-state projections;
- evaluation fixtures allowed for export;
- content hashes; and
- destination receipt where synchronised externally.

Recompiling identical accepted state must produce byte-identical output. A GitHub edit returns as a proposed change. It never overwrites the live Brain automatically.

## Recommended physical storage mapping

This is the target mapping for a later migration design, not an authorised migration:

| Logical record | Recommended PostgreSQL shape |
|---|---|
| Workspace and authority | `brain_workspaces`, `brain_workspace_roles`, `brain_audience_grants` |
| Source and assertions | `brain_sources`, `brain_assertions` |
| Brain items | `brain_items`, `brain_item_versions` |
| Relationships | `brain_relationships`, `brain_relationship_versions` |
| Decisions | retain `decision_cases` behind a tightened adapter, then migrate deliberately |
| Learning | `brain_learning_proposals`, `brain_learning_actions` |
| Repair | `brain_dependency_uses`, `brain_corrections`, `brain_repair_receipts` |
| Projections | replaceable versioned read models or views, never the truth store |
| Releases | `brain_releases`, `brain_release_entries`, destination receipts |

Row-level security begins from workspace membership and audience grants. Field encryption and object storage remain necessary for sensitive source content. The model provider never receives unrestricted source access merely because the application can retrieve it.

## Legacy capability boundary

The existing application remains useful as an adapter source, not the target ontology.

| Existing capability | Call | G13 boundary |
|---|---|---|
| `user_memory` | retain behind adapter | legacy facts become assertions or provisional item versions only when subject, source and authority are unambiguous |
| `memory_edges` | characterise and replace | user-affirmed edges may seed relationship proposals; inferred edges never become current semantic links without evidence and standing |
| `memory_events` | retain evidence, replace governing model | correction payloads inform migration but destructive value updates cannot represent target version history |
| `memory_links` | retain lineage evidence | polymorphic lineage remains useful but does not replace version-specific semantic relationships and dependency uses |
| decision engine | retain proven organs | decisions remain first-class and connect through the new projection and learning contracts |
| current Brain graph | retain visual signature | hub-centred layout may be reused; fabricated hub semantics, confidence-driven truth cues and category ontology are replaced |
| memory export | retain transport lessons | output must compile from accepted target state with deterministic manifest and round-trip proof |

No bulk migration occurs. A later migration contract must classify each legacy row as accepted, proposed, quarantined or excluded and emit a receipt.

## LLM boundary

Models may extract assertions, propose item versions, nominate relationships, draft correction plans, suggest projection relevance and generate plain-language explanations. Deterministic services own:

- identity and audience enforcement;
- version sequences and current-state uniqueness;
- permission and consequence checks;
- idempotency;
- dependency enumeration;
- repair completeness;
- projection manifests;
- release hashes; and
- rejection of malformed or unsupported output.

The generating model cannot certify its own relationship, learning, repair or release.

## Executable proof result

The G13 validator currently proves nine cases:

1. portrait and map canonical-reference parity;
2. rejection of unsupported semantic relationships;
3. private audience isolation;
4. append-only correction, relationship replacement and four complete repair receipts;
5. exclusion of disputed state from current guidance;
6. exclusion of proposed inferred learning from accepted truth;
7. deterministic semantic zoom across 120 items and 180 relationships under reversed source order; and
8. non-semantic hub tethers.
9. evidence-audience ceilings for semantic relationships.

The proof is intentionally independent of the production schema. It establishes the contract before any migration can bias it toward legacy tables.

## What remains unproven

- Whether the map's exact visual grammar is instantly understood without explanation.
- Whether orientation remains emotionally compelling and cognitively light with real leader data.
- Whether twelve portrait cards and eighteen orientation nodes are the right budgets.
- Whether the physical contract can be implemented efficiently in the current PostgreSQL and React stack without a specialist graph store.
- Whether legacy data can be mapped with sufficient provenance to avoid a mostly provisional first Brain.
- Whether held-out work quality improves because of the Brain rather than because the same model received more text.

## Next gate

Create a sanitized brief for one material My Brain surface, run genuinely divergent interaction concepts against this physical contract, select one through independent judging, render a functional synthesis with representative fixtures, and obtain Krish's cold reaction before any production UI implementation.
