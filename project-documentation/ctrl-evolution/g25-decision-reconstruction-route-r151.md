# G25 authenticated decision reconstruction route, R151

Status: `pass_isolated_live`

Date: 25 September 2026

## Product problem

R149 and R150 defined an admissible reconstruction and one explicit provider, but neither proved that a real signed-in request could safely turn canonical Brain evidence into a provisional candidate. An open text endpoint, a browser-supplied evidence packet or a directly callable commit primitive would let fluent output bypass Brain lineage.

## Implemented boundary

The browser submits exactly two values:

- the canonical question ID;
- an idempotency key for that attempt.

The JWT-protected Edge route resolves the verified actor, asks service-only database functions to construct the canonical packet and decrypts only the selected title, stakes, human prior, question and evidence atoms. The client cannot supply evidence, model, prompt, candidate text or provenance.

Every provider attempt creates a durable run receipt before the model call. A successful candidate is committed atomically with:

- its encrypted claim;
- a separate inferred assertion and source receipt;
- exact existing supporting and refuting evidence atoms;
- model, response, prompt, schema and pricing versions;
- token use and estimated cost;
- the encrypted complete output and its integrity digest.

An abstention completes the run without creating a candidate. Invalid or provider-failed output records a failed run and cannot fall through to another model.

## Authority boundary

The original begin, commit and finish database primitives are not executable by anonymous or signed-in roles. The Edge route uses three service-only wrappers and passes the identity already verified by `@supabase/server`; the database then re-applies the same subject, operator and audience checks as the earlier ingress contract. A signed-in client calling the primitive directly is denied.

The model still cannot answer the question. It can create only an inferred, proposed candidate. Confirmation, correction and rejection remain separate leader actions and create fresh `user_stated` provenance where applicable.

## Live evidence

The isolated hosted proof used one consequential marketing-division fixture with both supportive and contrary evidence. It proved:

- one real `gpt-5.6-sol` call created a decision-specific candidate;
- two exact evidence atoms were linked, including support and counterevidence;
- the exact retry reused the same run and provider response receipt without another call;
- a changed retry and a different customer were denied;
- the candidate projection remained minimal until evidence was requested;
- confirmation, correction, rejection and direct answer retained their separate provenance;
- the direct database primitive was inaccessible to the signed-in operator;
- all disposable users and rows were removed after the proof.

The accepted run used 892 input tokens, 843 output tokens and an estimated 20,428 micro-USD, approximately 2.04 US cents under the frozen price snapshot.

## Live defects caught and repaired

The proof was not green on the first attempt. It caught and repaired four material issues:

1. The first deploy mapped `@supabase/server` to the wrong package and failed to boot.
2. The pending-candidate guard read disposition from the candidate instead of its append-only review.
3. The provider first omitted counterevidence, then produced an honest abstention when the fixture was too thin. The semantic gate created no candidate in either case.
4. The database advisor revealed that signed-in users could reach internal reconstruction RPCs directly. Those primitives are now closed behind service-only wrappers and the hosted probe demonstrates denial.

The fixture was strengthened with decision-bearing observations rather than prompt pressure. Thin evidence continues to produce abstention.

## Files

- `supabase/migrations/20260925071626_decision_reconstruction_runs.sql`
- `supabase/migrations/20260925073126_decision_reconstruction_pending_candidate_fix.sql`
- `supabase/migrations/20260925074718_decision_reconstruction_service_boundary.sql`
- `supabase/functions/decision-reconstruct-v1/index.ts`
- `supabase/functions/decision-reconstruct-v1/deno.json`
- `supabase/functions/_shared/decision-reconstruction-request.ts`
- `scripts/probe-ctrl-g25-decision-ingress-r146.mjs`
- `project-documentation/ctrl-evolution/g25-decision-reconstruction-route-r151-qa-record.md`

## Honest boundary

This is one live decision fixture in the isolated project, not a provider-quality evaluation range or a production release. It proves the route, authority, lineage, retry, receipt and cleanup mechanics. It does not prove that candidate quality generalises across evidence depths, companies, decision families or abstention cases. The real application is not yet bound to this route. Production `bkyuxvschuwngtcdhsyg` was not contacted.

The next gate freezes and runs the external-by-internal evidence evaluation range, including required abstention cases, before connecting the application surface.
