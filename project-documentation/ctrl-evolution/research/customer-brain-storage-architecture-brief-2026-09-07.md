# Customer Brain storage architecture: research brief

**Status:** Active research brief. Recommendation evidence, not an approved architecture decision.

**Retrieved:** 2026-09-07 (Europe/London)

## RESEARCH BRIEF

**DECISION:** Should each customer's CTRL Brain live primarily in a private GitHub repository, or should GitHub be a portable projection of a different canonical runtime store?

**CHANGE CONDITIONS:** Prefer GitHub as the canonical runtime only if current evidence shows it can provide the required low-latency structured querying, concurrent updates, tenant isolation, correction and deletion semantics, provenance, and non-technical customer experience without a second authoritative store. Prefer no per-customer repository if the portability and inspectability benefit can be delivered equally well through a standard export without meaningful customer pull.

**BOUNDARIES:** Early Mindmake-assisted customer Brain building and later basic customer self-service; sensitive business and personal context; multi-tenant web product; customer-owned handoff; GitHub, PostgreSQL/Supabase and object storage as candidate roles. Excludes final vendor procurement, production schema changes, repository creation, and visual design.

**FRESHNESS:** Current official provider documentation retrieved on 2026-09-07; repository and production evidence already verified in the CTRL transition architecture at commit `3782dbbd2c5bf5fe619090b7930c00dc2da4747a`.

**QUALITY FLOOR:** Current first-party GitHub, Git and Supabase/PostgreSQL documentation for provider capabilities and limitations; inference labelled explicitly; no vendor marketing claim treated as proof of product fit.

**TIME/COST CAP:** One bounded architecture pass sufficient to choose the role of each store and define a falsifiable first-slice test; no paid research or external mutation.

**STOP RULE:** Stop when the evidence distinguishes canonical runtime, raw-source, derived-index and portable-export responsibilities and exposes any founder-owned trade-off that cannot be resolved technically.

## Recommendation

**Do not make a private GitHub repository the sole or primary runtime store. Make it the customer's first-class, human-readable, versioned Brain package.**

The canonical live Brain should be a tenant-isolated, versioned domain store in PostgreSQL/Supabase. Raw source files and large transcripts belong in encrypted object storage. Search indexes and embeddings are disposable derived projections. A compiler should turn accepted Brain state into a deterministic, allowlisted package that can be downloaded or synchronised to a private GitHub repository owned by the customer.

The important distinction is:

> The Brain lives in an open, portable domain model. CTRL operates the live version; GitHub can hold a customer-owned projection of every accepted release.

This preserves the best part of the GitHub instinct: ownership, inspectability, iteration, version history and handoff, without forcing a source-code collaboration system to become a transactional, privacy-sensitive application database.

## The four-layer architecture

| Layer | Canonical role | Contains | Must not contain |
|---|---|---|---|
| Live Brain store | PostgreSQL/Supabase | accepted and proposed Brain items; versions; provenance; audience; authority; corrections; decisions; criteria; exceptions; outcomes; consent and export state | opaque model summaries treated as truth; raw files duplicated without need |
| Source vault | encrypted object storage | meeting transcripts, documents, audio and other evidence objects, each referenced by stable source identity and retention policy | derived Brain claims without provenance; public links by default |
| Retrieval projections | database indexes, full-text and vector indexes | reconstructable embeddings, chunks, search features and caches | canonical truth or user authority |
| Portable Brain package | deterministic files, optionally synced to a customer-owned private GitHub repo | curated Markdown; structured JSON/YAML; provenance manifest; decisions; standards; examples and anti-examples; tests; version and changelog | raw transcripts by default; embeddings; secrets; hidden prompts; ephemeral traces; anything excluded by audience or export policy |

### Why the runtime belongs in PostgreSQL

- Brain updates need transactions across a proposal, evidence links, authority, correction lineage and current projection.
- A customer, their adviser and later authorised colleagues need item- and audience-level permissions, not merely repository-level read or write.
- The product needs fast structured queries, event readback, retries, background jobs and selective deletion or restriction.
- Supabase's current documentation describes Postgres as its core database, supports granular Row Level Security and provides managed backups; semantic and keyword retrieval can be built as projections around the data rather than replacing it.

### Why GitHub remains strategically important

