-- G25 non-schema safe-plane preflight R96
-- Read only. Returns counts and digests, never Storage objects, cron commands or secrets.

select
  (select count(*) from storage.buckets) as bucket_count,
  (select md5(coalesce(string_agg(
    concat_ws('|',id,name,public::text,coalesce(file_size_limit::text,''),coalesce(allowed_mime_types::text,'')),
    E'\n' order by id
  ),'')) from storage.buckets) as bucket_digest,
  (select count(*) from pg_policies where schemaname='storage' and tablename in ('objects','buckets')) as storage_policy_count,
  (select md5(coalesce(string_agg(
    concat_ws('|',schemaname,tablename,policyname,roles::text,cmd,qual,with_check),
    E'\n' order by policyname
  ),'')) from pg_policies where schemaname='storage' and tablename in ('objects','buckets')) as storage_policy_digest,
  (select count(*) from pg_publication_tables
    where pubname='supabase_realtime' and schemaname in ('public','private','ctrl_discovery')) as application_realtime_table_count,
  (select md5(coalesce(string_agg(format('%I.%I',schemaname,tablename),E'\n' order by schemaname,tablename),''))
    from pg_publication_tables
    where pubname='supabase_realtime' and schemaname in ('public','private','ctrl_discovery')) as application_realtime_table_digest;
