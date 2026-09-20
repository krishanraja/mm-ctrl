# G24 trusted canonical ingress R55

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R55 JSON contract

## What R55 repairs

R55 replaces partial fixture validation with complete recursive validation of every persisted identity source and every linked target before an identity can be used. It enforces literals, constants, enums, types, exact keys, required fields, closed objects, union variants, arrays, item schemas, minimum and maximum cardinality, uniqueness, string and decoded-byte limits, hashes, sentinels, timestamps, numeric bounds and declared cross-field equalities.

Identity roles now come from the complete union of native schema and store authorities under one explicit precedence. All 1,229 R53 candidates are adjudicated: 1,228 distinct native identities remain and one duplicate nonce alias is collapsed. No candidate is excluded through a remembered field-name list. Six hold-result fields are correctly classified as a resolved result reference, companion bytes hash or companion fingerprint.

Every one of the 70 linked identities now has one schema-valid source row and one schema-valid concrete target row chosen from an executable selector context. Target identity, bytes and fingerprint are recomputed first. The source reference and its applicable companions are then bound to that target and the source is resealed. A missing target identity is a hard failure. There is no fingerprint fallback.

The focused checker independently decodes and validates all fixtures, recomputes their native identities and rejects 215 attacks. These include exactly 148 literal or constant mutations, 12 minimum-array mutations, eight target-schema mutations, 13 missing-target-identity mutations, source-target splices, all six row-version self-reference attacks and all six hold-result role regressions. The final semantic closure contains 56,496 reference occurrences sealed across 237 manifest rows.

## Boundary

R55 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
