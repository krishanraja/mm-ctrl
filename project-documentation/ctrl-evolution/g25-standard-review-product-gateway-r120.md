# G25 standard review product gateway R120

Status: passed in isolated development; rendered authenticated route remains closed
Date: 2026-09-20
Depends on: R116 owner lifecycle, R118 immutable presentation and R119 hosted lifecycle

## Outcome

R120 proves that the actual `StandardReviewGateway`, not a parallel test client, can carry the governed owner-review lifecycle through the Supabase JavaScript client and the authenticated V2 Edge Function. The approved R117 experience and its words were not redesigned.

The product now has one small Supabase adapter that keeps an HTTP 409 `state_conflict` distinct from an ordinary transport failure. This matters because a leader must be told that the rule changed while they were reviewing it, rather than being shown a vague retry error.

## Hosted proof

A short-lived synthetic owner was created only in isolated project `cgkcplcamsijghalintq`. Three real candidates passed Compile, Build and Check. The product gateway then proved:

- all three immutable packets project into the exact human-review view model;
- the question, current rule, proposed rule, consequence, risk, validation, countercase and two resolved evidence rows survive the product boundary;
- an authenticated session refresh preserves the same packet identity and hash;
- rejection parses through the product gateway and mutates no active state;
- an exact successful approval retry parses the immutable receipt;
- a stale prepared packet becomes the product's explicit `state_conflict` state;
- reversal against a later unrelated head becomes the same explicit conflict state;
- the real reversal receipt with `restored: true` parses successfully;
- the original standard bytes and complete criteria snapshot are restored;
- both synthetic auth users and every review, decision, application, reversal, version, artifact and criterion row clean to zero.

The same probe also retained the R116 transport, cross-owner, concurrency, idempotency and changed-retry assertions. No credential was written to the repository, browser bundle, receipt or log.

## Defect closed

Supabase exposes a non-2xx Edge Function response through `error.context`. Without a deliberate adapter, the gateway could see only the generic message "Edge Function returned a non-2xx status code" and misclassify a stale review as a network failure. R120 reads the bounded error response, maps only a 409 or exact `state_conflict`, and leaves ordinary transport failures distinct.

## Honest boundary

This is a real authenticated product-code proof, but it is headless. It does not yet prove the rendered React experience carrying a short-lived browser session through approve, stale and reversal states. It does not authorize production mutation, customer data, merge to main, release, cutover or legacy retirement.

## Exactly one next action

R121 should mount the approved React experience against the actual product gateway with a short-lived authenticated browser fixture in the isolated project, exercise the decisive mobile and desktop paths, and clean every fixture row to zero. No credentials may enter the client bundle or permanent preview.
