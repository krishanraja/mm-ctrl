# G25 non-FK identifier discovery R57 QA record

Status: static discovery complete. Classification and execution closed.

## Positive evidence

- The parser reads only Row fields from the generated Supabase type surface and declared relationship columns from the same table.
- Candidate rules cover direct email, phone, auth-like identity, provider identity, network metadata, person-name candidates, pseudonymous linkage and opaque JSON.
- The live delete-account table inventory includes both direct `.from()` calls and the dynamic sweep list.
- Current generated-schema and migration-only findings are kept separate.
- Thirteen current high-risk unmentioned anchors and eighteen migration-only high-risk unmentioned candidates are pinned by the checker.

## Residuals

- Generated types may be stale, as shown by migration-only Edge, kit, email and Brain candidates.
- Migration parsing is archaeology and may include later-dropped or table-level-FK columns.
- JSON field contents are not statically discoverable from column type alone.
- Column-name heuristics can overinclude non-personal names and underinclude unconventionally named identifiers.
- A real catalog and reviewed semantic registry remain required before execution.

No linked database, row read, live deletion edit, migration, deployment, merge or release is authorised.
