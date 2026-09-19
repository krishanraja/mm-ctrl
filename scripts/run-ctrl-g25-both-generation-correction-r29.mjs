import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const prior = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
].map(read);
const overlays = [
  "supabase/candidates/g25_non_cascading_owner_guard_r22.sql",
  "supabase/candidates/g25_stable_custody_identity_r23.sql",
  "supabase/candidates/g25_prepared_custody_atomic_store_r25.sql",
].map(read);
const candidate = read("supabase/candidates/g25_both_generation_correction_r29.sql");

const ids = {
  subject: "12000000-0000-4000-8000-000000000001",
  operator: "12000000-0000-4000-8000-000000000002",
  replacementOperatorUser: "12000000-0000-4000-8000-000000000003",
  workspace: "23000000-0000-4000-8000-000000000001",
  itemOne: "34000000-0000-4000-8000-000000000001",
  itemTwo: "34000000-0000-4000-8000-000000000002",
  oldOne: "45000000-0000-4000-8000-000000000001",
  newOne: "45000000-0000-4000-8000-000000000002",
  oldTwo: "45000000-0000-4000-8000-000000000003",
  newTwo: "45000000-0000-4000-8000-000000000004",
  source: "56000000-0000-4000-8000-000000000001",
  roleGrant: "67000000-0000-4000-8000-000000000001",
  legacyAffected: "78000000-0000-4000-8000-000000000001",
  custodyAffected: "78000000-0000-4000-8000-000000000002",
  legacyUnrelated: "78000000-0000-4000-8000-000000000003",
  custodyUnrelated: "78000000-0000-4000-8000-000000000004",
  legacyRollback: "78000000-0000-4000-8000-000000000005",
  custodyRollback: "78000000-0000-4000-8000-000000000006",
  correction: "89000000-0000-4000-8000-000000000001",
  rollbackCorrection: "89000000-0000-4000-8000-000000000002",
  rejectedCorrection: "89000000-0000-4000-8000-000000000003",
};

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-both-generation-correction-r29] ${message}`);
}

function replaceNth(source, needle, replacement, occurrence) {
  let from = 0;
  let found = -1;
  for (let index = 0; index < occurrence; index += 1) {
    found = source.indexOf(needle, from);
    if (found === -1) throw new Error(`mutation target ${occurrence} missing: ${needle}`);
    from = found + needle.length;
  }
  return `${source.slice(0, found)}${replacement}${source.slice(found + needle.length)}`;
}

async function expectFailure(action, fragment, label) {
  try {
    await action();
  } catch (error) {
    if (String(error?.message).includes(fragment)) return `${label}:closed`;
    throw new Error(`${label} failed for an unexpected reason: ${error?.message}`);
  }
  throw new Error(`${label} unexpectedly passed`);
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const sql of prior) await db.exec(sql);
  await db.exec(`
    insert into auth.users(id, email) values
      ('${ids.subject}', 'r29-subject@example.test'),
      ('${ids.operator}', 'r29-operator@example.test'),
      ('${ids.replacementOperatorUser}', 'r29-replacement@example.test');

    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values
      ('${ids.workspace}', '${ids.subject}', '${ids.operator}', 'r29-both-generation-correction');
    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values
      ('${ids.workspace}', '${ids.operator}', 'owner', '${ids.operator}'),
      ('${ids.workspace}', '${ids.replacementOperatorUser}', 'operator', '${ids.operator}');
    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose, granted_by
    ) values (
      '${ids.roleGrant}', '${ids.workspace}', '${ids.operator}', 'person_private',
      'prepared_intelligence', '${ids.operator}'
    );

    insert into public.brain_items(id, workspace_id, subject_id, item_key, semantic_type, created_by) values
      ('${ids.itemOne}', '${ids.workspace}', '${ids.subject}', 'judgement:quality', 'judgement', '${ids.operator}'),
      ('${ids.itemTwo}', '${ids.workspace}', '${ids.subject}', 'judgement:causal', 'judgement', '${ids.operator}');
    insert into public.brain_item_versions(
      id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
      encryption_version, human_views, epistemic_basis, maturity, standing, audience,
      consequence_permission, applicability, exclusions, evidence_quality, corroboration,
      recency, transfer, human_confirmation, valid_from, recorded_at, created_by
    ) values
      (
        '${ids.oldOne}', '${ids.itemOne}', '${ids.workspace}', '${ids.subject}', 1,
        'Old quality standard', 'ciphertext:old-one', 1, array['founder'], 'direct_statement',
        'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
        0.9, 0.8, 0.9, 0.8, 1.0, '2026-09-17T08:00:00Z', '2026-09-17T08:01:00Z', '${ids.operator}'
      ),
      (
        '${ids.oldTwo}', '${ids.itemTwo}', '${ids.workspace}', '${ids.subject}', 1,
        'Old causal standard', 'ciphertext:old-two', 1, array['founder'], 'direct_statement',
        'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
        0.9, 0.8, 0.9, 0.8, 1.0, '2026-09-17T08:00:00Z', '2026-09-17T08:02:00Z', '${ids.operator}'
      );
    insert into public.brain_sources(
      id, workspace_id, subject_id, source_type, captured_at, purpose, audience,
      retention_expires_at, integrity_sha256, external_locator, content_ciphertext,
      encryption_version, recorded_at, created_by
    ) values (
      '${ids.source}', '${ids.workspace}', '${ids.subject}', 'external',
      '2026-09-17T08:00:00Z', 'prepared_intelligence', 'person_private',
      '2026-10-17T08:00:00Z', repeat('e', 64), 'https://example.test/evidence/r29',
      'ciphertext:source', 1, '2026-09-17T08:03:00Z', '${ids.operator}'
    );
  `);
  for (const sql of overlays) await db.exec(sql);
  await db.exec(candidateSql);
  return db;
}

async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

async function legacyAuthority(db, recordId, kind = "brain_item_version") {
  return scalar(db, `
    select private.brain_current_prepared_authority(
      $1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'person_private', 'prepared_intelligence'
    ) as authority
  `, [kind, recordId, ids.workspace, ids.operator, ids.subject]);
}

async function custodyAuthority(db, custodyId, recordId, kind = "brain_item_version") {
  return scalar(db, `
    select private.brain_current_prepared_custody_authority(
      $1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'person_private', 'prepared_intelligence'
    ) as authority
  `, [kind, recordId, ids.workspace, custodyId, ids.subject]);
}

function dependencyFrom(authority, observedAt) {
  const dependency = { ...authority, observed_at: observedAt };
  delete dependency.recorded_at;
  return dependency;
}

async function storeLegacy(db, receiptId, ingestKey, authority, marker) {
  const dependencies = [dependencyFrom(authority, "2026-09-17T08:59:00Z")];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_authority_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid, 'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [receiptId, ids.workspace, ids.operator, ids.subject, JSON.stringify(dependencies)]);
  const receipt = {
    receipt_id: receiptId,
    workspace_id: ids.workspace,
    owner_id: ids.operator,
    subject_id: ids.subject,
    ingest_key: ingestKey,
    request_sha256: marker.repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: marker.repeat(64),
    payload_ciphertext: `ciphertext:legacy:${ingestKey}`,
    encryption_version: 1,
    produced_at: "2026-09-17T09:00:00Z",
    expires_at: "2026-10-17T09:00:00Z",
  };
  return scalar(db,
    "select private.brain_store_prepared_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

async function storeCustody(db, custodyId, receiptId, ingestKey, authority, marker) {
  const dependencies = [dependencyFrom(authority, "2026-09-17T08:59:00Z")];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_custody_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid, 'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [receiptId, ids.workspace, custodyId, ids.subject, JSON.stringify(dependencies)]);
  const receipt = {
    schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
    receipt_id: receiptId,
    workspace_id: ids.workspace,
    custody_principal_id: custodyId,
    subject_id: ids.subject,
    ingest_key: ingestKey,
    request_sha256: marker.repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: marker.repeat(64),
    payload_ciphertext: `ciphertext:custody:${ingestKey}`,
    encryption_version: 2,
    produced_at: "2026-09-17T09:00:00Z",
    expires_at: "2026-10-17T09:00:00Z",
    dependencies,
  };
  return scalar(db,
    "select private.brain_store_prepared_custody_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

async function fixture(db) {
  await db.exec("set role service_role");
  const custodyId = await scalar(db,
    "select id from private.brain_custody_principals where workspace_id = $1::uuid",
    [ids.workspace],
  );
  const currentOperatorId = await scalar(db, `
    select assignment.operator_principal_id
    from private.brain_custody_assignments assignment
    where assignment.custody_principal_id = $1::uuid and assignment.ended_at is null
  `, [custodyId]);

  const authorities = {
    legacyOne: await legacyAuthority(db, ids.oldOne),
    custodyOne: await custodyAuthority(db, custodyId, ids.oldOne),
    legacyTwo: await legacyAuthority(db, ids.oldTwo),
    custodyTwo: await custodyAuthority(db, custodyId, ids.oldTwo),
    legacySource: await legacyAuthority(db, ids.source, "external_source_receipt"),
    custodySource: await custodyAuthority(db, custodyId, ids.source, "external_source_receipt"),
  };
  assert(Object.values(authorities).every(Boolean), "fixture authority unavailable");

  const created = await Promise.all([
    storeLegacy(db, ids.legacyAffected, "r29-legacy-affected", authorities.legacyOne, "1"),
    storeCustody(db, custodyId, ids.custodyAffected, "r29-custody-affected", authorities.custodyOne, "2"),
    storeLegacy(db, ids.legacyUnrelated, "r29-legacy-unrelated", authorities.legacySource, "3"),
    storeCustody(db, custodyId, ids.custodyUnrelated, "r29-custody-unrelated", authorities.custodySource, "4"),
    storeLegacy(db, ids.legacyRollback, "r29-legacy-rollback", authorities.legacyTwo, "5"),
    storeCustody(db, custodyId, ids.custodyRollback, "r29-custody-rollback", authorities.custodyTwo, "6"),
  ]);
  assert(created.every((result) => result.status === "created"), "fixture receipt store failed");

  const replacementOperatorId = await scalar(db, `
    insert into private.brain_operator_principals default values returning id
  `);
  await db.query(`
    insert into private.brain_operator_auth_links(operator_principal_id, user_id)
    values ($1::uuid, $2::uuid)
  `, [replacementOperatorId, ids.replacementOperatorUser]);
  await db.query(`
    select private.brain_transfer_workspace_custody(
      $1::uuid, $2::uuid, $3::uuid, $4, statement_timestamp()
    )
  `, [ids.workspace, currentOperatorId, replacementOperatorId, "a".repeat(64)]);

  await db.exec(`
    update public.brain_item_versions
    set standing = 'superseded', valid_until = '2026-09-17T09:30:00Z',
      superseded_by_version_id = case id
        when '${ids.oldOne}' then '${ids.newOne}'::uuid
        else '${ids.newTwo}'::uuid
      end
    where id in ('${ids.oldOne}', '${ids.oldTwo}');

    insert into public.brain_item_versions(
      id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
      encryption_version, human_views, epistemic_basis, maturity, standing, audience,
      consequence_permission, applicability, exclusions, evidence_quality, corroboration,
      recency, transfer, human_confirmation, valid_from, predecessor_version_id,
      recorded_at, created_by
    ) values
      (
        '${ids.newOne}', '${ids.itemOne}', '${ids.workspace}', '${ids.subject}', 2,
        'Corrected quality standard', 'ciphertext:new-one', 1, array['founder'], 'direct_statement',
        'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
        0.95, 0.9, 0.95, 0.85, 1.0, '2026-09-17T09:30:00Z', '${ids.oldOne}',
        '2026-09-17T09:31:00Z', '${ids.operator}'
      ),
      (
        '${ids.newTwo}', '${ids.itemTwo}', '${ids.workspace}', '${ids.subject}', 2,
        'Corrected causal standard', 'ciphertext:new-two', 1, array['founder'], 'direct_statement',
        'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
        0.95, 0.9, 0.95, 0.85, 1.0, '2026-09-17T09:30:00Z', '${ids.oldTwo}',
        '2026-09-17T09:32:00Z', '${ids.operator}'
      );
  `);
  return { custodyId, authorities };
}

async function correctionFor(db, custodyId, correctionId, affectedId, replacementId, requestMarker) {
  const replacement = await custodyAuthority(db, custodyId, replacementId);
  assert(replacement, "replacement authority unavailable");
  return {
    schema_version: "ctrl.prepared-intelligence-custody-correction.r29",
    correction_id: correctionId,
    workspace_id: ids.workspace,
    custody_principal_id: custodyId,
    subject_id: ids.subject,
    audience: "person_private",
    purpose: "prepared_intelligence",
    correction_mode: "replaced",
    affected_authority_kind: "brain_item_version",
    affected_authority_record_id: affectedId,
    replacement_authority_record_id: replacement.authority_record_id,
    replacement_authority_version: replacement.authority_version,
    replacement_authority_sha256: replacement.authority_sha256,
    request_sha256: requestMarker.repeat(64),
    occurred_at: new Date().toISOString(),
  };
}

async function applyCorrection(db, correction) {
  return scalar(db,
    "select private.brain_invalidate_both_prepared_generations_for_correction($1::jsonb) as result",
    [JSON.stringify(correction)],
  );
}

async function receiptState(db) {
  return scalar(db, `
    select jsonb_build_object(
      'legacy_affected', (select invalidated_at is not null from public.brain_prepared_receipts where id = '${ids.legacyAffected}'),
      'custody_affected', (select invalidated_at is not null from public.brain_prepared_custody_receipts where id = '${ids.custodyAffected}'),
      'legacy_unrelated', (select invalidated_at is not null from public.brain_prepared_receipts where id = '${ids.legacyUnrelated}'),
      'custody_unrelated', (select invalidated_at is not null from public.brain_prepared_custody_receipts where id = '${ids.custodyUnrelated}'),
      'legacy_rollback', (select invalidated_at is not null from public.brain_prepared_receipts where id = '${ids.legacyRollback}'),
      'custody_rollback', (select invalidated_at is not null from public.brain_prepared_custody_receipts where id = '${ids.custodyRollback}')
    ) as state
  `);
}

async function runPositive(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  const checks = [];
  try {
    const { custodyId, authorities } = await fixture(db);
    const correction = await correctionFor(
      db, custodyId, ids.correction, ids.oldOne, ids.newOne, "7",
    );
    const result = await applyCorrection(db, correction);
    assert(result.status === "invalidated", "correction did not execute");
    assert(result.legacy_affected_receipt_count === 1, "legacy count is not exact");
    assert(result.custody_affected_receipt_count === 1, "custody count is not exact");
    assert(result.affected_receipt_count === 2, "combined count is not exact");
    const state = await receiptState(db);
    assert(state.legacy_affected && state.custody_affected, "affected generations stayed current");
    assert(!state.legacy_unrelated && !state.custody_unrelated, "unrelated intelligence was invalidated");
    assert(!state.legacy_rollback && !state.custody_rollback, "different authority record was invalidated");
    checks.push("both_generations_invalidated_exactly");
    checks.push("unrelated_intelligence_preserved");
    checks.push("operator_transfer_did_not_change_custody_scope");

    const eventCounts = await db.query(`
      select
        (select count(*)::int from public.brain_prepared_receipt_events
          where receipt_id = '${ids.legacyAffected}' and event_type = 'invalidated') as legacy,
        (select count(*)::int from public.brain_prepared_custody_receipt_events
          where receipt_id = '${ids.custodyAffected}' and event_type = 'invalidated') as custody
    `);
    assert(eventCounts.rows[0].legacy === 1 && eventCounts.rows[0].custody === 1,
      "payload-free invalidation events are incomplete");
    checks.push("payload_free_event_per_generation");

    const replay = await applyCorrection(db, correction);
    assert(replay.status === "idempotent" && replay.affected_receipt_count === 2,
      "exact replay changed the result");
    checks.push("exact_replay_idempotent");
    checks.push(await expectFailure(
      () => applyCorrection(db, { ...correction, request_sha256: "8".repeat(64) }),
      "correction_identity_conflict",
      "conflicting_replay",
    ));
    checks.push(await expectFailure(
      () => applyCorrection(db, { ...correction, owner_id: ids.operator }),
      "correction_shape_invalid",
      "legacy_owner_smuggling",
    ));

    const superseded = {
      ...correction,
      correction_id: ids.rejectedCorrection,
      replacement_authority_record_id: ids.oldOne,
      replacement_authority_version: authorities.custodyOne.authority_version,
      replacement_authority_sha256: authorities.custodyOne.authority_sha256,
      request_sha256: "9".repeat(64),
    };
    checks.push(await expectFailure(
      () => applyCorrection(db, superseded),
      "replacement_authority_not_current",
      "superseded_replacement",
    ));

    await db.exec(`
      reset role;
      create function private.g25_r29_force_custody_event_failure()
      returns trigger language plpgsql set search_path = '' as $$
      begin
        if new.event_type = 'invalidated' and new.receipt_id = '${ids.custodyRollback}' then
          raise exception 'forced_r29_custody_event_failure';
        end if;
        return new;
      end;
      $$;
      create trigger g25_r29_force_custody_event_failure
      before insert on public.brain_prepared_custody_receipt_events
      for each row execute function private.g25_r29_force_custody_event_failure();
      set role service_role;
    `);
    const rollbackCorrection = await correctionFor(
      db, custodyId, ids.rollbackCorrection, ids.oldTwo, ids.newTwo, "a",
    );
    checks.push(await expectFailure(
      () => applyCorrection(db, rollbackCorrection),
      "forced_r29_custody_event_failure",
      "cross_generation_event_failure",
    ));
    const afterFailure = await receiptState(db);
    assert(!afterFailure.legacy_rollback && !afterFailure.custody_rollback,
      "cross-generation failure left partial invalidation");
    const failedCorrectionCount = await scalar(db,
      "select count(*)::int from public.brain_prepared_custody_corrections where id = $1::uuid",
      [ids.rollbackCorrection],
    );
    assert(failedCorrectionCount === 0, "failed operation left correction receipt");
    checks.push("cross_generation_failure_rolled_back_atomically");

    await db.exec("reset role; set role authenticated");
    try {
      checks.push(await expectFailure(
        () => applyCorrection(db, correction),
        "permission denied",
        "ordinary_user_correction",
      ));
    } finally {
      await db.exec("reset role");
    }

    return {
      status: "pass",
      postgres: (await db.query("show server_version")).rows[0].server_version,
      checks,
      counts: {
        legacy: result.legacy_affected_receipt_count,
        custody: result.custody_affected_receipt_count,
        combined: result.affected_receipt_count,
      },
    };
  } finally {
    await db.close();
  }
}

async function mutationMustFail(candidateSql, label) {
  try {
    await runPositive(candidateSql);
  } catch {
    return `${label}:failed_as_required`;
  }
  throw new Error(`${label} mutation unexpectedly passed`);
}

const affectedRecordPredicate = "and dependency_row.authority_record_id = affected_authority_record_id";
const replacementCurrentGuard = "if replacement_authority is null";
const result = await runPositive();
result.negative_controls = {
  legacy_record_scope: await mutationMustFail(
    replaceNth(candidate, affectedRecordPredicate, "and true", 1),
    "legacy_affected_record_predicate_removed",
  ),
  custody_record_scope: await mutationMustFail(
    replaceNth(candidate, affectedRecordPredicate, "and true", 2),
    "custody_affected_record_predicate_removed",
  ),
  replacement_currentness: await mutationMustFail(
    replaceNth(candidate, replacementCurrentGuard, "if false and replacement_authority is null", 1),
    "replacement_current_guard_removed",
  ),
};
console.log(JSON.stringify(result, null, 2));
