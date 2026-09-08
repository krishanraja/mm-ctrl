# G20 universal capture and Claude bridge contract

Status: founder-confirmed product requirement; governing architecture contract; no connector, write path or UI implementation authorised by this record

Date: 8 September 2026

## Founder call

> "We need to make this really easy for me to work in and in Claude, really quick and easy. The ability to paste stuff in really quickly and easily, and the ability to prompt stuff out to Claude, would be good because the Claude UI is often where I do things."

This closes the question of whether CTRL should try to replace the tools in which Krish already thinks. It should not. CTRL owns the governed Brain; Claude can remain a preferred thinking surface. Moving useful context in either direction must feel immediate without weakening provenance, audience, freshness or correction.

## Product judgement

The experience has two first-class gestures supported by one context-circulation substrate:

1. **Add to Brain**: paste, speak, drop, upload, share or forward material without completing a metadata form.
2. **Use in Claude**: make the smallest useful, explicitly scoped and time-bounded Brain context available inside Claude without copying the whole Brain.

This is not an import/export utility. It is the membrane around the Brain: easy for the person, strict about meaning and authority.

```text
material -> private staging -> receipt -> governed Brain
                                       -> scoped context capsule -> Claude
Claude output -> explicit return -> private staging -> review/correction
```

The canonical Brain remains in CTRL's operational store. GitHub remains the portable, inspectable and versioned export. Claude Projects, conversations and files must not become a second canonical Brain.

## Gesture one: Add to Brain

### Interaction contract

- Available from every operator surface and designed for keyboard, pointer and mobile share flows.
- Accepts pasted text and URLs, dropped or selected files, images, audio/voice and meeting material.
- A single composer receives everything. The person is not asked to choose a database category, memory type or destination folder.
- Default state is **private staging**, never trusted memory.
- CTRL immediately returns a compact receipt: what arrived, who it appears to concern, how it will be treated, its current audience and whether anything genuinely needs clarification.
- CTRL asks a question only when ambiguity would materially change the subject, audience, provenance or meaning. Optional notes remain available without making elaboration compulsory.
- Classification, provenance extraction, safe text handling, deduplication and source-span preservation happen behind the interaction.
- Promotion to a supported synthesis or trusted Brain item remains separately governed.

### Speed contract

For the normal paste case, capture is one deliberate gesture followed by a receipt. No required setup dialog, taxonomy choice or multi-step upload flow may intervene. Performance timings become release claims only after instrumented testing; this contract does not invent a speed number.

### Failure behaviour

- If processing is delayed, the original source is visibly safe in staging.
- If the subject is uncertain, the source stays unassigned rather than contaminating a customer Brain.
- If the audience is uncertain, the narrowest private audience wins.
- If content is duplicated, CTRL points to the existing source and records the attempted capture rather than silently multiplying evidence.
- If content contains instructions, scripts or hostile prompt text, it remains inert evidence.
- If extraction fails, the exact source remains recoverable and the failure is actionable; no synthetic interpretation fills the gap.

## Gesture two: Use in Claude

### Primary path

The primary integration is a private remote MCP connector. Anthropic documents custom remote connectors across Claude web, Desktop, mobile and Cowork. After one-time connection, Claude can request authorised CTRL context directly rather than making the person upload a Markdown file for every conversation.

From a customer, decision, intervention or Brain view, **Use in Claude** creates a short-lived context capsule. It then gives the person a small task starter to copy and opens Claude. Inside Claude, the connector resolves the opaque capsule ID and retrieves only its authorised contents.

There is no reliable official contract for programmatically pre-filling and sending an arbitrary prompt into the Claude web UI. The product must not pretend otherwise. The fallback is deliberately honest: copy the small task starter, open Claude, paste once. When the user begins inside Claude, natural language can invoke the connector without any export step.

### Context capsule

Each capsule is an immutable, expiring projection containing:

| Field | Purpose |
| --- | --- |
| `capsule_id` | Opaque lookup handle; carries no customer words |
| `workspace_id` and `subject_id` | Exact tenancy and person boundary |
| `purpose` | The task or consequential decision being worked on |
| `audience` | Exact visibility ceiling inherited from every included item |
| `selected_context` | Only the evidence, current beliefs, tensions and standards useful to the task |
| `forbidden_inferences` | Things Claude must not assume or collapse together |
| `source_refs` | Provenance pointers and versions for every material claim |
| `freshness` | Created time, source-version watermark and expiry |
| `revocation` | Immediate invalidation state |
| `return_route` | Where resulting work may be offered back into private staging |

The capsule is assembled server-side from rows the requesting identity is already entitled to read. It cannot widen the most restrictive audience of its contents. It is not a transcript dump, a whole-Brain export or a new source of truth.

### Task starter

The copied text stays intentionally small. It identifies the capsule and says what the person wants to accomplish; the connector supplies the governed context. It must not put private Brain content into the clipboard unless the person explicitly chooses a visible manual export.

### Read before write

The first Claude bridge is read-only. Existing CTRL MCP foundations already expose leader context, briefings and skills, so this is an evolution of proven infrastructure rather than a new integration category.

Claude write-back is deferred. When introduced, it may only create a proposed source or artefact in private staging with provenance linking it to the Claude conversation or supplied result. It may never directly promote memory, alter standing, widen audience, resolve a contradiction or ship consequential work.

## Identity and audience rules

