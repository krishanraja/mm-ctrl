# G25 human review hosted lifecycle R119

Status: passed in isolated development; product-browser integration remains closed
Date: 2026-09-20
Depends on: R116 owner lifecycle and R118 presentation-complete packet

## What was proved

R119 exercised `review-standard-change-v2` with real authenticated synthetic owners against isolated Supabase project `cgkcplcamsijghalintq`. It reused the frozen R116 end-to-end fixture rather than creating a softer second test. The R116 probe itself remained byte-identical. R119 generated a temporary executable in the governed scratch directory, replaced only the route under test and added exact assertions for the R118 presentation.

Three real candidates passed Compile, Build and Check. All three prepared packets contained the exact presentation schema, current and proposed rules, consequence, risk, validation plan, countercase, two evidence rows and false deploy and release authority.

The hosted lifecycle then proved:

- anonymous, wrong-method, wrong-media, oversized and malformed requests fail with the intended status;
- cross-owner access returns 404;
- direct receipt insertion is denied;
- rejection mutates no active state;
- two simultaneous approvals produce one 200 and one 409;
- an exact approval retry is idempotent;
- a changed retry conflicts;
- a separately prepared packet becomes stale after another application wins;
- reversal refuses an unrelated later head;
- exact reversal succeeds and is idempotent on exact retry;
- a changed reversal retry conflicts;
- the original standard body and criteria snapshot are restored exactly.

The synthetic users and every related review packet, decision, application, reversal, version, artifact and criterion cleaned to zero. No production project, customer row or public preview was mutated.

## Modular proof correction

The R116 checker had hashed the whole `supabase/config.toml`, so adding an unrelated V2 function falsely made the R116 route look changed. The checker now seals only the exact `[functions.review-standard-change]` block while preserving the historical whole-file hash. This is a direct application of the modular machinery rule: one new machine may not invalidate an unchanged neighbouring machine merely because they share a registry file.

## Honest limit

R119 proves the hosted HTTP lifecycle and the presentation packet. It does not yet prove that the React product gateway can carry an authenticated session through refresh and invoke those exact receipts in a rendered browser. That is the R120 boundary.

## Exactly one next action

R120 should run the actual `StandardReviewGateway` against a short-lived authenticated synthetic fixture in the isolated project, then prove refresh, stable retry, stale state and complete cleanup without embedding credentials in the client or changing the approved UI.
