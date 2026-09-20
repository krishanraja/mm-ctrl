# G25 isolated operator-review migration, R127 QA

## Applied state

- Exact target: isolated project `cgkcplcamsijghalintq` (`legibility`).
- Production project `bkyuxvschuwngtcdhsyg`: zero writes.
- Migration version: `20260920170000`, recorded exactly once.
- Stable identity tables: two, using the R23 names and semantics.
- Packet projection columns: four, nullable as one all-or-none scope.
- New constraints: exact workspace-owner-subject uniqueness, all-or-none packet scope and composite packet-to-workspace ownership binding.
- General Brain access receipt: present, RLS enabled and forced, with no direct authenticated or service-role table access.
- Operator queue RPC: authenticated execution only; anonymous and service-role direct execution absent.
- Returned projection: `review_packet_id`, `question`, `headline`, `consequence`, `ready_since` only.
- Seeded identities, bound packets and access receipts: zero.
- R115 conveyor tables: five preserved.
- R123 owner-private queue: preserved.
- Catalogue fingerprint after restore: `ee9fb806b351a6a00b5f7e754f620f23be1dd61141d49791f13c0c38055e5bed`.

## Behavioural basis

R125 remains the exhaustive database behaviour proof: eighteen evaluator cases, one positive PostgreSQL route, fourteen private denial reasons collapsed to the same public response, immediate grant revocation, append-only authenticated receipts and a purpose-predicate negative control. R127 adds live schema and ACL evidence without pretending that catalogue presence alone is a hosted user journey.

## Rollback and restore

The isolated migration was rolled back with the committed exact-object operator. Readback found zero operator identity tables, zero projection columns, no access-receipt table, no operator RPC and no R127 migration-history row. The five R115 tables and R123 owner queue remained present. The exact migration was then restored, the history row returned exactly once and the full R127 probe passed with zero fixture residue.

## Advisor boundary

The isolated database linter reported no issue for the new R127 RPC. It still reports inherited warnings and errors in older unrelated functions. Those findings are not hidden or attributed to R127, and this slice does not authorise repairs outside its scope.

## Remaining proof

R128 must exercise authenticated hosted transport with disposable identities and one explicitly scoped synthetic packet, prove cross-workspace refusal and revocation, and remove every fixture. Product provisioning, production, merge, release, cutover and legacy retirement remain closed.
