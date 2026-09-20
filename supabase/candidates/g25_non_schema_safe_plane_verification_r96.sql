-- G25 non-schema safe-plane verification R96
-- Read only. A restored blank target must return the exact production values below.

with observed as (
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
      where pubname='supabase_realtime' and schemaname in ('public','private','ctrl_discovery')) as application_realtime_table_digest
)
select *,
  bucket_count=5 and bucket_digest='6ce21d238eb0f97d533b2a5f3edcea0d' as buckets_match,
  storage_policy_count=12 and storage_policy_digest='6a12467a080dd4ca168b82e9b0133c59' as storage_policies_match,
  application_realtime_table_count=3
    and application_realtime_table_digest='0eff919f64729539dee064d450f4f235' as application_realtime_matches
from observed;
