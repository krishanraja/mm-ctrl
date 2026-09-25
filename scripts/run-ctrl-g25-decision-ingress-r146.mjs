import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createG25PostgresHarness } from './lib/g25-postgres-harness.mjs'

const root = process.cwd()
const proveReconstruction = process.argv.includes('--reconstruction')
const proveGroundedCandidate = process.argv.includes('--grounded-candidate') || proveReconstruction
const proveCandidateProjection = process.argv.includes('--candidate-projection') || proveGroundedCandidate
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8').replaceAll('\r\n', '\n')
const spine = read('supabase/candidates/g25_consequential_work_spine_r142.sql')
const migration = read('supabase/migrations/20260925054258_decision_candidate_ingress.sql')
const indexMigration = read('supabase/migrations/20260925054429_decision_candidate_ingress_fk_indexes.sql')
const chronologyMigration = read('supabase/migrations/20260925055922_decision_ingress_server_chronology.sql')
const projectionMigration = proveCandidateProjection
  ? read('supabase/migrations/20260925061613_decision_candidate_projection_context.sql')
  : ''
const groundingMigration = proveGroundedCandidate
  ? read('supabase/migrations/20260925064643_decision_candidate_evidence_lineage.sql')
  : ''
const reconstructionMigration = proveReconstruction
  ? read('supabase/migrations/20260925071626_decision_reconstruction_runs.sql')
  : ''
const reconstructionPendingCandidateFix = proveReconstruction
  ? read('supabase/migrations/20260925073126_decision_reconstruction_pending_candidate_fix.sql')
  : ''
const reconstructionServiceBoundary = proveReconstruction
  ? read('supabase/migrations/20260925074718_decision_reconstruction_service_boundary.sql')
  : ''
const regression = read('supabase/tests/database/g25_consequential_work_spine_r142.test.sql')

const requiredTokens = [
  'create table public.brain_decision_answer_candidates',
  'create table public.brain_decision_candidate_reviews',
  'create or replace function public.stage_brain_decision_candidate_v1',
  'create or replace function public.read_brain_decision_question_context_v1',
  'create or replace function public.read_brain_decision_candidate_v1',
  'create or replace function public.record_brain_decision_answer_v1',
  'create or replace function public.reject_brain_decision_candidate_v1',
  "'candidate_staged', 'candidate_confirmed', 'candidate_corrected', 'candidate_rejected'",
  'alter table public.brain_decision_answer_candidates force row level security',
  'alter table public.brain_decision_candidate_reviews force row level security',
]

for (const token of requiredTokens) {
  if (!migration.includes(token)) throw new Error(`R146 migration missing ${token}`)
}
if (migration.includes('bkyuxvschuwngtcdhsyg')) throw new Error('R146 migration contains the production project reference')
if (/\u2014/.test(migration)) throw new Error('R146 migration contains an em dash')
if (!chronologyMigration.includes('server_recorded_at := statement_timestamp()')) {
  throw new Error('R146 chronology repair lost the server receipt boundary')
}

