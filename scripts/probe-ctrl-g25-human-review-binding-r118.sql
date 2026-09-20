begin;

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
  reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,
  is_super_admin,is_sso_user,is_anonymous,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '81000000-0000-4000-8000-000000000001',
  'authenticated','authenticated','r118-probe@example.invalid',
  extensions.crypt('not-a-real-password',extensions.gen_salt('bf')),now(),
  '','','','','','','',
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,
  false,false,false,now(),now()
);

insert into public.harness_runs(
  id,user_id,kind,surface,status,stage,stage_detail,created_at,updated_at
) values
  ('82000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001','critique','proposal','done','ready','{}',now()-interval '2 days',now()),
  ('82000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000001','critique','proposal','done','ready','{}',now()-interval '1 day',now());

insert into public.generated_artifacts(id,user_id,kind,name,body,metadata)
values (
  '83000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'standard','Proposal standard','# Proposal standard','{}'
);

insert into public.ledger(
  user_id,source_run_id,source_event_key,week,surface,signal,
  criterion_name,verdict,quote,disposition,created_at
) values
  ('81000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','judgement:proof','2026-W38','proposal','output','Proof before confidence','breaks','A £90,000 renewal proposal waited 36 hours and needed no substantive change.','rejected',now()-interval '2 days'),
  ('81000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000002','judgement:proof','2026-W38','proposal','output','Proof before confidence','breaks','A £120,000 expansion proposal waited a day and needed no substantive change.','rejected',now()-interval '1 day');

insert into public.proposals(
  id,user_id,type,surface,headline,delta_text,if_wrong,size_delta,evidence,status,
  proposal_key,proposal_version,proposal_hash,source_standard_artifact_id,
  source_standard_sha256,source_snapshot,governance,decided_by,decision_scope,decided_at
) values (
  '84000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'false_positive','proposal',
  'Two strong proposals waited for a review that changed nothing.',
  'Review proposals above £250,000 or changes to the company promise.',
  'A lower-value proposal could still carry material brand risk.',
  0,
  jsonb_build_object(
    'source_ids',jsonb_build_array(
      '82000000-0000-4000-8000-000000000001:judgement:proof',
      '82000000-0000-4000-8000-000000000002:judgement:proof'
    ),
    'lines',jsonb_build_array(
      jsonb_build_object(
        'sourceId','82000000-0000-4000-8000-000000000001:judgement:proof',
        'criterion','Renewal proposal review','verdict','breaks'
      ),
      jsonb_build_object(
        'sourceId','82000000-0000-4000-8000-000000000002:judgement:proof',
        'criterion','Expansion proposal review','verdict','breaks'
      )
    )
  ),
  'accepted','r118:proposal:rule',1,repeat('a',64),
  '83000000-0000-4000-8000-000000000001',repeat('b',64),repeat('c',64),
  jsonb_build_object(
    'alternative_explanations',jsonb_build_array('The team may be applying the current rule inconsistently.'),
    'expected_effect','Routine proposals move once the result, evidence and owner are named.',
    'validation','Inspect the next five proposals and every exception.'
  ),
  '81000000-0000-4000-8000-000000000001','{}',now()
);

-- Rejected avoids the accepted-decision queue trigger. The helper under test
-- binds only the immutable request-to-proposal lineage, so this probe inserts
-- the request explicitly below and rolls the complete fixture back.
insert into public.proposal_decisions(
  id,proposal_id,user_id,proposal_hash,decision,scope,decision_hash
) values (
  '85000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  repeat('a',64),'rejected','{}',repeat('d',64)
);

insert into public.standard_change_requests(
  id,user_id,proposal_id,proposal_decision_id,request_hash,proposal_hash,decision_hash,
  source_standard_artifact_id,source_standard_sha256,source_snapshot,source_manifest_sha256,
  surface,change_type,accepted_scope,state,proposal_snapshot,decision_snapshot,source_manifest
) values (
  '86000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001',
  '85000000-0000-4000-8000-000000000001',
  repeat('e',64),repeat('a',64),repeat('d',64),
  '83000000-0000-4000-8000-000000000001',repeat('b',64),repeat('c',64),repeat('f',64),
  'proposal','false_positive','{}','checked','{}','{}','{}'
);

do $probe$
declare
  projection jsonb;
begin
  projection := public.build_standard_change_review_presentation(
    '81000000-0000-4000-8000-000000000001',
    '86000000-0000-4000-8000-000000000001',
    '{"name":"Proposal review","check_text":"Review every customer-facing proposal."}'::jsonb,
    '{"name":"Proposal review","check_text":"Review proposals above £250,000 or changes to the company promise."}'::jsonb
  );
  if projection->>'schema' <> 'ctrl.standard-change.owner-review.presentation.v1'
     or projection->>'question' <> 'Should this be your proposal rule?'
     or projection->>'current_rule' <> 'Review every customer-facing proposal.'
     or projection->>'proposed_rule' <> 'Review proposals above £250,000 or changes to the company promise.'
     or projection->>'consequence' <> 'Routine proposals move once the result, evidence and owner are named.'
     or jsonb_array_length(projection->'evidence') <> 2
     or projection->'evidence'->0->>'statement' not like 'A £90,000 renewal%'
     or public.standard_change_json_sha256(projection) !~ '^[0-9a-f]{64}$' then
    raise exception 'r118_positive_projection_failed';
  end if;

  update public.ledger
  set quote = null
  where source_run_id = '82000000-0000-4000-8000-000000000001';

  begin
    perform public.build_standard_change_review_presentation(
      '81000000-0000-4000-8000-000000000001',
      '86000000-0000-4000-8000-000000000001',
      '{"name":"Proposal review","check_text":"Review every customer-facing proposal."}'::jsonb,
      '{"name":"Proposal review","check_text":"Review proposals above £250,000 or changes to the company promise."}'::jsonb
    );
    raise exception 'r118_missing_evidence_was_accepted';
  exception when others then
    if sqlerrm <> 'standard_change_presentation_evidence_incomplete' then
      raise;
    end if;
  end;
end
$probe$;

rollback;
