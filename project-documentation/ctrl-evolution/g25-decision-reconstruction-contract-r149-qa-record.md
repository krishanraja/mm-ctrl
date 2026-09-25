# G25 decision reconstruction contract R149 QA record

Status: `pass_local`

Date: 25 September 2026

## Acceptance results

| Gate | Result |
| --- | --- |
| Candidate or abstention only | PASS |
| Exact input and output keys | PASS |
| Strict JSON only | PASS |
| Unknown evidence reference | PASS, rejected |
| Duplicate evidence reference | PASS, rejected |
| Supporting evidence | PASS, required |
| Available counterevidence | PASS, required |
| Generic business language | PASS, rejected |
| Decision-specific lexical grounding | PASS, required |
| Question restatement | PASS, rejected |
| Hostile instruction inside evidence | PASS, kept as inert data |
| Honest abstention | PASS, exact gap and one action |
| Plain leader question | PASS, question form required |
| Hidden confidence theatre | PASS, absent from contract |
| Legacy tolerant JSON parser | PASS, excluded |
| Legacy model binding and fallback | PASS, excluded |
| Focused tests | PASS, 7 of 7 |
| Static contract gate | PASS |
| TypeScript regression gate | PASS, 94 baseline errors, zero new |
| Database or deployment change | PASS, none |
| Production contact | PASS, none |

## Command

```text
npm run brain:g25:decision-reconstruction-contract-r149-check
npm run typecheck
```

## Judge reading

- Human agency: PASS. No model output can become an answer or recommendation; uncertainty becomes a useful human action.
- Brain integrity: PASS at the contract boundary. Only exact admitted evidence IDs may appear.
- Trust and privacy: PASS locally. Evidence is treated as untrusted data and no provider or database was contacted.
- Human comprehension: PASS for the data contract. Every abstention must produce one plain next step rather than system jargon.
- Product intelligence: PROVISIONAL. The bar is explicit and testable, but provider performance is not yet measured.
- Commercial value: NOT YET PROVED. The contract blocks horoscope output; a real decision must still show that the resulting belief is valuable.

## Remaining boundary

Build the authenticated reconstruction route next. Freeze provider, prompt version, schema version, input evidence identity, output bytes, validation result, token use and cost into a receipt. Invalid output and abstention must create no candidate.