const db = await createG25PostgresHarness()
try {
  await db.exec(`
    create table public.brain_sources (
      id uuid primary key,
      workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
      subject_id uuid not null references auth.users(id) on delete cascade,
      source_type text not null,
      actor_user_id uuid references auth.users(id) on delete set null,
      speaker_label text,
      captured_at timestamptz not null,
      purpose text not null,
      audience text not null,
      retention_expires_at timestamptz,
      integrity_sha256 text,
      external_locator text,
      content_ciphertext text,
      encryption_version smallint,
      recorded_at timestamptz not null default now(),
      created_by uuid references auth.users(id) on delete set null
    );
    create table public.brain_assertions (
      id uuid primary key,
      workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
      subject_id uuid not null references auth.users(id) on delete cascade,
      source_id uuid not null references public.brain_sources(id) on delete cascade,
      speaker_user_id uuid references auth.users(id) on delete set null,
      epistemic_basis text not null,
      audience text not null,
      statement_ciphertext text not null,
      encryption_version smallint not null,
      source_span_start integer,
      source_span_end integer,
      source_span_sha256 text,
      valid_at timestamptz,
      recorded_at timestamptz not null default now(),
      created_by uuid references auth.users(id) on delete set null
    );
    grant all on public.brain_sources, public.brain_assertions to service_role;
  `)
  await db.exec(spine)
  await db.exec(migration)
  await db.exec(indexMigration)
  await db.exec(chronologyMigration)
  if (projectionMigration) await db.exec(projectionMigration)
  if (groundingMigration) await db.exec(groundingMigration)
  if (reconstructionMigration) await db.exec(reconstructionMigration)
  if (reconstructionPendingCandidateFix) await db.exec(reconstructionPendingCandidateFix)
  if (reconstructionServiceBoundary) await db.exec(reconstructionServiceBoundary)

  const regressionResults = await db.exec(regression)
  const regressionResult = regressionResults.flatMap(entry => entry.rows ?? [])
    .find(row => Object.hasOwn(row, 'g25_consequential_work_spine_result'))
  if (regressionResult?.g25_consequential_work_spine_result?.status !== 'passed') {
    throw new Error('R146 did not preserve the complete R142 canary')
  }

  const readback = await db.query(`
    select jsonb_build_object(
      'candidate_tables', (
        select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in ('brain_decision_answer_candidates', 'brain_decision_candidate_reviews'${proveGroundedCandidate ? ", 'brain_decision_candidate_evidence_links'" : ''}${proveReconstruction ? ", 'brain_decision_reconstruction_runs'" : ''})
          and c.relkind = 'r'
      ),
      'forced_rls_tables', (
        select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in ('brain_decision_answer_candidates', 'brain_decision_candidate_reviews'${proveGroundedCandidate ? ", 'brain_decision_candidate_evidence_links'" : ''}${proveReconstruction ? ", 'brain_decision_reconstruction_runs'" : ''})
          and c.relforcerowsecurity
      ),
      'ordinary_table_privileges', (
        select count(*)::int from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name in ('brain_decision_answer_candidates', 'brain_decision_candidate_reviews'${proveGroundedCandidate ? ", 'brain_decision_candidate_evidence_links'" : ''}${proveReconstruction ? ", 'brain_decision_reconstruction_runs'" : ''})
          and grantee in ('anon', 'authenticated')
      ),
      'authenticated_entrypoints', (
        select count(*)::int
        from (values
          ('stage_brain_decision_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,text,timestamptz,text,text)'),
          ('read_brain_decision_question_context_v1(uuid)'),
          ('read_brain_decision_candidate_v1(uuid)'),
          ('record_brain_decision_answer_v1(uuid,uuid,uuid,uuid,text,text,text,timestamptz,text,text,uuid,text)'),
          ('reject_brain_decision_candidate_v1(uuid,timestamptz,text,text)')
          ${proveGroundedCandidate ? ",('stage_grounded_brain_decision_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,text,timestamptz,jsonb,text,text)')" : ''}
          ${proveReconstruction ? ",('begin_brain_decision_reconstruction_v1(uuid,uuid,text,text,text,text,text)'),('commit_brain_decision_reconstruction_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,jsonb,text,text,text,text,text,text,integer,integer,bigint)'),('finish_brain_decision_reconstruction_v1(uuid,text,text,text,text,text,text,integer,integer,bigint,text)')" : ''}
        ) signature(value)
        where has_function_privilege('authenticated', 'public.' || signature.value, 'execute')
      ),
      'anonymous_entrypoints', (
        select count(*)::int
        from (values
          ('stage_brain_decision_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,text,timestamptz,text,text)'),
          ('read_brain_decision_question_context_v1(uuid)'),
          ('read_brain_decision_candidate_v1(uuid)'),
          ('record_brain_decision_answer_v1(uuid,uuid,uuid,uuid,text,text,text,timestamptz,text,text,uuid,text)'),
          ('reject_brain_decision_candidate_v1(uuid,timestamptz,text,text)')
          ${proveGroundedCandidate ? ",('stage_grounded_brain_decision_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,text,timestamptz,jsonb,text,text)')" : ''}
          ${proveReconstruction ? ",('begin_brain_decision_reconstruction_v1(uuid,uuid,text,text,text,text,text)'),('commit_brain_decision_reconstruction_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,jsonb,text,text,text,text,text,text,integer,integer,bigint)'),('finish_brain_decision_reconstruction_v1(uuid,text,text,text,text,text,text,integer,integer,bigint,text)')" : ''}
        ) signature(value)
        where has_function_privilege('anon', 'public.' || signature.value, 'execute')
      ),
      'candidate_rows', (select count(*)::int from public.brain_decision_answer_candidates),
      'review_rows', (select count(*)::int from public.brain_decision_candidate_reviews)
      , 'unindexed_candidate_foreign_keys', (
        select count(*)::int
        from pg_constraint c
        where c.contype = 'f'
          and c.conrelid in (
            'public.brain_decision_answer_candidates'::regclass,
            'public.brain_decision_candidate_reviews'::regclass
            ${proveGroundedCandidate ? ", 'public.brain_decision_candidate_evidence_links'::regclass" : ''}
            ${proveReconstruction ? ", 'public.brain_decision_reconstruction_runs'::regclass" : ''}
          )
          and not exists (
            select 1 from pg_index i
            where i.indrelid = c.conrelid
              and i.indisvalid
              and (i.indkey::smallint[])[0:cardinality(c.conkey)-1] = c.conkey
          )
      )
    ) as result
  `)
  const result = readback.rows[0].result
  const expected = {
    candidate_tables: proveReconstruction ? 4 : (proveGroundedCandidate ? 3 : 2),
    forced_rls_tables: proveReconstruction ? 4 : (proveGroundedCandidate ? 3 : 2),
    ordinary_table_privileges: 0,
    authenticated_entrypoints: proveGroundedCandidate ? 6 : 5,
    anonymous_entrypoints: 0,
    candidate_rows: 0,
    review_rows: 0,
    unindexed_candidate_foreign_keys: 0,
  }
  for (const [key, value] of Object.entries(expected)) {
    if (result[key] !== value) throw new Error(`R146 ${key}: expected ${value}, received ${result[key]}`)
  }
  let projectionContext = null
  if (proveCandidateProjection) {
    const projectionReadback = await db.query(`
      select pg_get_functiondef(
        'public.read_brain_decision_candidate_v1(uuid)'::regprocedure
      ) as definition
    `)
    const definition = projectionReadback.rows[0]?.definition ?? ''
    const required = [
      "'question_prompt_ciphertext'",
      "'source_content_ciphertext'",
      "'epistemic_basis'",
      'private.brain_decision_ingress_actor',
    ]
    for (const token of required) {
      if (!definition.includes(token)) throw new Error(`R147 projection context missing ${token}`)
    }
    projectionContext = 'minimum_plus_explicit_basis_ciphertexts'
  }
  let groundedLineage = null
  if (proveGroundedCandidate) {
    const groundingReadback = await db.query(`
      select jsonb_build_object(
        'table_forced_rls', (
          select relforcerowsecurity from pg_class
          where oid = 'public.brain_decision_candidate_evidence_links'::regclass
        ),
        'raw_authenticated_privileges', (
          select count(*)::int from information_schema.role_table_grants
          where table_schema = 'public'
            and table_name = 'brain_decision_candidate_evidence_links'
            and grantee in ('anon', 'authenticated')
        ),
        'grounded_function', to_regprocedure(
          'public.stage_grounded_brain_decision_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,text,timestamptz,jsonb,text,text)'
        ) is not null
      ) as result
    `)
    const grounding = groundingReadback.rows[0]?.result
    if (!grounding?.table_forced_rls || grounding.raw_authenticated_privileges !== 0 || !grounding.grounded_function) {
      throw new Error(`R148 grounded lineage readback failed: ${JSON.stringify(grounding)}`)
    }
    groundedLineage = 'exact_existing_evidence_atoms_required'
  }
  let reconstructionBoundary = null
  if (proveReconstruction) {
    const reconstructionReadback = await db.query(`
      select jsonb_build_object(
        'table_forced_rls', (
          select relforcerowsecurity from pg_class
          where oid = 'public.brain_decision_reconstruction_runs'::regclass
        ),
        'raw_authenticated_privileges', (
          select count(*)::int from information_schema.role_table_grants
          where table_schema = 'public'
            and table_name = 'brain_decision_reconstruction_runs'
            and grantee in ('anon', 'authenticated')
        ),
        'one_pending_index', to_regclass('public.brain_decision_reconstruction_one_pending') is not null,
        'begin_function', to_regprocedure(
          'public.begin_brain_decision_reconstruction_v1(uuid,uuid,text,text,text,text,text)'
        ) is not null,
        'candidate_function', to_regprocedure(
          'public.commit_brain_decision_reconstruction_candidate_v1(uuid,uuid,uuid,uuid,text,text,text,jsonb,text,text,text,text,text,text,integer,integer,bigint)'
        ) is not null,
        'finish_function', to_regprocedure(
          'public.finish_brain_decision_reconstruction_v1(uuid,text,text,text,text,text,text,integer,integer,bigint,text)'
        ) is not null,
        'service_only_entrypoints', (
          select count(*)::int
          from (values
            ('begin_brain_decision_reconstruction_service_v1(uuid,uuid,uuid,text,text,text,text,text)'),
            ('commit_brain_decision_reconstruction_candidate_service_v1(uuid,uuid,uuid,uuid,uuid,text,text,text,jsonb,text,text,text,text,text,text,integer,integer,bigint)'),
            ('finish_brain_decision_reconstruction_service_v1(uuid,uuid,text,text,text,text,text,text,integer,integer,bigint,text)')
          ) signature(value)
          where has_function_privilege('service_role', 'public.' || signature.value, 'execute')
            and not has_function_privilege('authenticated', 'public.' || signature.value, 'execute')
            and not has_function_privilege('anon', 'public.' || signature.value, 'execute')
        )
      ) as result
    `)
    const reconstruction = reconstructionReadback.rows[0]?.result
    if (!reconstruction?.table_forced_rls || reconstruction.raw_authenticated_privileges !== 0 ||
      !reconstruction.one_pending_index || !reconstruction.begin_function ||
      !reconstruction.candidate_function || !reconstruction.finish_function ||
      reconstruction.service_only_entrypoints !== 3) {
      throw new Error(`R151 reconstruction readback failed: ${JSON.stringify(reconstruction)}`)
    }
    reconstructionBoundary = 'canonical_packet_plus_immutable_attempt_receipt_plus_service_only_commit'
  }
  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    regression: 'R142 full canary',
    ...result,
    ...(projectionContext ? { projection_context: projectionContext } : {}),
    ...(groundedLineage ? { grounded_lineage: groundedLineage } : {}),
    ...(reconstructionBoundary ? { reconstruction_boundary: reconstructionBoundary } : {}),
  }, null, 2)}\n`)
} finally {
  await db.close()
}
