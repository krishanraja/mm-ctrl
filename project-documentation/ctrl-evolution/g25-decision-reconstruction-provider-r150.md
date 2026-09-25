# G25 decision reconstruction provider, R150

Status: `local_adapter_pass`

Date: 25 September 2026

## Product problem

R149 defined what an admissible reconstruction looks like. The next risk was quietly attaching it to legacy model code that uses obsolete models, tolerant JSON extraction or fallback providers whose different behaviour is neither evaluated nor visible.

## Implemented boundary

R150 adds one provider adapter with one fixed route:

- OpenAI Responses API;
- model `gpt-5.6-sol`;
- high reasoning effort;
- low output verbosity;
- strict JSON Schema output;
- provider storage disabled;
- no tools, browsing, retrieval or provider fallback;
- local R149 semantic validation after provider schema validation.

The strict provider schema uses one root object and nullable branch fields for compatibility with the provider's structured-output subset. The adapter then requires exact branch separation and compacts the envelope into the R149 candidate-or-abstention contract. Schema-valid generic output still fails.

## Receipt

Every successful call returns an application receipt containing:

- requested and returned model identity;
- provider response ID;
- prompt, schema and pricing versions;
- input and output token counts;
- a versioned estimated cost in micro-USD.

The estimate uses the public 25 September 2026 price snapshot for this model. It is an audit estimate, not a billing source of truth.

## Failure policy

Credential failure, provider HTTP failure, refusal, incomplete generation, malformed receipt, branch leakage, invalid JSON and semantic failure all stop. None invokes another model and none creates a candidate.

## Files

- `supabase/functions/_shared/decision-reconstruction-openai.ts`
- `supabase/functions/_shared/decision-reconstruction-openai.test.ts`
- `scripts/check-ctrl-g25-decision-reconstruction-provider-r150.mjs`
- `project-documentation/ctrl-evolution/g25-decision-reconstruction-provider-r150-qa-record.md`

## Honest boundary

This is a mocked adapter test, not evidence of provider quality. No live model was called, no Edge Function was deployed, no database changed and production was not contacted. The next gate binds one authenticated question to its encrypted canonical decision packet, records every attempt and allows only a validated grounded candidate to reach R148.
