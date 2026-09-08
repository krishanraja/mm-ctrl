-- Harden the Brain canary against Supabase anonymous-auth sessions and
-- add the exact covering indexes identified by live database advisors.

alter policy brain_workspaces_member_select
on public.brain_workspaces
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_workspaces.id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
);

alter policy brain_workspace_roles_self_select
on public.brain_workspace_roles
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and user_id = (select auth.uid())
  and revoked_at is null
);

alter policy brain_audience_grants_self_select
on public.brain_audience_grants
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and grantee_user_id = (select auth.uid())
  and revoked_at is null
  and (expires_at is null or expires_at > now())
);

alter policy brain_sources_audience_select
on public.brain_sources
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_sources.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_sources.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_sources.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

alter policy brain_assertions_audience_select
on public.brain_assertions
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_assertions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_assertions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_assertions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

alter policy brain_item_versions_audience_select
on public.brain_item_versions
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_item_versions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_item_versions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_item_versions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

alter policy brain_items_visible_version_select
on public.brain_items
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_item_versions version_row
    where version_row.brain_item_id = brain_items.id
  )
);

alter policy brain_item_version_assertions_audience_select
on public.brain_item_version_assertions
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_item_version_assertions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_item_version_assertions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_item_version_assertions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

alter policy brain_relationship_versions_audience_select
on public.brain_relationship_versions
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_relationship_versions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_relationship_versions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_relationship_versions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

alter policy brain_relationships_visible_version_select
on public.brain_relationships
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_relationship_versions version_row
    where version_row.relationship_id = brain_relationships.id
  )
);

alter policy brain_relationship_version_assertions_audience_select
on public.brain_relationship_version_assertions
using (
  (auth.jwt() ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_relationship_version_assertions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_relationship_version_assertions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_relationship_version_assertions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create index brain_workspaces_owner_idx
  on public.brain_workspaces (owner_id);
create index brain_workspaces_subject_fk_idx
  on public.brain_workspaces (subject_id);
create index brain_workspace_roles_granted_by_idx
  on public.brain_workspace_roles (granted_by) where granted_by is not null;
create index brain_audience_grants_granted_by_idx
  on public.brain_audience_grants (granted_by) where granted_by is not null;
create index brain_sources_actor_user_idx
  on public.brain_sources (actor_user_id) where actor_user_id is not null;
create index brain_sources_created_by_idx
  on public.brain_sources (created_by) where created_by is not null;
create index brain_assertions_speaker_user_idx
  on public.brain_assertions (speaker_user_id) where speaker_user_id is not null;
create index brain_assertions_created_by_idx
  on public.brain_assertions (created_by) where created_by is not null;
create index brain_items_created_by_idx
  on public.brain_items (created_by) where created_by is not null;
create index brain_item_versions_parent_fk_idx
  on public.brain_item_versions (brain_item_id, workspace_id, subject_id);
create index brain_item_versions_created_by_idx
  on public.brain_item_versions (created_by) where created_by is not null;
create index brain_item_version_assertions_parent_fk_idx
  on public.brain_item_version_assertions (item_version_id, workspace_id);
create index brain_item_version_assertions_linked_by_idx
  on public.brain_item_version_assertions (linked_by) where linked_by is not null;
create index brain_relationships_created_by_idx
  on public.brain_relationships (created_by) where created_by is not null;
create index brain_relationship_versions_parent_fk_idx
  on public.brain_relationship_versions (relationship_id, workspace_id, subject_id);
create index brain_relationship_versions_created_by_idx
  on public.brain_relationship_versions (created_by) where created_by is not null;
create index brain_relationship_version_assertions_parent_fk_idx
  on public.brain_relationship_version_assertions (relationship_version_id, workspace_id);
create index brain_relationship_version_assertions_linked_by_idx
  on public.brain_relationship_version_assertions (linked_by) where linked_by is not null;