- A repository is inspectable without CTRL and naturally preserves meaningful releases.
- Markdown and structured files can be used by human operators, Codex, Claude, other agents and a customer's own developers.
- A customer can own the repository and grant CTRL narrowly scoped access through a GitHub App.
- Repository transfer provides a real handoff path when CTRL initially provisions the repo, although customer ownership from the start is cleaner.
- The package itself becomes a product proof: if it cannot be understood, tested, exported, re-imported and used elsewhere, “portable Brain” is not yet true.

## Why GitHub should not be the only database

GitHub's current constraints align poorly with a living Brain's hot path:

1. GitHub explicitly advises storing programmatically generated files outside Git, such as in object storage, and documents performance degradation from high file counts, large history and frequent operations.
2. The Contents API requires the current blob SHA to update a file, documents conflict responses and requires some mutations to be serialised. GitHub also applies primary and secondary API limits and recommends a modest repository push rate.
3. Access is repository-oriented. Organisation repositories have useful roles, but a repository is still the wrong boundary for “personal but adviser-visible,” “company-owned,” “shareable with this team,” and “off-record” items coexisting in one live experience.
4. Git history is intentionally durable. GitHub warns that removing sensitive data requires history rewriting, collaborator coordination and cleanup of clones and forks; it cannot remove data from other people's local clones.
5. Raw transcripts, audio, generated traces and embeddings would create unnecessary size, privacy and cloning burdens. They are inputs and projections, not the portable essence of a Brain.

These are not arguments against GitHub. They define the job GitHub is excellent at: the **release and ownership layer**, rather than the conversational event stream.

## The ownership boundary is “per Brain,” not “per customer”

One repository per CRM customer is too blunt. A paying company may contain:

- a leader's private Brain;
- a company-owned shared Brain;
- adviser-only working hypotheses;
- engagement deliverables;
- eventually several leaders with different permissions.

The export boundary should therefore follow one explicit **Brain + audience contract**, not the customer account. A leader's personal package and the company's shared package may be separate repositories or exports even when CTRL presents them through one seamless workspace.

Default ownership rule:

- The subject owns personal Brain items.
- The company owns explicitly company-scoped items and shared assets.
- Mindmake receives time-bounded collaborator authority for the engagement.
- Off-record material is neither compiled nor exported.
- Derived assertions do not inherit export permission merely because their source was exportable.

## Sync contract

The first implementation should be deliberately asymmetric:

1. CTRL writes the canonical live state.
2. An export compiler selects only accepted, in-scope records and builds a deterministic Brain release.
3. CTRL shows a plain-language receipt: what changed, why, what was omitted and which Brain version was produced.
4. The user can download the release or enable a private GitHub sync.
5. Manual repository edits return as **proposed changes**, never as silent canonical overwrites. CTRL reconciles them with the live version and asks only where meaning or authority conflicts.

Do not begin with automatic bidirectional sync. Two masters would recreate the exact source-of-truth ambiguity that the rebuild is intended to eliminate.

## The non-technical experience

GitHub should be invisible until ownership or handoff becomes valuable. The user sees:

- “Your Brain is safe and up to date,” not commits and branches;
- “Keep your own copy” or “Connect your repository,” not a mandatory developer setup step;
- “I learned this from today's decision. Keep, change or leave it out?” not a schema form;
- “Version 7 is ready; three things changed” not a file diff unless they ask for it;
- one tap or voice correction, followed by a visible repair receipt.

For Krish's adviser workflow, the companion should open into the selected customer and surface one useful next move: continue a live decision, review one proposed learning, prepare for the next meeting, or capture an important change. Customer self-service can later expose the same safe primitives with fewer adviser-only controls. The architecture should support both roles; the interface should never reveal the machinery.

## Brain package shape

The package should be designed as an interoperable product artifact, not a database dump:

```text
README.md                         # what this Brain is and how to use it
brain.manifest.json               # identity, schema, version, audience, hashes
profile/current.md                # concise, scoped current context
decisions/                        # accepted calls, rationale, triggers, outcomes
standards/                        # criteria, examples, anti-examples, exceptions
operating-model/                  # roles, workflows, constraints and transition maps
evidence/manifest.jsonl           # provenance references, not necessarily raw sources
evals/                            # frozen cases, rubrics and expected behaviours
skills/                           # compiled agent-specific packages
CHANGELOG.md                      # human-readable semantic changes
```

Each file should declare its scope and version. The manifest should link every exported statement to canonical record IDs and content hashes so re-import can detect drift without making GitHub canonical.

