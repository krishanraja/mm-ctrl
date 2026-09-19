-- G25 recovery public-schema fingerprint R78
-- Read-only. Returns counts and hashes, never rows, defaults, predicates or routine bodies.

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
    md5(coalesce(pg_get_expr(d.adbin, d.adrelid), ''))
  ) AS line
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE n.nspname = 'public'
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
    md5(pg_get_constraintdef(con.oid, true))
  ) AS line
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
),
index_lines AS (
  SELECT concat_ws('|', schemaname, tablename, indexname, md5(indexdef)) AS line
  FROM pg_indexes
  WHERE schemaname = 'public'
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
  FROM pg_policies
  WHERE schemaname = 'public'
),
routine_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    p.oid::regprocedure::text,
    p.prokind::text,
    p.prosecdef::text,
    p.provolatile::text,
    p.proparallel::text,
    md5(pg_get_functiondef(p.oid))
  ) AS line
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind <> 'a'
  UNION ALL
  SELECT concat_ws(
    '|',
    n.nspname,
    p.oid::regprocedure::text,
    p.prokind::text,
    p.prosecdef::text,
    p.provolatile::text,
    p.proparallel::text,
    md5(concat_ws('|', p.prorettype::regtype::text, p.prosrc))
  ) AS line
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'a'
),
view_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    c.relkind::text,
    md5(pg_get_viewdef(c.oid, true))
  ) AS line
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
),
trigger_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    c.relname,
    t.tgname,
    md5(pg_get_triggerdef(t.oid, true))
  ) AS line
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
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
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
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
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(
    coalesce(
      c.relacl,
      acldefault(CASE WHEN c.relkind = 'S' THEN 'S'::"char" ELSE 'r'::"char" END, c.relowner)
    )
  ) acl
  LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
),
routine_grant_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    p.oid::regprocedure::text,
    coalesce(grantee.rolname, 'PUBLIC'),
    acl.privilege_type,
    acl.is_grantable::text
  ) AS line
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
  LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public'
),
schema_grant_lines AS (
  SELECT concat_ws(
    '|',
    n.nspname,
    coalesce(grantee.rolname, 'PUBLIC'),
    acl.privilege_type,
    acl.is_grantable::text
  ) AS line
  FROM pg_namespace n
  CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) acl
  LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
  WHERE n.nspname = 'public'
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
