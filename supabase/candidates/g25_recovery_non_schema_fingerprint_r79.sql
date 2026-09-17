-- G25 recovery non-schema fingerprint R79
-- Read-only. Hashes operational metadata without returning commands, secret names or values.

WITH
extension_lines AS (
  SELECT concat_ws('|', e.extname, e.extversion, n.nspname) AS line
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
),
role_lines AS (
  SELECT concat_ws(
    '|',
    rolname,
    rolsuper::text,
    rolinherit::text,
    rolcreaterole::text,
    rolcreatedb::text,
    rolcanlogin::text,
    rolreplication::text,
    rolbypassrls::text,
    rolconnlimit::text,
    (rolvaliduntil IS NOT NULL)::text
  ) AS line
  FROM pg_roles
),
membership_lines AS (
  SELECT concat_ws(
    '|',
    role_role.rolname,
    member_role.rolname,
    m.admin_option::text
  ) AS line
  FROM pg_auth_members m
  JOIN pg_roles role_role ON role_role.oid = m.roleid
  JOIN pg_roles member_role ON member_role.oid = m.member
),
publication_lines AS (
  SELECT concat_ws(
    '|',
    pubname,
    puballtables::text,
    pubinsert::text,
    pubupdate::text,
    pubdelete::text,
    pubtruncate::text
  ) AS line
  FROM pg_publication
),
publication_table_lines AS (
  SELECT concat_ws('|', pubname, schemaname, tablename) AS line
  FROM pg_publication_tables
),
cron_lines AS (
  SELECT concat_ws(
    '|',
    schedule,
    database,
    username,
    active::text,
    md5(command)
  ) AS line
  FROM cron.job
),
storage_bucket_lines AS (
  SELECT concat_ws(
    '|',
    id,
    name,
    public::text,
    coalesce(file_size_limit::text, ''),
    coalesce(allowed_mime_types::text, '')
  ) AS line
  FROM storage.buckets
),
vault_name_lines AS (
  SELECT concat_ws(
    '|',
    md5(coalesce(name, '')),
    md5(coalesce(description, ''))
  ) AS line
  FROM vault.secrets
),
fingerprints AS (
  SELECT 'extensions'::text AS domain, count(*)::bigint AS object_count,
    coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) AS digest
  FROM extension_lines
  UNION ALL
  SELECT 'roles', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM role_lines
  UNION ALL
  SELECT 'role_memberships', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM membership_lines
  UNION ALL
  SELECT 'publications', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM publication_lines
  UNION ALL
  SELECT 'publication_tables', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM publication_table_lines
  UNION ALL
  SELECT 'cron_jobs', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM cron_lines
  UNION ALL
  SELECT 'storage_buckets', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM storage_bucket_lines
  UNION ALL
  SELECT 'vault_secret_names', count(*), coalesce(md5(string_agg(line, E'\n' ORDER BY line)), md5('')) FROM vault_name_lines
)
SELECT domain, object_count, digest
FROM fingerprints
ORDER BY domain;
