-- G25 non-schema safe-plane restore candidate R96
-- Blank isolated target only. Not applied by R96.
-- Restores only source-controlled, secret-free Storage and application Realtime state.

begin;

do $preflight$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'R96 preflight: Storage platform tables are absent';
  end if;
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    raise exception 'R96 preflight: supabase_realtime publication is absent';
  end if;
  if to_regclass('public.bottleneck_submissions') is null
    or to_regclass('public.effortless_map_items') is null
    or to_regclass('public.voting_results') is null then
    raise exception 'R96 preflight: required application Realtime tables are absent';
  end if;
  if to_regprocedure('public.has_role(uuid,public.app_role)') is null then
    raise exception 'R96 preflight: typed role helper is absent';
  end if;
  if exists (
    select 1 from storage.buckets
    where id in ('ctrl-briefings','documents','post-session-qr','pre-workshop-qr','skill-packages')
  ) then
    raise exception 'R96 preflight: one or more target buckets already exist';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname in (
        'Anyone can view QR codes via signed URL',
        'Facilitators can upload QR codes',
        'Facilitators can view QR codes',
        'Public read access to QR codes',
        'Users can delete their own briefing audio',
        'Users can delete their own documents',
        'Users can delete their own skill packages',
        'Users can read their own briefing audio',
        'Users can read their own documents',
        'Users can read their own skill packages',
        'Users can upload their own briefing audio',
        'Users can upload their own documents'
      )
  ) then
    raise exception 'R96 preflight: one or more target Storage policies already exist';
  end if;
  if exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename in ('bottleneck_submissions','effortless_map_items','voting_results')
  ) then
    raise exception 'R96 preflight: one or more target Realtime memberships already exist';
  end if;
end
$preflight$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
  ('ctrl-briefings','ctrl-briefings',false,10485760,null),
  ('documents','documents',false,52428800,array['application/pdf']::text[]),
  ('post-session-qr','post-session-qr',true,null,null),
  ('pre-workshop-qr','pre-workshop-qr',true,1048576,array['image/png']::text[]),
  ('skill-packages','skill-packages',false,20971520,array['application/zip']::text[]);

create policy "Anyone can view QR codes via signed URL"
on storage.objects for select to public
using (bucket_id='pre-workshop-qr');

create policy "Facilitators can upload QR codes"
on storage.objects for insert to authenticated
with check (
  bucket_id='pre-workshop-qr'
  and public.has_role(auth.uid(),'facilitator'::public.app_role)
);

create policy "Facilitators can view QR codes"
on storage.objects for select to authenticated
using (
  bucket_id='pre-workshop-qr'
  and public.has_role(auth.uid(),'facilitator'::public.app_role)
);

create policy "Public read access to QR codes"
on storage.objects for select to public
using (bucket_id='pre-workshop-qr');

create policy "Users can delete their own briefing audio"
on storage.objects for delete to authenticated
using (bucket_id='ctrl-briefings' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can delete their own documents"
on storage.objects for delete to authenticated
using (bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can delete their own skill packages"
on storage.objects for delete to authenticated
using (bucket_id='skill-packages' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can read their own briefing audio"
on storage.objects for select to authenticated
using (bucket_id='ctrl-briefings' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can read their own documents"
on storage.objects for select to authenticated
using (bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can read their own skill packages"
on storage.objects for select to authenticated
using (bucket_id='skill-packages' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can upload their own briefing audio"
on storage.objects for insert to authenticated
with check (bucket_id='ctrl-briefings' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Users can upload their own documents"
on storage.objects for insert to authenticated
with check (bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text);

alter publication supabase_realtime add table
  public.bottleneck_submissions,
  public.effortless_map_items,
  public.voting_results;

commit;
