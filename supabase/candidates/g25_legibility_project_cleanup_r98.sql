-- G25 Legibility project cleanup R98
-- One-time destructive cleanup for project cgkcplcamsijghalintq only.
-- The preflight binds this operation to the observed retired Legibility shape.

begin;

do $preflight$
declare
  v_application_tables bigint;
  v_auth_users bigint;
  v_cron_jobs bigint;
  v_migrations bigint;
begin
  select count(*) into v_application_tables
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE';

  select count(*) into v_auth_users from auth.users;
  select count(*) into v_cron_jobs from cron.job;
  select count(*) into v_migrations from supabase_migrations.schema_migrations;

  if v_application_tables <> 20
    or v_auth_users <> 4
    or v_cron_jobs <> 2
    or v_migrations <> 12 then
    raise exception 'R98 cleanup preflight refused: observed counts no longer match retired Legibility';
  end if;

  if to_regclass('public.api_keys') is null
    or to_regclass('public.golden_eval_runs') is null
    or to_regclass('public.observations') is null
    or to_regclass('public.outcome_reports') is null
    or to_regclass('public.plans') is null then
    raise exception 'R98 cleanup preflight refused: Legibility identity tables are missing';
  end if;

  if exists (select 1 from storage.buckets)
    or exists (select 1 from storage.objects)
    or exists (select 1 from vault.secrets)
    or exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
    ) then
    raise exception 'R98 cleanup preflight refused: an excluded hosted-data lane is not empty';
  end if;
end
$preflight$;

do $unschedule$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job loop
    perform cron.unschedule(v_job_id);
  end loop;
end
$unschedule$;

drop schema public cascade;
create schema public authorization pg_database_owner;
comment on schema public is 'standard public schema';

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to pg_database_owner;

delete from auth.users;
truncate table cron.job_run_details;
delete from supabase_migrations.schema_migrations;

do $verification$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
  ) then
    raise exception 'R98 cleanup verification failed: public application objects remain';
  end if;

  if exists (select 1 from auth.users)
    or exists (select 1 from auth.identities)
    or exists (select 1 from auth.sessions)
    or exists (select 1 from auth.refresh_tokens)
    or exists (select 1 from cron.job)
    or exists (select 1 from cron.job_run_details)
    or exists (select 1 from storage.buckets)
    or exists (select 1 from storage.objects)
    or exists (select 1 from vault.secrets) then
    raise exception 'R98 cleanup verification failed: retired rows remain';
  end if;
end
$verification$;

commit;
