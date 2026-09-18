# G25 function environment requirements R104 QA record

## Deterministic inspection

- Repository function entrypoints: 118
- Entrypoints inspected: 118
- Missing relative imports: zero
- Unique environment symbols: 57
- Unclassified symbols: zero
- Stale policy entries: zero
- Inspector SHA-256: `825452ecc8a345647aad776e0233d84f764348391c4d23a11ea48b04a673eea4`
- Derived manifest SHA-256: `fbd182c62f5c98d51c3c246f4d2d9132562bcb97b010e2fd447f375b11a941d0`
- Value-free policy SHA-256: `f2f93f89531dabb6bcfbb6dc2a68b43b4532d11cf61b8499e9f301ff0eecbdfe`
- Per-route requirements SHA-256: `80a92f1ed337c56d8e7dcaecf0f1460cb3724a37583eaf96d405688de56f5acd`

## Risk coverage

The transitive closures expose 41 routes with model-spend configuration, 24 with external-research configuration, nine with outbound-delivery configuration, seven with scheduled-execution configuration, six with billing configuration, five with personal-data enrichment configuration, three with encrypted-data custody, three with external writes, ten with explicit project binding and one with cross-project privileged access. Seventy-nine routes use platform access configuration and 54 currently use privileged database access. The R106 settings repair, R107 ingestion repair, R109 grading repair, R110 compiler repair, R111 portable-skill repair, R112 critique repair, R113 measurement repair and R114 capture repair removed unnecessary service-role dependencies or added exact target binding.

Counts overlap because one route can consume several capability classes. They are used to require additional proof, never to imply the presence or correctness of a value.

## Negative assertions

- Production writes: zero
- Isolated database writes: zero
- Isolated secrets written: zero
- Environment values retrieved: no
- Raw live-only source retrieved: no
- Functions deployed by R104: zero
- Email, payment or model-spend route opened: no
- Legacy machinery retired: no

## Reproduction

Run:

`node scripts/inspect-ctrl-g25-function-env-requirements-r104.mjs --summary`

Then run:

`node scripts/check-ctrl-g25-function-environment-requirements-r104.mjs`

The checker fails if any function, relative import, environment symbol, classification, risk mapping, authority boundary or deployment gate drifts.
