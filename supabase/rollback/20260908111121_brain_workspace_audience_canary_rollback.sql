-- Destructive rollback for the G13 Living Brain canary.
-- Do not execute without exact action-time approval and a zero-row readback.

drop table if exists public.brain_relationship_version_assertions;
drop table if exists public.brain_relationship_versions;
drop table if exists public.brain_relationships;
drop table if exists public.brain_item_version_assertions;
drop table if exists public.brain_item_versions;
drop table if exists public.brain_items;
drop table if exists public.brain_assertions;
drop table if exists public.brain_sources;
drop table if exists public.brain_audience_grants;
drop table if exists public.brain_workspace_roles;
drop table if exists public.brain_workspaces;

drop function if exists private.brain_require_relationship_evidence();
drop function if exists private.brain_require_item_support();
drop function if exists private.brain_relationship_evidence_scope_guard();
drop function if exists private.brain_relationship_version_scope_guard();
drop function if exists private.brain_item_evidence_scope_guard();
drop function if exists private.brain_item_version_scope_guard();
drop function if exists private.brain_assertion_scope_guard();
