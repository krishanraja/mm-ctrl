begin;

drop function if exists public.prepare_and_bind_standard_change_operator_projection_v1(uuid, text, uuid);

alter table public.standard_change_review_packets
  drop constraint if exists standard_change_review_packets_operator_scope_all_or_none;

alter table public.standard_change_review_packets
  add constraint standard_change_review_packets_operator_scope_all_or_none
  check (
    (workspace_id is null and subject_id is null
      and operator_projection_audience is null and operator_projection_purpose is null)
    or
    (workspace_id is not null and subject_id is not null
      and operator_projection_audience is not null and operator_projection_purpose is not null)
  );

alter table public.standard_change_review_packets
  drop column if exists operator_projection_bound_by,
  drop column if exists operator_projection_bound_at;

commit;
