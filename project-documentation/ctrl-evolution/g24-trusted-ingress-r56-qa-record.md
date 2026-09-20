# G24 trusted canonical ingress R56 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R56 materialization from frozen R55: passed
- Focused R56 checker: passed with 233 mutation probes
- Native persisted identities preserved: 1,228 of 1,229 candidates, with one duplicate nonce alias collapsed
- Linked identity authorities: 70
- Shared complete equality fixtures: 38
- Every declared companion bound to the same target: passed
- Vacuous companion coverage where a declaration is nonempty: rejected
- Source-driven concrete selectors: 374
- Source-schema-valid contexts: 2,516
- `enum_ref` fixture mutations rejected: 8 of 8
- Empty identifier rejected: passed
- 257-byte identifier rejected: passed
- 32-hex pattern mismatch rejected: passed
- Noncanonical base64url `A` rejected: passed
- Nullable non-null recursive positive and negative probes: passed
- Conditional `use_release` result-reference positive and negative probes: passed
- Final-state semantic-reference occurrences: 57,702
- Full runtime-semantic authority manifest: 239 rows
- Frozen R55 machine input: exact
- Visible surface changes: none
- External actions: none

The independent checker found and forced two further producer corrections during construction. Receipt precommit and final fingerprints are now distinct companion fields on one receipt target rather than collapsed into one scalar. Selector comparison now requires every dimension represented by the selected source schema without inventing requirements for dimensions that schema does not carry.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
