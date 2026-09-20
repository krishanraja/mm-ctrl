# G25 auth-reachable schema discovery, R17

Status: `local_auth_reachable_discovery_proved_registry_closed`

Machine record: [g25-auth-reachable-schema-discovery-r17.json](g25-auth-reachable-schema-discovery-r17.json)

## What it proves

R17 walks PostgreSQL's foreign-key catalog from `auth.users` through every reachable public relation. It returns each relation, its shortest depth, every discovered reference path, the exact constrained columns and the declared delete action. The canary finds direct rows such as workspaces and sources, plus transitive rows such as item versions and prepared-receipt dependencies.

The function is read-only, stable, security invoker and has an empty search path. `anon` and `authenticated` cannot execute it. Three negative controls prove that removing recursion, public-schema containment or privilege closure breaks the gate.

## The crucial distinction

Auth reachability is not ownership.

A direct link may mean “this person is the subject,” “this person owns the workspace,” or merely “this person created the row.” A reachable relation may need deletion, redaction, a justified retention exception or no erasure action at all. The catalog cannot make that judgement.

R17 therefore feeds a reviewed registry; it never feeds a generic delete loop. The next gate must classify every discovered relation and fail in both directions:

- a newly discovered relation without a registry decision;
- a registry entry whose relation or evidence no longer exists.

## What remains closed

Tables without foreign keys, storage, logs, providers, backups and exported copies still need separate discovery. This candidate is not a migration and has not touched linked Supabase, the current deletion function or customer data.