## Ranked alternatives

Scores are directional architectural judgments from the requirements and cited provider constraints, not measured product results. Five is strongest.

| Rank | Architecture | Magical UX | Runtime correctness | Privacy / correction | Portability | Build economy | Credibility risk |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | Postgres canonical + object vault + derived retrieval + Git/ZIP Brain package | 5 | 5 | 5 | 5 | 4 | Low-additive |
| 2 | Postgres canonical + download-only package | 5 | 5 | 5 | 4 | 5 | Medium: ownership promise may feel weaker |
| 3 | Git canonical + local/runtime cache | 3 | 2 | 2 | 5 | 2 | High: dual-master and deletion risk |
| 4 | One private GitHub repo as the whole Brain | 2 | 1 | 1 | 5 | 3 initially | Blocking for a humane live product |

## Claim–evidence matrix

| Claim | Type | Evidence | Contrary evidence / limitation | Confidence | Decision effect |
|---|---|---|---|---|---|
| GitHub is suitable for a portable, versioned customer artifact | factual + inference | Private repositories, granular organisation roles, repository transfer and narrowly scoped GitHub App installation are supported | GitHub does not claim to be a personal-memory database; product fit is inferred | High | Keep GitHub as an optional first-class export destination |
| GitHub is a poor hot-path store for frequent generated updates | factual + inference | GitHub repository guidance recommends object storage for generated files; documents operation, size and API limits; Contents API documents conflicts and SHA-based replacement | A low-volume Brain could remain within the limits | High | Do not make Git the sole canonical runtime |
| Git history conflicts with simple selective erasure | factual | GitHub documents the coordination, history rewrite, clone/fork and cached-reference problems of sensitive-data removal | Careful allowlisting can prevent most sensitive exports | High | Export curated releases only; keep raw sources out |
| PostgreSQL can enforce finer tenant and item access | factual + design inference | Supabase documents query-time RLS policies, grants and testable ownership predicates | Correctness still depends on careful schema, policies and negative tests | High | Use a versioned Postgres domain store as canonical runtime |
| A Git-backed package increases customer trust and handoff value | product hypothesis | Portability and inspectability mechanisms are concrete; existing CTRL positioning requires real export and exit | No target-user evidence yet proves users value a repository or that non-technical customers will activate it | Medium | Offer after value is earned; test uptake and successful external use |

## Falsification and rollout

The hybrid call should be changed if a prototype proves that a Git-first runtime can meet all of these simultaneously without a second authoritative store:

- the five-minute decision loop remains fast and recoverable;
- concurrent capture and correction do not create conflicts or lost updates;
- personal, company, adviser and off-record boundaries are independently enforceable;
- one correction selectively repairs derived state and exports without unsafe history retention;
- a non-technical customer never has to understand Git;
- live retrieval, recall and analytics remain dependable;
- the complete Brain can be handed off and used outside CTRL.

The first proof should compile one synthetic or designated test Brain version from the new vertical slice into a deterministic local package. Then test download, re-import and use by two materially different agent environments. Private GitHub creation and sync should follow only after the package contract passes; no customer repository should be created from this recommendation alone.

## Sources

- GitHub, [Repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits), retrieved 2026-09-07.
- GitHub, [REST API endpoints for repository contents](https://docs.github.com/en/rest/repos/contents), retrieved 2026-09-07.
- GitHub, [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), retrieved 2026-09-07.
- GitHub, [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository), retrieved 2026-09-07.
- GitHub, [Repository roles for an organization](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization), retrieved 2026-09-07.
- GitHub, [Installing a GitHub App from a third party](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party), retrieved 2026-09-07.
- GitHub, [Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository), retrieved 2026-09-07.
- Supabase, [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), retrieved 2026-09-07.
- Supabase, [Database overview](https://supabase.com/docs/guides/database/overview), retrieved 2026-09-07.
- Supabase, [Database backups](https://supabase.com/docs/guides/platform/backups), retrieved 2026-09-07.
- Supabase, [AI & Vectors](https://supabase.com/docs/guides/ai), retrieved 2026-09-07.

## Decision boundary

**KRISH-OWNED CHOICE:** Whether to lock GitHub as an optional customer-owned projection of the canonical Brain, with the live Brain remaining in a versioned PostgreSQL domain store. Nothing in this research authorises production schema work, GitHub App creation, customer repository creation, data migration or public ownership claims.
