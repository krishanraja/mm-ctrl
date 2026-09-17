-- R17 is read-only discovery. It neither registers nor deletes a relation.
create schema if not exists private;

create or replace function private.brain_discover_auth_reachable_relations()
returns table (
  relation_schema text,
  relation_name text,
  minimum_depth integer,
  reference_paths jsonb,
  delete_actions text[]
)
language sql
stable
security invoker
set search_path = ''
as $function$
  with recursive fk_walk as (
    select
      con.oid as constraint_oid,
      con.conname as constraint_name,
      con.conrelid as relation_oid,
      1 as depth,
      array[con.confrelid, con.conrelid]::oid[] as path_oids,
      array[
        format('%I.%I', parent_ns.nspname, parent.relname),
        format('%I.%I', child_ns.nspname, child.relname)
      ]::text[] as path_names,
      con.confdeltype as delete_action_code
    from pg_catalog.pg_constraint con
    join pg_catalog.pg_class child on child.oid = con.conrelid
    join pg_catalog.pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_catalog.pg_class parent on parent.oid = con.confrelid
    join pg_catalog.pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    where con.contype = 'f'
      and con.confrelid = 'auth.users'::pg_catalog.regclass
      and child_ns.nspname = 'public'
      and child.relkind in ('r', 'p')

    union all

    select
      con.oid,
      con.conname,
      con.conrelid,
      walk.depth + 1,
      walk.path_oids || con.conrelid,
      walk.path_names || format('%I.%I', child_ns.nspname, child.relname),
      con.confdeltype
    from fk_walk walk
    join pg_catalog.pg_constraint con
      on con.contype = 'f'
     and con.confrelid = walk.relation_oid
    join pg_catalog.pg_class child on child.oid = con.conrelid
    join pg_catalog.pg_namespace child_ns on child_ns.oid = child.relnamespace
    where child_ns.nspname = 'public'
      and child.relkind in ('r', 'p')
      and not child.oid = any(walk.path_oids)
  ),
  normalized as (
    select
      relation_oid,
      constraint_name,
      depth,
      path_names,
      case delete_action_code
        when 'a' then 'no_action'
        when 'r' then 'restrict'
        when 'c' then 'cascade'
        when 'n' then 'set_null'
        when 'd' then 'set_default'
        else 'unknown'
      end as delete_action
    from fk_walk
  ),
  path_rows as (
    select distinct
      relation_oid,
      constraint_name,
      depth,
      path_names,
      delete_action
    from normalized
  )
  select
    relation_ns.nspname::text as relation_schema,
    relation.relname::text as relation_name,
    min(path_rows.depth)::integer as minimum_depth,
    jsonb_agg(
      jsonb_build_object(
        'constraint', path_rows.constraint_name,
        'depth', path_rows.depth,
        'relations', to_jsonb(path_rows.path_names),
        'on_delete', path_rows.delete_action
      )
      order by path_rows.depth, path_rows.constraint_name
    ) as reference_paths,
    array_agg(distinct path_rows.delete_action order by path_rows.delete_action)::text[] as delete_actions
  from path_rows
  join pg_catalog.pg_class relation on relation.oid = path_rows.relation_oid
  join pg_catalog.pg_namespace relation_ns on relation_ns.oid = relation.relnamespace
  group by relation_ns.nspname, relation.relname
  order by relation_ns.nspname, relation.relname;
$function$;

revoke all on function private.brain_discover_auth_reachable_relations() from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.brain_discover_auth_reachable_relations() to service_role;