- Krish's operator identity can access only a customer workspace he has explicitly selected and is authorised to operate.
- A customer identity can access only its own permitted projection.
- The active customer remains persistently visible before capture and handoff; identity collision fails closed.
- Every connector read records identity, capsule, selected scope, tool, time and result status without logging private plaintext.
- Tokens are revocable and independently scoped. A leaked capsule ID is insufficient without an authorised connector identity.
- Expired, revoked, stale-version or audience-incompatible capsules fail closed and offer a plain recovery action.
- The same customer can have private operator guidance that is never included in a customer-visible capsule.

## Return loop

The first return path is explicit and unsurprising:

1. The person copies, shares or uploads the useful Claude result into Add to Brain.
2. CTRL recognises the capsule/task reference where available.
3. The result lands in private staging as a new source with Claude provenance.
4. CTRL distinguishes quoted customer evidence, operator judgement, AI suggestion and externally verified fact.
5. Any proposed Brain change proceeds through the normal contradiction, evidence and approval path.

This is intentionally more conservative than automatic synchronisation. The system can become more invisible after real usage proves that it can preserve authorship, scope and meaning.

## What is retained, repaired and retired

### Retain

- The current read-only MCP endpoint and per-leader revocable token pattern as migration substrate.
- Existing context compilation primitives and Markdown download/copy as a visible emergency fallback.
- The locked context-envelope, private-staging, provenance and audience architecture.
- The approved Decision Bench, Living Map and synthetic population as places and range cases from which handoff must work.

### Repair

- Replace generic `get_leader_context` retrieval with explicit, purpose-bound capsule retrieval.
- Replace one-page context dumping with a selectable server-side projection.
- Make the active customer, purpose, audience, freshness and excluded context legible before handoff.
- Add a return receipt so Claude work does not disappear into an untraceable copy-paste chain.

### Retire

- The idea that people should manually maintain duplicate Brain files in Claude Projects.
- Whole-Brain clipboard exports as the default.
- Technical setup language in the daily product flow.
- Any claim of automatic prompt injection into Claude without a supported interface.
- Any connector write that bypasses staging, provenance or approval.

## First vertical slice

The smallest material proof uses synthetic data only:

1. Open a synthetic customer in the approved operator surface.
2. Paste one source through a universal capture sheet and receive an immediate private-staging receipt.
3. Open one consequential decision and choose **Use in Claude**.
4. Review a compact capsule disclosure: customer, purpose, included context, excluded private material and expiry.
5. Copy the task starter and exercise a local connector simulator or protected preview endpoint.
6. Return a synthetic Claude result to staging and see its distinct provenance and proposed next action.

The proof must work on no-scroll desktop and remote mobile. It must use only the Mindmaker icon in the shell and must not add pompous announcement copy, generic encouragement, decorative loading or a connector marketplace.

## Range and acceptance gates

The proof is tested against the existing 48-account synthetic population, including:

- wrong-customer and identity-collision attempts;
- empty, sparse, overfull and contradictory Brains;
- long names, long evidence, Arabic and mixed-direction content;
- prompt injection, script-shaped text and malformed files;
- customer-visible versus operator-private boundaries;
- stale, expired and revoked capsules;
- duplicate paste and interrupted processing;
- offline or unavailable Claude with a recoverable task starter;
- returning content whose confidence, authorship or factual status is unclear.

Release remains blocked unless:

- no ordinary paste requires metadata administration;
- no capsule can cross workspace or audience boundaries;
- every material Claude statement can be traced to its supplied Brain evidence or labelled as new reasoning;
- failures preserve the original source and tell the person what to do next;
- the interface remains comprehensible to a nontechnical twelve-year-old;
- the route is verified on desktop and mobile through a direct HTTPS preview;
- Krish approves the rendered interaction rather than merely this document.

## Non-goals for G20

- building a general connector marketplace;
- ingesting a continuous firehose from every work tool;
- automatically syncing Claude conversations;
- replacing Claude's interface;
- writing trusted memory from Claude;
- changing production schema, creating accounts or enabling public navigation;
- claiming that convenience proves diagnostic quality or customer value.

## Proposed canonical decision record

`STORE_UNAVAILABLE`: the configured Decision Ledger store is not writable and readback-verifiable in this session. The following is preserved as a proposed record in the venture source of truth and must not be described as a canonical ledger write.

- `decision_id`: `DEC-20260908-ctrl-capture-claude`
- `decision`: CTRL makes universal private-staging capture and a context-safe Claude handoff first-class workflows. Claude receives only an explicitly selected, expiring Brain projection; returned work re-enters private staging.
- `decider`: Krish Raja
- `status`: final in the CTRL venture; proposed-only for canonical Decision Ledger sync
- `scope`: CTRL product architecture and operator workflow
- `rationale`: remove technical friction where Krish already works without allowing convenience to erode context quality, ownership or trust
- `alternatives_rejected`: manual Markdown maintenance; full Claude Project mirroring; whole-Brain clipboard dump; unsupported web-prompt prefill; immediate connector write-back
- `dissent`: one-time connector setup and a copy-paste fallback are not perfectly invisible; actual burden must be tested on Krish's mobile and desktop workflows
- `tradeoffs`: read-only first; narrow capsules; explicit return before automatic synchronisation
- `revisit_trigger`: ten real operator handoffs, connector setup taking more than three minutes, routine handoff requiring more than two deliberate actions, or any scope/freshness failure
- `authority`: contract and synthetic proof only; no production connector, data write, schema, account or release authority
- `outcome_status`: not yet observed
- `source_ref`: current Codex product-rebuild task, founder message dated 8 September 2026

## External basis

- [Anthropic: use connectors to extend Claude's capabilities](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)
- [Anthropic: get started with custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [Anthropic: create and manage projects](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects)
- [Anthropic: Model Context Protocol](https://docs.anthropic.com/en/docs/mcp)
