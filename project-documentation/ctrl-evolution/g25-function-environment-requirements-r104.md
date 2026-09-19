# G25 function environment requirements R104

**Status:** Every repository-backed function now has a transitive, value-free environment dependency map. The map determines what must be proved before deployment; it does not declare a route safe.

## What changed

R99 found environment names in local route files and treated the shared directory as one global tree. That was useful for preservation, but too coarse for restoration. A route can import a shared module dynamically, and that module can introduce a provider key, privileged database client or external endpoint that is not visible in the entrypoint.

R104 walks every relative static and dynamic import reachable from each entrypoint. It fingerprints the exact closure, records every `Deno.env.get` symbol, identifies missing imports, maps each symbol to its consuming routes and classifies the dependency without reading its value. The current manifest includes the two R105 portability routes added after the initial R104 gate.

The result is complete at the repository boundary:

- 121 entrypoints inspected;
- zero missing relative imports;
- 58 unique environment symbols;
- zero unclassified symbols;
- 76 routes with at least one secret dependency;
- 45 routes without a secret dependency;
- 35 routes with no environment dependency at all; and
- 17 routes whose only declared dependencies are platform-injected values.

These are environment facts, not safety verdicts. Several routes with no environment dependency are deliberate containment stubs. Other routes can still have data, authorization, caller, cost or external-effect risks that the environment scan cannot see.

## Why the ladder matters

Restoring all functions at once would make hidden coupling hard to diagnose and could accidentally enable email, payment, model spend, enrichment or cross-project writes. R104 instead fixes the order:

1. Preserve the two already proved hosted routes.
2. Prove portable export and deterministic re-import without external providers.
3. Restore core Brain behavior only after route-specific caller, subject, RLS and cleanup evidence.
4. Add model and research routes only with spend, provenance and provider-receipt controls.
5. Add scheduled and outbound delivery only with isolated secrets, preview recipients and duplicate-send protection.
6. Restore billing, cross-project access and external writes last.

No route enters a stage merely because its environment list looks simple. The ladder is a priority and gating contract, not an automatic deployment planner.

## Authority boundary

No environment value was retrieved or persisted. R104 wrote no secret, deployed no function and changed neither production nor the isolated database. Email, payments, model spend, cross-project access, production cutover and legacy retirement remain closed.

The next safe action is a governed export and re-import loop on the isolated target. It should prove that a user can take a readable Brain package away and restore it deterministically without allowing one user's material to enter another user's Brain.
