# G25 owner-controlled operator projection binding, R129

Status: `local_owner_binding_candidate_passed`

R129 closes the hidden choreography exposed by R128. An authenticated owner can now complete the human-readable presentation and bind the resulting ready review packet to one active customer workspace through one transaction. The operation verifies the exact check result, packet hash, owner-review schema, presentation schema and three useful presentation fields before it binds anything.

The binding is deliberately not access. It records the exact workspace, subject, private audience, preparation purpose, owner and first-bound time. It creates no operator identity, role or audience grant. It does not decide the review, mutate the active standard or send a notification. The existing R127 five-field read membrane remains the only possible operator projection.

An exact retry is idempotent and preserves the first-bound time. A second workspace, another owner, a stale check, a decided packet, a partial scope write and a direct authenticated table update all fail closed. A mutation control removed the rebind guard and proved that the test detects the resulting cross-workspace weakness.

This is a local PostgreSQL candidate, not a deployed migration. R130 may turn the same operation into one exact additive isolated migration, rehearse rollback and restore, then prove the hosted owner-to-operator lifecycle through the new owner RPC. Production remains untouched.
