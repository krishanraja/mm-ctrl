# G25 operator review access PostgreSQL candidate, R125

Status: `local_postgresql_candidate_pass_runtime_unproved`

R125 turns the R124 authority contract into a rollback-only PostgreSQL candidate. It still does not grant live operator access.

The candidate extends `standard_change_review_packets` in place with workspace, subject, operator-projection audience and operator-projection purpose. All four fields are either present together or absent together. A composite foreign key binds a scoped packet to the exact workspace subject and owner. Existing unbound packets remain valid for the owner route but can never enter the operator queue.

One general `brain_access_receipts` table records authenticated allowed and denied Brain reads. It has forced RLS, no authenticated table privileges and no update or delete path. Each receipt carries the stable operator principal, selected workspace, customer scope, owner-issued role and grant, purpose, audience, resource, result, private reason, returned field names and a SHA-256 of its canonical JSON payload. It stores no review prose.

The only executable path is a security-definer function granted to `authenticated`. The function derives the caller from `auth.uid()`, resolves an active stable operator identity, requires the exact customer workspace to be active, requires an owner-granted active operator role, then requires an owner-granted unrevoked and unexpired `delivery_team_private` grant for `standard_change_review_preparation`. It selects the oldest exactly bound ready packet inside that workspace, verifies the frozen presentation hash and returns only review ID, question, headline, consequence and ready-since time.

The local PostgreSQL proof passes an exact authorized read, two-to-one workspace isolation, five-field projection, valid receipt hash, immediate grant revocation and append-only receipt permissions. Fourteen denial routes return the same public `not_available` response while preserving the exact private reason. Removing only the exact-purpose predicate makes the wrong-purpose case pass, proving that the test can detect that boundary.

R125 uses the exact stable operator table names from the R23 custody candidate, but those tables are not yet part of the live review runtime. The candidate is not a migration, has not run in Supabase and has not altered the isolated or production project. R126 must reconcile the smallest stable-operator identity slice against the isolated catalogue before any migration or hosted proof is proposed.
