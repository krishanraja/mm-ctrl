-- G25 canonical application-owned schema fingerprint R98.
-- Read only. Extension-owned routines are intentionally governed by the R94 runtime proof.

SELECT pg_catalog.set_config('search_path', '', false);

WITH
column_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    a.attnum::text,
    a.attname,
    pg_catalog.format_type(a.atttypid, a.atttypmod),
    a.attnotnull::text,
    a.attidentity::text,
    a.attgenerated::text,
    md5(coalesce(pg_catalog.pg_get_expr(d.adbin, d.adrelid), ''))
  ) AS line
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND c.relkind IN ('r', 'p')
    AND a.attnum > 0
    AND NOT a.attisdropped
),
constraint_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    con.conname,
    con.contype::text,
    md5(pg_catalog.pg_get_constraintdef(con.oid, true))
  ) AS line
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
),
index_lines AS (
  SELECT concat_ws('|', schemaname, tablename, indexname, md5(indexdef)) AS line
  FROM pg_catalog.pg_indexes
  WHERE schemaname IN ('public', 'private', 'ctrl_discovery')
),
policy_lines AS (
  SELECT concat_ws(
    '|',
    schemaname,
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd,
    md5(coalesce(qual, '')),
    md5(coalesce(with_check, ''))
  ) AS line
  FROM pg_catalog.pg_policies
  WHERE schemaname IN ('public', 'private', 'ctrl_discovery')
),
application_routines AS (
  SELECT p.*, n.nspname
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_depend dependency
      WHERE dependency.classid = 'pg_catalog.pg_proc'::pg_catalog.regclass
        AND dependency.objid = p.oid
        AND dependency.deptype = 'e'
    )
),
routine_lines AS (
  SELECT concat_ws(
    '|',
    p.nspname,
    p.oid::pg_catalog.regprocedure::text,
    p.prokind::text,
    p.prosecdef::text,
    p.provolatile::text,
    p.proparallel::text,
    md5(pg_catalog.pg_get_functiondef(p.oid))
  ) AS line
  FROM application_routines p
  WHERE p.prokind <> 'a'
  UNION ALL
  SELECT concat_ws(
    '|',
    p.nspname,
    p.oid::pg_catalog.regprocedure::text,
    p.prokind::text,
    p.prosecdef::text,
    p.provolatile::text,
    p.proparallel::text,
    md5(concat_ws('|', p.prorettype::pg_catalog.regtype::text, p.prosrc))
  ) AS line
  FROM application_routines p
  WHERE p.prokind = 'a'
),
view_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    c.relkind::text,
    md5(pg_catalog.pg_get_viewdef(c.oid, true))
  ) AS line
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND c.relkind IN ('v', 'm')
),
trigger_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    t.tgname,
    md5(pg_catalog.pg_get_triggerdef(t.oid, true))
  ) AS line
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND NOT t.tgisinternal
),
rls_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    c.relrowsecurity::text,
    c.relforcerowsecurity::text
  ) AS line
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND c.relkind IN ('r', 'p')
),
grant_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    coalesce(grantee.rolname, 'PUBLIC'),
    acl.privilege_type,
    acl.is_grantable::text
  ) AS line
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(
      c.relacl,
      pg_catalog.acldefault(
        CASE WHEN c.relkind = 'S' THEN 'S'::"char" ELSE 'r'::"char" END,
        c.relowner
      )
    )
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
),
routine_grant_lines AS (
  SELECT concat_ws(
    '|',
    p.nspname,
    p.oid::pg_catalog.regprocedure::text,
    coalesce(grantee.rolname, 'PUBLIC'),
    acl.privilege_type,
    acl.is_grantable::text
  ) AS line
  FROM application_routines p
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
),
schema_grant_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    coalesce(grantee.rolname, 'PUBLIC'),
    acl.privilege_type,
    acl.is_grantable::text
  ) AS line
  FROM pg_catalog.pg_namespace n
  CROSS JOIN LATERAL pg_catalog.aclexplode(
    coalesce(n.nspacl, pg_catalog.acldefault('n', n.nspowner))
  ) acl
  LEFT JOIN pg_catalog.pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
),
fingerprints AS (
  SELECT 'columns'::text AS domain, count(*)::bigint AS object_count,
    coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) AS digest
  FROM column_lines
  UNION ALL
  SELECT 'constraints', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM constraint_lines
  UNION ALL
  SELECT 'indexes', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM index_lines
  UNION ALL
  SELECT 'policies', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM policy_lines
  UNION ALL
  SELECT 'routines', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM routine_lines
  UNION ALL
  SELECT 'views', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM view_lines
  UNION ALL
  SELECT 'triggers', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM trigger_lines
  UNION ALL
  SELECT 'rls', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM rls_lines
  UNION ALL
  SELECT 'table_grants', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM grant_lines
  UNION ALL
  SELECT 'routine_grants', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM routine_grant_lines
  UNION ALL
  SELECT 'schema_grants', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM schema_grant_lines
)
SELECT domain, object_count, digest
FROM fingerprints
ORDER BY domain;
