# G25 critique authority R112

R112 makes the independent review panel trustworthy on the isolated Legibility project. It does not claim that every model judgement is correct. It proves who can start a review, what exact Brain state the panel saw, how every paid pass is receipted, what survives enforcement and whether the final result can be published after its source changes.

## What stays

The useful review machinery was retained. Mechanical checks run first. A leader's current compiled criteria form one lens. Evidence and signature form two declared house lenses. The lenses cannot see each other's answers. A meta-judge runs only when at least two lenses answer. Every verdict must quote the submitted work. A bounded repair pass cannot bypass mechanical or provenance checks. Held-out work and repeat probes remain excluded from exemplars.

This matters because a strong architecture is not a single giant prompt. It is a conveyor belt of specialists with different authority and failure modes. The standard lens asks whether work matches this person's demonstrated judgement. The evidence lens asks whether its claims point anywhere. The signature lens asks whether the result has become interchangeable. Arbitration happens only after those independent reads have been enforced.

## What changed

The old route held thoughtful review logic behind unsafe plumbing. It used a service-role client, a soft cap that never blocked, best-effort usage logging and mutable source reads. A review could therefore finish against a Brain that was not the one it started with, and model spend could occur without a durable receipt.

R112 replaces that path with:

- the caller's JWT and owner RLS for all reads;
- a private Edge-to-database capability for consequential run transitions;
- exact project binding to the isolated target;
- strict method, JSON, byte and field boundaries;
- one request identity with deterministic replay and conflict refusal;
- hard daily run and recorded-spend admission;
- one mandatory receipt per model purpose;
- a pinned snapshot of criteria, evidence, graded exemplars and any reviewed artifact;
- refusal when that source changes before finalization; and
- one atomic terminal result write.

## What the hosted proof showed

A real multi-model run completed with the evidence and signature lenses and a meta-judge. The standard lens was asked for but correctly did not run because the transient account had no compiled criteria. That is the honest edge case: absence is disclosed, not silently replaced by generic business advice.

The same hosted proof established:

- anonymous, wrong-method, wrong-media, oversized, extra-field and missing-request refusal;
- direct RPC refusal without the private capability;
- one run and three purpose-specific usage receipts for the completed review;
- exact retry returning the same run;
- changed payload under the same request ID returning conflict;
- zero visibility from a second account;
- hard run and spend ceilings;
- a Brain change during deliberation ending in `source_changed_retry` with no result; and
- a forced final write failure ending in `failed` with no partial result.

All transient users, runs, evidence and usage rows were removed after the proof.

## Boundary

This closes the independent critique authority path only. It does not prove universal judgement quality, a customer-facing review experience or the held-out measurement that can earn a Verified release label. Production remains untouched. No merge, cutover or legacy retirement is authorized.

The next step is the held-out measurement consumer. It must score unfamiliar work without leaking answer keys into the panel, preserve false positives rather than average them away and change a release label only through owner-bound, inspectable evidence.
