# G25 function environment requirements R104 QA record

## Deterministic inspection

- Repository function entrypoints: 117
- Entrypoints inspected: 117
- Missing relative imports: zero
- Unique environment symbols: 56
- Unclassified symbols: zero
- Stale policy entries: zero
- Inspector SHA-256: `d1da16bd86e48cfd48f3f0c52b100b9409e1f47fcb1287c3035a0d6838f357f0`
- Derived manifest SHA-256: `53d37c3770736e21a76522eed0bf589b6d2d2053516b89ca5b512e6f366434ee`
- Value-free policy SHA-256: `114d3d7db103fa4e72ec7c93b0e7a9941fd74075f48df37cb4963349b12fc8a0`
- Per-route requirements SHA-256: `d832c38ba1471025d97149bc38a589045207f39f2dfd150748e58206c0dbc766`

## Risk coverage

The transitive closures expose 40 routes with model-spend configuration, 23 with external-research configuration, nine with outbound-delivery configuration, seven with scheduled-execution configuration, six with billing configuration, five with personal-data enrichment configuration, three with encrypted-data custody, three with external writes, eight with explicit project binding and one with cross-project privileged access. Seventy-eight routes use platform access configuration and 54 currently use privileged database access. The R106 settings repair, R107 ingestion repair, R109 grading repair, R110 compiler repair, R111 portable-skill repair and R112 critique repair removed unnecessary service-role dependencies.

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
