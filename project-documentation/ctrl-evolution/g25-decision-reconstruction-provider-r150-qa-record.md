# G25 decision reconstruction provider R150 QA record

Status: `pass_local`

Date: 25 September 2026

## Acceptance results

| Gate | Result |
| --- | --- |
| Current complex-reasoning model route | PASS, `gpt-5.6-sol` |
| Responses API | PASS |
| Provider storage | PASS, disabled |
| Reasoning effort | PASS, high |
| Output verbosity | PASS, low |
| Strict JSON Schema | PASS |
| Local semantic validation after schema | PASS |
| Candidate branch leakage | PASS, rejected |
| Abstention branch leakage | PASS, rejected |
| Provider refusal | PASS, rejected |
| Incomplete generation | PASS, rejected |
| Generic schema-valid claim | PASS, rejected |
| HTTP failure | PASS, no retry or fallback |
| Missing credential | PASS, no provider call |
| Provider receipt | PASS, exact model, response, token and price versions |
| Focused tests | PASS, 13 of 13 across core and adapter |
| Static adapter gate | PASS |
| Database or deployment change | PASS, none |
| Production contact | PASS, none |

## Command

```text
npm run brain:g25:decision-reconstruction-provider-r150-check
```

## Judge reading

- Human agency: PASS. The provider can propose or abstain only; it cannot confirm, recommend or write leader truth.
- Brain integrity: PASS locally. Provider structure does not bypass the exact R149 evidence gate.
- Trust and privacy: PASS at adapter design. Provider storage is disabled and no provider call occurred in QA.
- Reliability: PASS locally. Failures stop rather than silently changing model behaviour.
- Cost control: PASS locally. Every successful response produces versioned token and estimated cost metadata.
- Product intelligence: UNPROVED. A frozen live evaluation range is still required.

## Remaining boundary

Do not deploy this adapter as an open text endpoint. The function must construct its packet from the authorised canonical decision records, not trust a browser-supplied evidence body. It must record attempts and must stage candidates only through R148.
