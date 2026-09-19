begin;

alter table public.constructs
  drop constraint if exists elicited_needs_both_poles;

alter table public.constructs
  add constraint elicited_needs_both_poles check (
    status in ('candidate', 'retired')
    or (contrast_pole is not null and length(contrast_pole) > 0)
  );

alter table public.constructs
  drop constraint if exists elicited_needs_evidence;

alter table public.constructs
  add constraint elicited_needs_evidence check (
    status in ('candidate', 'retired')
    or array_length(evidence_ids, 1) >= 2
  );

comment on constraint elicited_needs_both_poles on public.constructs is
  'Elicited and compiled constructs need a contrast pole. Unfinished candidates may be retired after their source is corrected.';
comment on constraint elicited_needs_evidence on public.constructs is
  'Elicited and compiled constructs need at least two evidence rows. Unfinished candidates may be retired after their source is corrected.';

commit;
