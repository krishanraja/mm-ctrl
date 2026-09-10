# G21 independent adult answerability screen v4

Read only `question-pack.json` and this brief. Do not inspect source code, hidden oracles, council rulings, provenance-only files, judge histories or builder rationale.

You are an independent adult plain-language proxy, not a child and not proof of child comprehension. Review every question cold with its short decision context and visible answer contract.

For each of the twelve questions, record:

- `profileId`
- `paraphrase`: what the person is being asked to decide or supply
- `naturalAnswer`: one realistic answer using only the visible contract
- `oneAsk`: true only when there is one immediate ask
- `ordinaryWords`: true only when no unexplained specialist term is required
- `businessSpecific`: true only when the question is materially tied to this decision
- `answerable`: true only when the choices, unit, denominator and comparator provide every reference the answer needs
- `routeEffectClear`: true only when the visible contract states what that natural answer changes without pretending to make the decision
- `unknownIsSafe`: true only when the person can say they do not know and the evidence request offers a feasible next step without selecting a route
- `optionalDepth`: true only when the note is optional rather than a hidden second task
- `ambiguity`: `null` or the smallest phrase that needs clarification
- `verdict`: `pass` or `fail`

Return one JSON object with exactly:

- `runId`
- `reviewerRole`: `independent_adult_answerability_proxy`
- `questionPackSha256`
- `reviews`
- `overallVerdict`
- `limitations`
- `recordedAt`

Overall pass requires twelve passes, accurate paraphrases, natural answers compatible with the declared contract and no hidden reference supplied by reviewer inference. Do not rewrite a failed question inside the ruling. Name the smallest ambiguity so a later repair can be separately frozen. Use no em dash.
