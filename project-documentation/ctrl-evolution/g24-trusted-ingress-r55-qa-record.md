# G24 trusted canonical ingress R55 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R55 materialization from frozen R54: passed
- Focused R55 checker: passed with 215 mutation probes
- R53 identity candidates adjudicated: 1,229 of 1,229
- Distinct native persisted identities: 1,228
- Duplicate nonce aliases collapsed: 1
- Linked source-target fixtures: 70 of 70
- Hold-result identity fields reclassified: 6 of 6
- Non-self-referential native row versions: 6 of 6
- Recursive literal or constant attacks rejected: 148 of 148
- Recursive minimum-array attacks rejected: 12 of 12
- Target-schema attacks rejected: 8 of 8
- Missing-target-identity attacks rejected: 13 of 13
- Source-driven concrete selectors: 374
- Source-schema-valid contexts covered exactly once: 2,516
- Final-state semantic-reference occurrences: 56,496
- Full runtime-semantic authority manifest: 237 rows
- Inherited R54 persistence, codec, signature and restart evidence: exact
- R55 machine SHA-256: `3b59b93e3cc2ed283163333262aa4a47dfee0d514f62661340a22f165bb18a86`
- Visible surface changes: none
- External actions: none

The checker also caught and forced repair of three producer defects during construction: self-schema links used distinct rows, receipt companions conflated precommit and final fingerprints, and a registry's foreign hold-row reference was mistaken for the registry row's own content address. A checker-side in-place sort that mutated frozen schema arrays was also removed before the gate was accepted.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
