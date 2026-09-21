# G25 consequential-work spine, R142

Status: `candidate_verified_isolated_rehearsal_rolled_back`

R142 supplies the canonical structure that R141 proved was missing. It gives the Brain a bounded, inspectable home for a real high-stakes decision without promoting the legacy person-scoped decision tables or pretending fixture data is authority.

## The spine

| Record | What it preserves |
| --- | --- |
| Subject profile | Who the Brain is for and the aim that frames its help |
| Decision case | The consequential question and its lifecycle |
| Decision version | A time-bounded, source-watermarked analysis snapshot |
| Human prior | What the leader thought before the system steered them |
| Routes | Exactly three explicit alternatives, including the working recommendation |
| Questions and answers | What could change each route, with the leader's answer kept separately |
| Frozen evidence atoms and links | The exact encrypted assertion and source provenance used for evidence, the human prior, answers, the owned call and outcomes |
| Authority and revocation events | Who allowed a consequential transition and whether that authority still stands |
| Owned call and outcome | The leader's decision, its conditions and what later happened |
| Audit events | Append-only receipts for sealing, answering, calling and outcomes |

Versions form one inspectable line rather than a pile of competing answers. A successor may seal only from the exact currently sealed predecessor and the next sequence number. That single transaction supersedes the predecessor, seals the successor and records which version replaced which.

## What the database now refuses

- A pre-sealed insert or an unapproved draft-to-sealed update.
- An analysis with two routes, an unsupported route or a question without evidence.
- An analysis with no identifiable working recommendation, or more than one recommended route.
- Authority whose input digest no longer matches the decision snapshot.
- Authority that claims to approve analysis, prior, route, question or evidence bytes before those inputs existed.
- A supposed human starting view recorded after the analysis was generated.
- Replaying a seal with a different source watermark or idempotency key.
- Blocking a later system transition by reusing its key for a different event type.
- Turning an exact successful seal retry into a failure after a successor legitimately supersedes it.
- Producing a different snapshot or owned-call digest because another database connection uses a different timezone.
- A predecessor copied from another decision.
- A successor of a draft, already superseded or non-adjacent predecessor.
- A successor authority recorded before its predecessor was sealed.
- A successor snapshot that does not bind the predecessor's exact sealed snapshot digest.
- A prior-decision match that cites the current decision, a bare case, a draft or challenged version, or a version accepted only after the current analysis was generated.
- Rewriting or deleting an assertion or source after it has entered decision evidence, the human prior, an answer, an owned call or an outcome.
- Materialising an evidence atom from a source captured or recorded in the future, or from an assertion recorded in the future.
- Materialising two atom identities for the same source/assertion state under concurrency; a stable unique content identity converges concurrent inserts, while exact post-conflict JSON validation refuses even a theoretical digest collision.
- Freezing provenance that changed while materialisation waited for a row lock. The source and assertion raw row versions observed before the wait must still be the locked versions, otherwise the whole attempt rejects and retries from current truth.
- Admitting an answer whose source provenance changed while the answer waited for the sealed decision version. Answer admission captures those row versions before the version wait and materialises only if they remain exact afterward; rejection leaves no answer, atom or receipt.
- Admitting a human prior whose source provenance changed while the prior waited for its draft decision version. Prior admission captures those row versions before the version wait and materialises only if they remain exact afterward; rejection leaves no prior or atom.
- Waiting on busy source provenance or an uncommitted matching atom identity during any materialisation. Every path uses compatible `FOR SHARE NOWAIT` provenance locks and a transaction advisory try-lock for exact content identity, returning one explicit retry signal rather than waiting while it may already hold a governing version or another atom identity. A clean retry reuses the committed atom.
- Backdating an evidence link, human prior, answer, owned call or outcome before the provenance it claims to use; sealing or authorising a call before the latest bound provenance watermark is also refused.
- Sealing without the human prior's immutable source-atom identity and digest, or receipting an answer, call or outcome without its exact frozen source atom.
- Plain text placed in a private ciphertext field.
- An owned call without exact subject authority, or whose authority or recorded time predates the analysis seal.
- A case that claims to open in the future.
- An answer that predates its question or the analysis seal, arrives from the future or targets an analysis that is not the currently sealed version.
- A subject answer attached to a Brain-research, operator-research, proposed or suppressed question.
- An outcome observed before its call, recorded before it was observed, recorded in the future or attributed to anyone other than the subject.
- An authority revocation by an unrelated actor, before the authority existed or from the future; authority consumers ignore any revocation not yet effective.
- A revocation inserted after an analysis seal or owned call but backdated to or before that use.
- Silent mutation of sealed analysis, human prior, owned call, authority or audit history.
- Raw access by the ordinary authenticated role.
- Persisting a case, answer or outcome without its deterministic append-only receipt.
- Committing a route, question, evidence link or human prior after a concurrent seal, or committing an answer after a concurrent successor supersedes its version.
- Producing a contradictory authority history under concurrency: sealing and owned-call admission race revocation on the same locked authority row, so exactly one side can establish the governing fact.
- Waiting while a transaction holds one governing version or authority and requests another. All governing locks are fail-fast; authority uses `FOR NO KEY UPDATE NOWAIT` so PostgreSQL's own foreign-key check can proceed before the application guard returns the stable retry signal.

## Why this is materially different

The old decision machinery could describe activity, but it could not prove workspace, subject, exact evidence bytes, version, human prior and authority as one coherent unit. R142 makes those relationships explicit and proves that a decision can become better without losing its earlier reasoning. Evidence and consequential human records are resolved from the frozen atom the leader authorised, never by joining back to a mutable current assertion. It therefore gives later UI and AI work a trustworthy source instead of asking a model to improvise a persuasive answer from unrelated rows.

The schema remains modular: capture, evidence, synthesis, challenge, authority, call and learning are separate records with narrow responsibilities. Each module can be inspected and improved without turning the Brain into one giant prompt or one giant Markdown file.

## What remains closed

This candidate first ran inside a disposable local PostgreSQL canary, then ran transiently in the isolated Supabase project under the separate R143 concurrency rehearsal and was removed to zero residue. It provides no authenticated customer writer, operator read projection, customer surface, email path, Claude exchange, research enrichment, audio briefing or news curation. Those systems remain later consumers or preserved legacy capabilities, not implied accomplishments of this storage gate.

The next safe gate is fresh blind adjudication of the nineteen-times-repaired candidate and expanded twenty-two-schedule R143 proof. Persistent migration packaging remains closed until that review passes.
