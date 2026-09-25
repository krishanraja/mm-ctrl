# G25 decision reconstruction contract, R149

Status: `local_contract_pass`

Date: 25 September 2026

## Product problem

R148 made evidence lineage exact, but an LLM could still return a well-shaped yet generic answer, omit a counterexample or disguise uncertainty as polish. Provider JSON mode alone cannot decide whether an output deserves to enter the Brain.

## Implemented boundary

R149 defines the model-independent gate before any reconstruction provider is selected.

The reconstruction has only two legal outcomes:

1. `candidate`: one decision-specific provisional belief with exact evidence references, a decision consequence, a countercase and a plain uncertainty statement.
2. `abstain`: one named evidence gap and one useful next action, with any relevant evidence references preserved.

A candidate is rejected when it:

- uses generic business language;
- does not overlap meaningfully with the exact decision and evidence packet;
- references an unknown or repeated evidence atom;
- omits supporting evidence;
- omits counterevidence when the packet contains it;
- merely restates the question;
- arrives as prose-wrapped or malformed JSON.

An abstention is not failure. It converts insufficient intelligence into a precise leader question, research task, document request or live-session agenda.

## Prompt boundary

The prompt builder:

- labels all evidence as untrusted data rather than instructions;
- wraps one canonical JSON packet in a named boundary;
- forbids confidence scores, generic advice and prose outside the structured result;
- tells the model that a candidate is a provisional belief, not advice, recommendation or accepted truth;
- makes abstention preferable to weak completion.

The output schema is exported separately from the runtime parser. A future provider must use native strict structured output where supported, but the local parser remains the final authority. The contract deliberately does not inherit the legacy decision engine's tolerant JSON extractor, obsolete model names or silent provider fallback.

## Files

- `supabase/functions/_shared/decision-reconstruction-core.ts`
- `supabase/functions/_shared/decision-reconstruction-core.test.ts`
- `scripts/check-ctrl-g25-decision-reconstruction-contract-r149.mjs`
- `project-documentation/ctrl-evolution/g25-decision-reconstruction-contract-r149-qa-record.md`

## Theory used

- Current OpenAI guidance favours strict JSON Schema structured output over older JSON object mode for models that support it.
- Current Anthropic guidance favours explicit structured state and clear document boundaries for multi-document context.
- Both provider mechanisms remain subordinate to application-side semantic validation and evals.

## Honest boundary

This is a pure contract. It makes weak output inadmissible, but does not yet prove that any provider can regularly produce excellent candidates. No function was deployed, no model was called, no database changed and production was not contacted. The next gate is an authenticated reconstruction route with a pinned provider, a frozen evaluation range and zero direct write on abstention or invalid output.
