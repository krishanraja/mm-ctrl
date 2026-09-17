import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const chain = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
  "supabase/candidates/g25_non_cascading_owner_guard_r22.sql",
  "supabase/candidates/g25_stable_custody_identity_r23.sql",
  "supabase/candidates/g25_prepared_custody_atomic_store_r25.sql",
  "supabase/candidates/g25_prepared_custody_cipher_admission_r27.sql",
  "supabase/candidates/g25_both_generation_correction_r29.sql",
  "supabase/candidates/g25_both_generation_subject_erasure_r30.sql",
  "supabase/candidates/g25_unified_current_prepared_reader_r31.sql",
].map(read);
const cutover = read("supabase/candidates/g25_prepared_runtime_cutover_r32.sql");

const ids = {
  subject: "13300000-0000-4000-8000-000000000001",
  owner: "13300000-0000-4000-8000-000000000002",
  workspace: "24300000-0000-4000-8000-000000000001",
  grant: "35300000-0000-4000-8000-000000000001",
  oldItem: "46300000-0000-4000-8000-000000000001",
  oldVersion: "57300000-0000-4000-8000-000000000001",
  newItem: "46300000-0000-4000-8000-000000000002",
  newVersion: "57300000-0000-4000-8000-000000000002",
  legacyReceipt: "68300000-0000-4000-8000-000000000001",
  oldCustodyReceipt: "68300000-0000-4000-8000-000000000002",
  newCustodyReceipt: "68300000-0000-4000-8000-000000000003",
  correction: "79300000-0000-4000-8000-000000000001",
  erasure: "79300000-0000-4000-8000-000000000002",
};

