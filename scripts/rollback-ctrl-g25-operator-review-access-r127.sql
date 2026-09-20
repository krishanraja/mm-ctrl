begin;

drop function if exists public.get_operator_pending_standard_change_review_v1(uuid);
drop table if exists public.brain_access_receipts;

drop index if exists public.standard_change_review_packets_operator_queue_idx;
alter table public.standard_change_review_packets
  drop constraint if exists standard_change_review_packets_workspace_subject_owner_fk,
  drop constraint if exists standard_change_review_packets_operator_scope_all_or_none,
  drop column if exists operator_projection_purpose,
  drop column if exists operator_projection_audience,
  drop column if exists subject_id,
  drop column if exists workspace_id;

alter table public.brain_workspaces
  drop constraint if exists brain_workspaces_id_subject_owner_unique;

drop table if exists private.brain_operator_auth_links;
drop table if exists private.brain_operator_principals;

commit;
