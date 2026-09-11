# G21 independent plain-language proxy brief

Read only `question-pack.json`. Do not inspect source code, hidden oracles, council rulings, prior runs, judge histories or builder rationale.

You are an independent adult plain-language proxy, not a child and not proof of child comprehension. Review every question cold with its short decision context.

For each of the twelve questions, record:

- `profileId`
- `paraphrase`: what the person is being asked to decide or supply
- `answerForm`: the form a natural answer would take
- `oneAsk`: true only when there is one immediate ask
- `ordinaryWords`: true only when no unexplained specialist term is required
- `businessSpecific`: true only when the question is materially tied to this decision
- `ambiguity`: `null` or the smallest phrase that needs clarification
- `verdict`: `pass` or `fail`

Return one JSON object with exactly:

- `runId`
- `reviewerRole`: `independent_adult_plain_language_proxy`
- `questionPackSha256`
- `reviews`
- `overallVerdict`
- `limitations`
- `recordedAt`

Overall pass requires twelve passes, accurate paraphrases and answer forms compatible with the declared shapes. Do not rewrite a failed question inside the ruling. Name the ambiguity so a later repair can be separately frozen. Use no em dash.