const legacyFunctions = [
  "private.brain_store_prepared_receipt(jsonb,jsonb)",
  "private.brain_invalidate_prepared_receipts_for_correction(jsonb)",
  "private.brain_erase_prepared_subject(jsonb)",
];
const activeFunctions = [
  "private.brain_store_prepared_custody_receipt(jsonb,jsonb)",
  "private.brain_invalidate_both_prepared_generations_for_correction(jsonb)",
  "private.brain_erase_both_prepared_generations(jsonb)",
  "private.brain_read_current_prepared_intelligence(jsonb)",
];

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-post-cutover-lifecycle-r33] ${message}`);
}

function replaceOnce(source, needle, replacement) {
  const index = source.indexOf(needle);
  if (index === -1) throw new Error(`mutation target missing: ${needle}`);
  return `${source.slice(0, index)}${replacement}${source.slice(index + needle.length)}`;
}

async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

async function asRole(db, role, action) {
  await db.exec(`set role ${role}`);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
  }
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

async function seedAuthority(db) {
  await db.query(
    "insert into auth.users(id, email) values ($1::uuid, $2), ($3::uuid, $4)",
    [ids.subject, "r33-subject@example.test", ids.owner, "r33-owner@example.test"],
  );
  await db.query(`
    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key)
    values ($1::uuid, $2::uuid, $3::uuid, 'r33-lifecycle')
  `, [ids.workspace, ids.subject, ids.owner]);
  await db.query(`
    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by)
    values ($1::uuid, $2::uuid, 'owner', $2::uuid)
  `, [ids.workspace, ids.owner]);
  await db.query(`
    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose, granted_by
    ) values (
      $1::uuid, $2::uuid, $3::uuid, 'person_private', 'prepared_intelligence', $3::uuid
    )
  `, [ids.grant, ids.workspace, ids.owner]);
  await db.query(`
    insert into public.brain_items(
      id, workspace_id, subject_id, item_key, semantic_type, created_by
    ) values
      ($1::uuid, $3::uuid, $4::uuid, 'judgement:old', 'judgement', $5::uuid),
      ($2::uuid, $3::uuid, $4::uuid, 'judgement:replacement', 'judgement', $5::uuid)
  `, [ids.oldItem, ids.newItem, ids.workspace, ids.subject, ids.owner]);
  await db.query(`
    insert into public.brain_item_versions(
      id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
      encryption_version, human_views, epistemic_basis, maturity, standing, audience,
      consequence_permission, applicability, exclusions, evidence_quality, corroboration,
      recency, transfer, human_confirmation, valid_from, recorded_at, created_by
    ) values
      (
        $1::uuid, $3::uuid, $5::uuid, $6::uuid, 1, 'Old authority',
        'ciphertext:r33:old-authority', 1, array['founder'], 'direct_statement',
        'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
        0.9, 0.9, 0.9, 0.9, 1.0, '2026-09-16T08:00:00Z',
        '2026-09-16T08:01:00Z', $7::uuid
      ),
      (
        $2::uuid, $4::uuid, $5::uuid, $6::uuid, 1, 'Replacement authority',
        'ciphertext:r33:replacement-authority', 1, array['founder'], 'direct_statement',
        'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
        0.95, 0.95, 0.95, 0.95, 1.0, '2026-09-16T08:02:00Z',
        '2026-09-16T08:03:00Z', $7::uuid
      )
  `, [
    ids.oldVersion,
    ids.newVersion,
    ids.oldItem,
    ids.newItem,
    ids.workspace,
    ids.subject,
    ids.owner,
  ]);
}

async function createDatabase(cutoverSql = cutover) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const sql of chain.slice(0, 4)) await db.exec(sql);
  await seedAuthority(db);
  for (const sql of chain.slice(4)) await db.exec(sql);
  return db;
}

async function custodyId(db) {
  return scalar(db, `
    select id from private.brain_custody_principals where workspace_id = $1::uuid
  `, [ids.workspace]);
}

async function legacyAuthority(db, versionId) {
  return scalar(db, `
    select private.brain_current_prepared_authority(
      'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence'
    ) as authority
  `, [versionId, ids.workspace, ids.owner, ids.subject]);
}

async function custodyAuthority(db, custody, versionId) {
  return scalar(db, `
    select private.brain_current_prepared_custody_authority(
      'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence'
    ) as authority
  `, [versionId, ids.workspace, custody, ids.subject]);
}

function dependencyFrom(authority, observedAt) {
  const dependency = { ...authority, observed_at: observedAt };
  delete dependency.recorded_at;
  return dependency;
}

async function storeLegacyBeforeCutover(db, producedAt, expiresAt) {
  const authority = await legacyAuthority(db, ids.oldVersion);
  const dependencies = [dependencyFrom(authority, producedAt)];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_authority_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [ids.legacyReceipt, ids.workspace, ids.owner, ids.subject, JSON.stringify(dependencies)]);
  const receipt = {
    receipt_id: ids.legacyReceipt,
    workspace_id: ids.workspace,
    owner_id: ids.owner,
    subject_id: ids.subject,
    ingest_key: "r33-retained-legacy",
    request_sha256: "1".repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: "a".repeat(64),
    payload_ciphertext: "ciphertext:r33:retained-legacy",
    encryption_version: 1,
    produced_at: producedAt,
    expires_at: expiresAt,
  };
  return scalar(db,
    "select private.brain_store_prepared_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

async function custodyEnvelope(db, custody, { receiptId, versionId, ingestKey, marker, producedAt, expiresAt }) {
  const authority = await custodyAuthority(db, custody, versionId);
  const dependencies = [dependencyFrom(authority, producedAt)];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_custody_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [receiptId, ids.workspace, custody, ids.subject, JSON.stringify(dependencies)]);
  const aadSha256 = await scalar(db, `
    select private.brain_prepared_custody_cipher_aad_sha256(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5
    ) as aad_sha256
  `, [ids.workspace, custody, ids.subject, receiptId, fingerprint]);
  return {
    receipt: {
      schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
      receipt_id: receiptId,
      workspace_id: ids.workspace,
      custody_principal_id: custody,
      subject_id: ids.subject,
      ingest_key: ingestKey,
      request_sha256: marker.repeat(64),
      kind: "prepared_intelligence",
      audience: "person_private",
      purpose: "prepared_intelligence",
      authority_fingerprint: fingerprint,
      content_fingerprint: marker.repeat(64),
      payload_ciphertext: JSON.stringify({
        v: 2,
        alg: "A256GCM",
        kid: "r33-test-key",
        iv: "c2FmZS1pdi0x",
        ciphertext: `Y3VzdG9keS1yMzMt${marker}`,
        aad_sha256: aadSha256,
      }),
      encryption_version: 2,
      produced_at: producedAt,
      expires_at: expiresAt,
      dependencies,
    },
    dependencies,
  };
}

async function storeCustodyAsService(db, envelope) {
  return asRole(db, "service_role", () => scalar(db,
    "select private.brain_store_prepared_custody_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(envelope.receipt), JSON.stringify(envelope.dependencies)],
  ));
}

function readerScope(custody) {
  return {
    schema_version: "ctrl.prepared-intelligence-current-reader.r31",
    workspace_id: ids.workspace,
    custody_principal_id: custody,
    subject_id: ids.subject,
    audience: "person_private",
    purpose: "prepared_intelligence",
  };
}

async function readAsService(db, custody) {
  return asRole(db, "service_role", () => scalar(db,
    "select private.brain_read_current_prepared_intelligence($1::jsonb) as result",
    [JSON.stringify(readerScope(custody))],
  ));
}

async function functionPrivilege(db, role, signature) {
  return scalar(db, "select has_function_privilege($1, $2, 'EXECUTE')", [role, signature]);
}

async function assertFinalBoundary(db) {
  for (const signature of legacyFunctions) {
    assert(await functionPrivilege(db, "service_role", signature) === false,
      `legacy function reopened: ${signature}`);
  }
  for (const signature of activeFunctions) {
    assert(await functionPrivilege(db, "service_role", signature) === true,
      `active function closed: ${signature}`);
    assert(await functionPrivilege(db, "authenticated", signature) === false,
      `authenticated can execute active function: ${signature}`);
    assert(await functionPrivilege(db, "anon", signature) === false,
      `anon can execute active function: ${signature}`);
  }
  assert(await scalar(db, `
    select not has_table_privilege('service_role', 'public.brain_prepared_receipts', 'INSERT')
      and not has_table_privilege('service_role', 'public.brain_prepared_custody_receipts', 'INSERT')
      and not has_column_privilege(
        'service_role', 'public.brain_prepared_receipts', 'invalidated_at', 'UPDATE'
      )
      and not has_column_privilege(
        'service_role', 'public.brain_prepared_custody_receipts', 'invalidated_at', 'UPDATE'
      )
  `), "raw service mutation privileges reopened");
}

async function correctionFor(db, custody, occurredAt) {
  const replacement = await custodyAuthority(db, custody, ids.newVersion);
  return {
    schema_version: "ctrl.prepared-intelligence-custody-correction.r29",
    correction_id: ids.correction,
    workspace_id: ids.workspace,
    custody_principal_id: custody,
    subject_id: ids.subject,
    audience: "person_private",
    purpose: "prepared_intelligence",
    correction_mode: "replaced",
    affected_authority_kind: "brain_item_version",
    affected_authority_record_id: ids.oldVersion,
    replacement_authority_record_id: ids.newVersion,
    replacement_authority_version: replacement.authority_version,
    replacement_authority_sha256: replacement.authority_sha256,
    request_sha256: "4".repeat(64),
    occurred_at: occurredAt,
  };
}

async function correctAsService(db, correction) {
  return asRole(db, "service_role", () => scalar(db,
    "select private.brain_invalidate_both_prepared_generations_for_correction($1::jsonb)",
    [JSON.stringify(correction)],
  ));
}

async function eraseAsService(db, custody, occurredAt) {
  const erasure = {
    schema_version: "ctrl.prepared-intelligence-custody-subject-erasure.r30",
    erasure_id: ids.erasure,
    workspace_id: ids.workspace,
    custody_principal_id: custody,
    subject_id: ids.subject,
    request_sha256: "5".repeat(64),
    occurred_at: occurredAt,
  };
  const result = await asRole(db, "service_role", () => scalar(db,
    "select private.brain_erase_both_prepared_generations($1::jsonb)",
    [JSON.stringify(erasure)],
  ));
  return { erasure, result };
}

async function erasedState(db) {
  return scalar(db, `
    select jsonb_build_object(
      'legacy_receipts', (select count(*)::int from public.brain_prepared_receipts
        where workspace_id = $1::uuid),
      'custody_receipts', (select count(*)::int from public.brain_prepared_custody_receipts
        where workspace_id = $1::uuid),
      'payloads_destroyed', (
        (select bool_and(payload_ciphertext is null and encryption_version is null
          and erased_at is not null) from public.brain_prepared_receipts
          where workspace_id = $1::uuid)
        and
        (select bool_and(payload_ciphertext is null and encryption_version is null
          and erased_at is not null) from public.brain_prepared_custody_receipts
          where workspace_id = $1::uuid)
      ),
      'dependencies', (
        (select count(*) from public.brain_prepared_receipt_dependencies
          where workspace_id = $1::uuid)
        +
        (select count(*) from public.brain_prepared_custody_receipt_dependencies
          where workspace_id = $1::uuid)
      )::int,
      'erased_events', (
        (select count(*) from public.brain_prepared_receipt_events event_row
          join public.brain_prepared_receipts receipt_row on receipt_row.id = event_row.receipt_id
          where receipt_row.workspace_id = $1::uuid and event_row.event_type = 'erased')
        +
        (select count(*) from public.brain_prepared_custody_receipt_events event_row
          join public.brain_prepared_custody_receipts receipt_row on receipt_row.id = event_row.receipt_id
          where receipt_row.workspace_id = $1::uuid and event_row.event_type = 'erased')
      )::int
    )
  `, [ids.workspace]);
}

async function runLifecycle(cutoverSql = cutover) {
  const db = await createDatabase(cutoverSql);
  const checks = [];
  try {
    const custody = await custodyId(db);
    const now = Date.now();
    const at = (offset) => new Date(now + offset).toISOString();
    const expiresAt = at(30 * 86_400_000);

    const legacy = await storeLegacyBeforeCutover(db, at(-10 * 60_000), expiresAt);
    assert(legacy.status === "created", "legacy history fixture was not created");
    await db.exec(cutoverSql);
    await assertFinalBoundary(db);
    checks.push("final_service_capability_boundary_rechecked");

    const oldCustodyEnvelope = await custodyEnvelope(db, custody, {
      receiptId: ids.oldCustodyReceipt,
      versionId: ids.oldVersion,
      ingestKey: "r33-old-custody",
      marker: "2",
      producedAt: at(-9 * 60_000),
      expiresAt,
    });
    const oldCustody = await storeCustodyAsService(db, oldCustodyEnvelope);
    assert(oldCustody.status === "created", "post-cutover custody create failed");
    const beforeCorrection = await readAsService(db, custody);
    assert(beforeCorrection.status === "current" && beforeCorrection.item_count === 2,
      "unified reader did not return exact legacy and custody material");
    assert(beforeCorrection.items.some((item) => item.receipt_id === ids.legacyReceipt),
      "legacy material disappeared after cutover");
    assert(beforeCorrection.items.some((item) => item.receipt_id === ids.oldCustodyReceipt),
      "custody material disappeared after cutover");
    checks.push("valid_custody_create_and_two_generation_read");

    const correction = await correctionFor(db, custody, at(-5 * 60_000));
    const corrected = await correctAsService(db, correction);
    assert(corrected.status === "invalidated", "valid correction did not execute");
    assert(corrected.legacy_affected_receipt_count === 1,
      "correction missed retained legacy material");
    assert(corrected.custody_affected_receipt_count === 1,
      "correction missed custody material");
    const correctionReplay = await correctAsService(db, correction);
    assert(correctionReplay.status === "idempotent" && correctionReplay.affected_receipt_count === 2,
      "correction replay was not idempotent");
    const afterCorrection = await readAsService(db, custody);
    assert(afterCorrection.status === "empty" && afterCorrection.item_count === 0,
      "corrected-out material remained readable");
    checks.push("both_generations_corrected_atomically_and_hidden");
    checks.push("correction_replay_idempotent");

    const newCustodyEnvelope = await custodyEnvelope(db, custody, {
      receiptId: ids.newCustodyReceipt,
      versionId: ids.newVersion,
      ingestKey: "r33-replacement-custody",
      marker: "3",
      producedAt: at(-4 * 60_000),
      expiresAt,
    });
    const newCustody = await storeCustodyAsService(db, newCustodyEnvelope);
    assert(newCustody.status === "created", "replacement-authority create failed");
    const afterReplacement = await readAsService(db, custody);
    assert(afterReplacement.status === "current" && afterReplacement.item_count === 1,
      "replacement material was not the exact current projection");
    assert(afterReplacement.items[0].receipt_id === ids.newCustodyReceipt,
      "reader returned material outside replacement authority");
    checks.push("replacement_authority_material_became_current");

    const { erasure, result: erased } = await eraseAsService(db, custody, at(-60_000));
    assert(erased.status === "erased", "valid stable erasure did not execute");
    assert(erased.legacy_erased_receipt_count === 1, "legacy erasure count drifted");
    assert(erased.custody_erased_receipt_count === 2, "custody erasure count drifted");
    const erasureReplay = await asRole(db, "service_role", () => scalar(db,
      "select private.brain_erase_both_prepared_generations($1::jsonb)",
      [JSON.stringify(erasure)],
    ));
    assert(erasureReplay.status === "idempotent" && erasureReplay.erased_receipt_count === 3,
      "erasure replay was not idempotent");
    const afterErasure = await readAsService(db, custody);
    assert(afterErasure.status === "erased" && afterErasure.item_count === 0,
      "erased Brain retained readable prepared material");
    const destruction = await erasedState(db);
    assert(destruction.legacy_receipts === 1 && destruction.custody_receipts === 2,
      "erasure changed receipt identity or count");
    assert(destruction.payloads_destroyed === true && destruction.dependencies === 0,
      "erasure left recoverable payload or dependency material");
    assert(destruction.erased_events === 3, "erasure did not leave one final event per receipt");
    checks.push("both_generations_erased_with_identity_preserved");
    checks.push("payload_and_dependencies_destroyed");
    checks.push("erasure_replay_idempotent_and_reader_reports_erased");

    checks.push(await expectFailure(
      () => asRole(db, "service_role", () => db.query(
        "select private.brain_store_prepared_receipt('{}'::jsonb, '[]'::jsonb)",
      )),
      "permission denied",
      "legacy_create_after_lifecycle",
    ));
    checks.push(await expectFailure(
      () => asRole(db, "service_role", () => db.query(`
        insert into public.brain_prepared_custody_receipts(
          id, workspace_id, custody_principal_id, subject_id, ingest_key, request_sha256,
          kind, audience, purpose, authority_fingerprint, content_fingerprint,
          payload_ciphertext, encryption_version, produced_at, expires_at
        ) values (
          gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, 'bypass', $4,
          'prepared_intelligence', 'person_private', 'prepared_intelligence', $4, $4,
          'bypass', 2, now(), now() + interval '1 day'
        )
      `, [ids.workspace, custody, ids.subject, "f".repeat(64)])),
      "permission denied",
      "raw_insert_after_lifecycle",
    ));
    checks.push(await expectFailure(
      () => asRole(db, "service_role", () => db.query(`
        update public.brain_prepared_custody_receipts
        set invalidated_at = null where id = $1::uuid
      `, [ids.newCustodyReceipt])),
      "permission denied",
      "raw_revival_after_erasure",
    ));
    await assertFinalBoundary(db);
    checks.push("final_boundary_unchanged_after_lifecycle");

    return {
      status: "pass",
      runtime: "@electric-sql/pglite@0.5.8",
      postgres: (await db.query("show server_version")).rows[0].server_version,
      checks,
      observed: {
        before_correction_items: beforeCorrection.item_count,
        correction_legacy_count: corrected.legacy_affected_receipt_count,
        correction_custody_count: corrected.custody_affected_receipt_count,
        after_correction_items: afterCorrection.item_count,
        replacement_items: afterReplacement.item_count,
        erased_legacy_count: erased.legacy_erased_receipt_count,
        erased_custody_count: erased.custody_erased_receipt_count,
        final_reader_status: afterErasure.status,
        final_item_count: afterErasure.item_count,
        final_erased_events: destruction.erased_events,
      },
    };
  } finally {
    await db.close();
  }
}

async function mutationMustFail(sql, label) {
  try {
    await runLifecycle(sql);
  } catch {
    return `${label}:failed_as_required`;
  }
  throw new Error(`[g25-post-cutover-lifecycle-r33] mutation survived: ${label}`);
}

const result = await runLifecycle();
result.negative_controls = {
  legacy_reopen: await mutationMustFail(replaceOnce(
    cutover,
    "revoke execute on function private.brain_store_prepared_receipt(jsonb, jsonb)\n  from service_role;",
    "grant execute on function private.brain_store_prepared_receipt(jsonb, jsonb)\n  to service_role;",
  ), "legacy_create_reopened"),
  custody_invoker: await mutationMustFail(replaceOnce(
    cutover,
    "alter function private.brain_store_prepared_custody_receipt(jsonb, jsonb)\n  security definer;",
    "alter function private.brain_store_prepared_custody_receipt(jsonb, jsonb)\n  security invoker;",
  ), "custody_writer_definer_removed"),
  correction_invoker: await mutationMustFail(replaceOnce(
    cutover,
    "alter function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)\n  security definer;",
    "alter function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)\n  security invoker;",
  ), "correction_definer_removed"),
  reader_closed: await mutationMustFail(replaceOnce(
    cutover,
    "grant execute on function private.brain_read_current_prepared_intelligence(jsonb)\n  to service_role;",
    "revoke execute on function private.brain_read_current_prepared_intelligence(jsonb)\n  from service_role;",
  ), "unified_reader_closed"),
  erasure_closed: await mutationMustFail(replaceOnce(
    cutover,
    "grant execute on function private.brain_erase_both_prepared_generations(jsonb)\n  to service_role;",
    "revoke execute on function private.brain_erase_both_prepared_generations(jsonb)\n  from service_role;",
  ), "both_generation_erasure_closed"),
  raw_insert_reopened: await mutationMustFail(replaceOnce(
    cutover,
    "revoke insert on table public.brain_prepared_custody_receipts from service_role;",
    "grant insert on table public.brain_prepared_custody_receipts to service_role;",
  ), "raw_custody_insert_reopened"),
};

console.log(JSON.stringify(result, null, 2));
