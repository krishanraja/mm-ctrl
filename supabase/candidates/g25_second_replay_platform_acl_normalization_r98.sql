-- G25 second replay platform ACL normalization R98
-- Restores the standard public-schema grant without copying extension-owned ACL drift.
-- Application-owned routine privileges must already match the production baseline.

begin;

select pg_catalog.set_config('search_path', '', true);

do $preflight$
declare
  v_routine_count bigint;
  v_routine_digest text;
  v_schema_count bigint;
  v_schema_digest text;
  v_extension_routines bigint;
begin
  with lines as (
    select concat_ws(
      '|', n.nspname, p.oid::regprocedure::text,
      coalesce(grantee.rolname, 'PUBLIC'),
      acl.privilege_type, acl.is_grantable::text
    ) as line
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    left join pg_roles grantee on grantee.oid = acl.grantee
    where n.nspname in ('public', 'private', 'ctrl_discovery')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  )
  select count(*), md5(string_agg(line, E'\n' order by line))
    into v_routine_count, v_routine_digest
  from lines;

  with lines as (
    select concat_ws(
      '|', n.nspname, coalesce(grantee.rolname, 'PUBLIC'),
      acl.privilege_type, acl.is_grantable::text
    ) as line
    from pg_namespace n
    cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) acl
    left join pg_roles grantee on grantee.oid = acl.grantee
    where n.nspname in ('public', 'private', 'ctrl_discovery')
  )
  select count(*), md5(string_agg(line, E'\n' order by line))
    into v_schema_count, v_schema_digest
  from lines;

  select count(*) into v_extension_routines
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private', 'ctrl_discovery')
    and exists (
      select 1 from pg_depend d
      where d.classid = 'pg_proc'::regclass
        and d.objid = p.oid
        and d.deptype = 'e'
    );

  if (v_routine_count, v_routine_digest) is distinct from
       (372::bigint, '5c240f83329395c136e0b20bfd062553'::text)
    or v_extension_routines <> 118
    or (v_schema_count, v_schema_digest) not in (
      (11::bigint, 'bd2ddd5c686a2e6f93fbac460e8fcdd7'::text),
      (12::bigint, 'f08632af471eac39debe086bfe584f03'::text)
    ) then
    raise exception 'R98 ACL normalization refused: replay state is not recognized';
  end if;
end
$preflight$;

grant usage on schema public to public;

do $verification$
declare
  v_routine_count bigint;
  v_routine_digest text;
  v_schema_count bigint;
  v_schema_digest text;
begin
  with lines as (
    select concat_ws(
      '|', n.nspname, p.oid::regprocedure::text,
      coalesce(grantee.rolname, 'PUBLIC'),
      acl.privilege_type, acl.is_grantable::text
    ) as line
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    left join pg_roles grantee on grantee.oid = acl.grantee
    where n.nspname in ('public', 'private', 'ctrl_discovery')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  )
  select count(*), md5(string_agg(line, E'\n' order by line))
    into v_routine_count, v_routine_digest
  from lines;

  with lines as (
    select concat_ws(
      '|', n.nspname, coalesce(grantee.rolname, 'PUBLIC'),
      acl.privilege_type, acl.is_grantable::text
    ) as line
    from pg_namespace n
    cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) acl
    left join pg_roles grantee on grantee.oid = acl.grantee
    where n.nspname in ('public', 'private', 'ctrl_discovery')
  )
  select count(*), md5(string_agg(line, E'\n' order by line))
    into v_schema_count, v_schema_digest
  from lines;

  if (v_routine_count, v_routine_digest) is distinct from
       (372::bigint, '5c240f83329395c136e0b20bfd062553'::text)
    or (v_schema_count, v_schema_digest) is distinct from
       (12::bigint, 'f08632af471eac39debe086bfe584f03'::text) then
    raise exception 'R98 ACL normalization failed to preserve application parity';
  end if;
end
$verification$;

commit;
