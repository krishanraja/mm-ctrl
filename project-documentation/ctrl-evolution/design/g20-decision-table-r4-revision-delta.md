# G20 Decision Table R4 locked revision delta

**Date:** 9 September 2026
**Baseline:** `public/g20-decision-table-proof-r3.html`
**Baseline SHA-256:** `3372f57efcf35287fc91aae02677d205b9169372b5fa43973ae530394a9b3bd1`
**Candidate:** `public/g20-decision-table-proof-r4.html`
**Candidate SHA-256:** `cca7a99a0cc0548f4d9065eb0b2e2f7d20f046cda4a60dacf28ceaf01aa7fcdc`
**Materiality:** second targeted correction inside the selected Decision Table spine
**Authority:** synthetic rendered proof and non-production preview only; no React, database, production, merge or release

## Design task contract

- State of use: a busy leader reviews a consequential decision on desktop or phone and chooses whether to go deeper.
- User and action: Maya can answer one useful question with a tap, optionally add a note, or ask the Brain to check a fact.
- Governing rule: the Brain carries the analytical complexity. The leader never has to decode internal language.
- Data truth: rich synthetic Maya data, one explicit synthetic prior decision and honest sparse, stale and wrong-customer fallbacks.
- Locked surface: the R3 main Decision Table, routes, test, Claude handoff and returned-work assessment.
- Proof: semantic diff, deterministic browser journeys, wide and narrow pixels, state range and protected-preview verification.

## Allowed delta

| ID | Target | Expected R3 value | R4 value |
|---|---|---|---|
| R4-01 | Deeper-layer title | `What could change the call?` | `One question` |
| R4-02 | Question interaction | abstract prompt followed by a second reveal step | one plain question with immediate tap choices |
| R4-03 | Free text | required for the first leader-answer question | optional note available on every question |
| R4-04 | Brain evidence action | reveal explanatory copy, then add an evidence task | choose the missing fact and ask the Brain to check it |
| R4-05 | Prior-decision action | reveal a record identifier before keeping it | answer a plain prevention question with the synthetic warning stated directly |
| R4-06 | Accessible invitation | `Ask three harder questions about this decision` | `Ask three useful questions about this decision` |
| R4-07 | Mobile fit | deeper question overflows the 320 by 568 viewport | title, choices, meaning and both actions fit without horizontal overflow |
| R4-08 | Fixture and tests | R3 question contract | versioned R4 tap-first contract and rewritten end-to-end proof |

## Locked invariants

- Preserve R3 byte-for-byte as the recoverable baseline.
- Preserve the opening decision, Brain read, recognitions and current view.
- Preserve all three routes, recommendation, counter-case and primary action.
- Preserve the test, complete Claude brief and returned-work assessment.
- Preserve one optional deeper invitation and one question at a time.
- Preserve distinct standing for direct answers, pending evidence and earlier-decision warnings.
- Preserve explicit synthetic provenance and the rule that analogy does not prove the current answer.
- Do not add a dashboard, chat thread, score, decorative image, compulsory questionnaire or repeated privacy prose.

## Pass signals

1. A twelve-year-old can understand what the first question asks without explanation.
2. The leader can answer with one tap and never has to type.
3. Every question offers an optional note.
4. The Brain can be asked to find a fact the leader does not know.
5. A similar decision produces a warning without pretending it proves the current call.
6. The chosen answer and optional note reach the standalone Claude brief with the correct standing.
7. The initial deeper question and actions fit at 1440 by 900, 390 by 844 and 320 by 568.
