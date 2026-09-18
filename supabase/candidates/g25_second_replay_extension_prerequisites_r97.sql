-- G25 second blank replay extension prerequisites R97
-- Blank hosted Supabase target only. Uses platform defaults and verifies the required schemas.
-- Version compatibility is governed by G25-EXTENSION-RUNTIME-COMPATIBILITY-R94.

begin;

create schema if not exists extensions;
create schema if not exists vault;

create extension if not exists plpgsql with schema pg_catalog;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema public;
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists vector with schema public;

do $verification$
declare
  v_expected jsonb := jsonb_build_object(
    'pg_cron', 'pg_catalog',
    'pg_net', 'public',
    'pg_stat_statements', 'extensions',
    'pgcrypto', 'extensions',
    'plpgsql', 'pg_catalog',
    'supabase_vault', 'vault',
    'uuid-ossp', 'extensions',
    'vector', 'public'
  );
  v_name text;
  v_schema text;
begin
  for v_name, v_schema in
    select key, value #>> '{}'
    from jsonb_each(v_expected)
  loop
    if not exists (
      select 1
      from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace
      where e.extname = v_name
        and n.nspname = v_schema
    ) then
      raise exception 'R97 extension prerequisite missing or installed in wrong schema: % expected %', v_name, v_schema;
    end if;
  end loop;
end
$verification$;

commit;
