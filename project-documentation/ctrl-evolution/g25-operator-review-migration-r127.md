# G25 isolated operator-review migration, R127

Status: `isolated_migration_applied_rollback_restored`

R127 turns the locally proven R125 operator-review contract into one additive migration on the isolated `legibility` project. It adds only the missing live slice confirmed by R126: two stable operator identity tables, four nullable packet-projection bindings, one general Brain access-receipt table and one read-only operator queue RPC.

The migration reuses `brain_workspaces`, `brain_workspace_roles` and `brain_audience_grants`. It does not create a second permission system. Existing review packets are left unbound and therefore remain owner-only. No operator identity, projection binding or access receipt is seeded.

The live readback proves that authenticated users cannot read or mutate receipt rows directly, anonymous and service roles cannot call the operator RPC, and only the authenticated role can request the five-field projection. The RPC itself still requires a live stable identity, active selected workspace, owner-granted unrevoked operator role and owner-granted finite unexpired audience-purpose grant before returning anything. The raw owner packet, evidence manifest and decision controls are not projected.

A clean rollback removed the R127 objects and history row while preserving all five R115 conveyor tables and the R123 owner queue. The exact migration was then restored and the complete catalogue and ACL readback passed again. Production received zero writes.

R127 proves deployed schema, permissions, rollback and restore. It does not yet claim a hosted authenticated operator read because it deliberately creates no identities or packet bindings. R128 may create disposable isolated owner and operator identities, bind one synthetic review packet, exercise allow, cross-workspace refusal and immediate revocation through authenticated transport, then clean every fixture to zero. No product-facing provisioning path, production action, release or merge is authorised by this result.
