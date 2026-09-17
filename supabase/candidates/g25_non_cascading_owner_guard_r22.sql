-- G25 R22 non-cascading owner guard candidate.
-- This is not a migration and must not be applied to a linked database.
-- It makes accidental auth-user cascades fail closed while the durable custody model remains under design.

alter table public.brain_workspaces
  drop constraint brain_workspaces_owner_id_fkey,
  add constraint brain_workspaces_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete restrict;

alter table public.brain_prepared_receipts
  drop constraint brain_prepared_receipts_owner_id_fkey,
  add constraint brain_prepared_receipts_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete restrict;

alter table public.brain_prepared_authority_corrections
  drop constraint brain_prepared_authority_corrections_owner_id_fkey,
  add constraint brain_prepared_authority_corrections_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete restrict;

alter table public.brain_prepared_subject_erasure_tombstones
  drop constraint brain_prepared_subject_erasure_tombstones_owner_id_fkey,
  add constraint brain_prepared_subject_erasure_tombstones_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete restrict;
