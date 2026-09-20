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
  "supabase/candidates/g25_prepared_custody_cipher_admission_r27.sql",
].map(read);
const candidate = read("supabase/candidates/g25_both_generation_subject_erasure_r30.sql");

const contexts = {
  target: {
    subject: "13000000-0000-4000-8000-000000000001",
    owner: "13000000-0000-4000-8000-000000000002",
    workspace: "24000000-0000-4000-8000-000000000001",
    grant: "35000000-0000-4000-8000-000000000001",
    item: "46000000-0000-4000-8000-000000000001",
    version: "57000000-0000-4000-8000-000000000001",
    legacyReceipt: "68000000-0000-4000-8000-000000000001",
    custodyReceipt: "68000000-0000-4000-8000-000000000002",
    legacyRevival: "68000000-0000-4000-8000-000000000003",
    custodyRevival: "68000000-0000-4000-8000-000000000004",
    erasure: "79000000-0000-4000-8000-000000000001",
  },
  unrelated: {
    subject: "13000000-0000-4000-8000-000000000011",
    owner: "13000000-0000-4000-8000-000000000012",
    workspace: "24000000-0000-4000-8000-000000000011",
    grant: "35000000-0000-4000-8000-000000000011",
    item: "46000000-0000-4000-8000-000000000011",
    version: "57000000-0000-4000-8000-000000000011",
    legacyReceipt: "68000000-0000-4000-8000-000000000011",
    custodyReceipt: "68000000-0000-4000-8000-000000000012",
  },
  rollback: {
    subject: "13000000-0000-4000-8000-000000000021",
    owner: "13000000-0000-4000-8000-000000000022",
    workspace: "24000000-0000-4000-8000-000000000021",
    grant: "35000000-0000-4000-8000-000000000021",
    item: "46000000-0000-4000-8000-000000000021",
    version: "57000000-0000-4000-8000-000000000021",
    legacyReceipt: "68000000-0000-4000-8000-000000000021",
    custodyReceipt: "68000000-0000-4000-8000-000000000022",
    erasure: "79000000-0000-4000-8000-000000000021",
  },
  legacyBridge: {
    subject: "13000000-0000-4000-8000-000000000031",
    owner: "13000000-0000-4000-8000-000000000032",
    workspace: "24000000-0000-4000-8000-000000000031",
    grant: "35000000-0000-4000-8000-000000000031",
    item: "46000000-0000-4000-8000-000000000031",
    version: "57000000-0000-4000-8000-000000000031",
    legacyReceipt: "68000000-0000-4000-8000-000000000031",
    custodyReceipt: "68000000-0000-4000-8000-000000000032",
    legacyErasure: "79000000-0000-4000-8000-000000000031",
    erasure: "79000000-0000-4000-8000-000000000032",
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-both-generation-subject-erasure-r30] ${message}`);
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

async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

async function seedBase(db) {
  for (const [name, context] of Object.entries(contexts)) {
    await db.query(
      "insert into auth.users(id, email) values ($1::uuid, $2), ($3::uuid, $4)",
      [
        context.subject,
        `r30-${name}-subject@example.test`,
        context.owner,
        `r30-${name}-owner@example.test`,
      ],
    );
    await db.query(`
      insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key)
      values ($1::uuid, $2::uuid, $3::uuid, $4)
    `, [context.workspace, context.subject, context.owner, `r30-${name}`]);
    await db.query(`
      insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by)
      values ($1::uuid, $2::uuid, 'owner', $2::uuid)
    `, [context.workspace, context.owner]);
    await db.query(`
      insert into public.brain_audience_grants(
        id, workspace_id, grantee_user_id, audience, purpose, granted_by
      ) values (
        $1::uuid, $2::uuid, $3::uuid, 'person_private', 'prepared_intelligence', $3::uuid
      )
    `, [context.grant, context.workspace, context.owner]);
    await db.query(`
      insert into public.brain_items(
        id, workspace_id, subject_id, item_key, semantic_type, created_by
      ) values ($1::uuid, $2::uuid, $3::uuid, $4, 'judgement', $5::uuid)
    `, [context.item, context.workspace, context.subject, `judgement:${name}`, context.owner]);
    await db.query(`
      insert into public.brain_item_versions(
        id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
        encryption_version, human_views, epistemic_basis, maturity, standing, audience,
        consequence_permission, applicability, exclusions, evidence_quality, corroboration,
        recency, transfer, human_confirmation, valid_from, recorded_at, created_by
      ) values (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid, 1, $5, $6, 1,
        array['founder'], 'direct_statement', 'established', 'current', 'person_private',
        'advisory', '{}'::jsonb, '[]'::jsonb, 0.9, 0.9, 0.9, 0.9, 1.0,
        '2026-09-16T08:00:00Z', '2026-09-16T08:01:00Z', $7::uuid
      )
    `, [
      context.version,
      context.item,
      context.workspace,
      context.subject,
      `R30 ${name} judgement`,
      `ciphertext:${name}:authority`,
      context.owner,
    ]);
  }
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const sql of prior) await db.exec(sql);
  await seedBase(db);
  for (const sql of overlays) await db.exec(sql);
  await db.exec(candidateSql);
  return db;
}

async function contextWithCustody(db, context) {
  const custody = await scalar(db, `
    select id from private.brain_custody_principals where workspace_id = $1::uuid
  `, [context.workspace]);
  return { ...context, custody };
}

async function legacyAuthority(db, context) {
  return scalar(db, `
    select private.brain_current_prepared_authority(
      'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence'
    ) as authority
  `, [context.version, context.workspace, context.owner, context.subject]);
}

async function custodyAuthority(db, context) {
  return scalar(db, `
    select private.brain_current_prepared_custody_authority(
      'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence'
    ) as authority
  `, [context.version, context.workspace, context.custody, context.subject]);
}

function dependencyFrom(authority, observedAt) {
  const dependency = { ...authority, observed_at: observedAt };
  delete dependency.recorded_at;
  return dependency;
}

async function storeLegacy(db, context, receiptId, ingestKey, marker) {
  const authority = await legacyAuthority(db, context);
  assert(authority, `legacy authority missing for ${ingestKey}`);
  const producedAt = new Date(Date.now() - 60_000).toISOString();
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const dependencies = [dependencyFrom(authority, producedAt)];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_authority_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [receiptId, context.workspace, context.owner, context.subject, JSON.stringify(dependencies)]);
  const receipt = {
    receipt_id: receiptId,
    workspace_id: context.workspace,
    owner_id: context.owner,
    subject_id: context.subject,
    ingest_key: ingestKey,
    request_sha256: marker.repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: marker.repeat(64),
    payload_ciphertext: `ciphertext:legacy:${ingestKey}`,
    encryption_version: 1,
    produced_at: producedAt,
    expires_at: expiresAt,
  };
  return scalar(db,
    "select private.brain_store_prepared_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

async function storeCustody(db, context, receiptId, ingestKey, marker) {
  const authority = await custodyAuthority(db, context);
  assert(authority, `custody authority missing for ${ingestKey}`);
  const producedAt = new Date(Date.now() - 60_000).toISOString();
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const dependencies = [dependencyFrom(authority, producedAt)];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_custody_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [receiptId, context.workspace, context.custody, context.subject, JSON.stringify(dependencies)]);
  const aadSha256 = await scalar(db, `
    select private.brain_prepared_custody_cipher_aad_sha256(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5
    ) as aad_sha256
  `, [context.workspace, context.custody, context.subject, receiptId, fingerprint]);
  const payloadCiphertext = JSON.stringify({
    v: 2,
    alg: "A256GCM",
    kid: "r30-test-key",
    iv: "c2FmZS1pdi0x",
    ciphertext: "Y2lwaGVydGV4dC1ieXRlcw",
    aad_sha256: aadSha256,
  });
  const receipt = {
    schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
    receipt_id: receiptId,
    workspace_id: context.workspace,
    custody_principal_id: context.custody,
    subject_id: context.subject,
    ingest_key: ingestKey,
    request_sha256: marker.repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: marker.repeat(64),
    payload_ciphertext: payloadCiphertext,
    encryption_version: 2,
    produced_at: producedAt,
    expires_at: expiresAt,
    dependencies,
  };
  return scalar(db,
    "select private.brain_store_prepared_custody_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

async function seedReceipts(db) {
  const resolved = {};
  let marker = 1;
  for (const [name, raw] of Object.entries(contexts)) {
    const context = await contextWithCustody(db, raw);
    resolved[name] = context;
    const legacy = await storeLegacy(
      db, context, context.legacyReceipt, `r30-${name}-legacy`, String(marker),
    );
    marker += 1;
    const custody = await storeCustody(
      db, context, context.custodyReceipt, `r30-${name}-custody`, String(marker),
    );
    marker += 1;
    assert(legacy.status === "created" && custody.status === "created", `${name} receipt seed failed`);
  }
  return resolved;
}

function erasureFor(context, erasureId, marker) {
  return {
    schema_version: "ctrl.prepared-intelligence-custody-subject-erasure.r30",
    erasure_id: erasureId,
    workspace_id: context.workspace,
    custody_principal_id: context.custody,
    subject_id: context.subject,
    request_sha256: marker.repeat(64),
    occurred_at: new Date().toISOString(),
  };
}

async function eraseBoth(db, erasure) {
  return scalar(db,
    "select private.brain_erase_both_prepared_generations($1::jsonb) as result",
    [JSON.stringify(erasure)],
  );
}

async function snapshotContext(db, context) {
  return scalar(db, `
    select jsonb_build_object(
      'legacy_receipts', (select jsonb_agg(to_jsonb(r) order by r.id)
        from public.brain_prepared_receipts r where r.workspace_id = $1::uuid),
      'legacy_dependencies', (select jsonb_agg(to_jsonb(d) order by d.receipt_id)
        from public.brain_prepared_receipt_dependencies d where d.workspace_id = $1::uuid),
      'legacy_events', (select jsonb_agg(to_jsonb(e) order by e.receipt_id, e.event_type)
        from public.brain_prepared_receipt_events e
        join public.brain_prepared_receipts r on r.id = e.receipt_id
        where r.workspace_id = $1::uuid),
      'custody_receipts', (select jsonb_agg(to_jsonb(r) order by r.id)
        from public.brain_prepared_custody_receipts r where r.workspace_id = $1::uuid),
      'custody_dependencies', (select jsonb_agg(to_jsonb(d) order by d.receipt_id)
        from public.brain_prepared_custody_receipt_dependencies d where d.workspace_id = $1::uuid),
      'custody_events', (select jsonb_agg(to_jsonb(e) order by e.receipt_id, e.event_type)
        from public.brain_prepared_custody_receipt_events e
        join public.brain_prepared_custody_receipts r on r.id = e.receipt_id
        where r.workspace_id = $1::uuid)
    ) as snapshot
  `, [context.workspace]);
}

async function assertErased(db, context, label) {
  const state = await scalar(db, `
    select jsonb_build_object(
      'legacy_erased', (select erased_at is not null
        from public.brain_prepared_receipts where id = $1::uuid),
      'legacy_payload_null', (select payload_ciphertext is null and encryption_version is null
        from public.brain_prepared_receipts where id = $1::uuid),
      'legacy_dependencies', (select count(*)::int
        from public.brain_prepared_receipt_dependencies where receipt_id = $1::uuid),
      'legacy_events', (select count(*)::int
        from public.brain_prepared_receipt_events where receipt_id = $1::uuid and event_type = 'erased'),
      'custody_erased', (select erased_at is not null
        from public.brain_prepared_custody_receipts where id = $2::uuid),
      'custody_payload_null', (select payload_ciphertext is null and encryption_version is null
        from public.brain_prepared_custody_receipts where id = $2::uuid),
      'custody_dependencies', (select count(*)::int
        from public.brain_prepared_custody_receipt_dependencies where receipt_id = $2::uuid),
      'custody_events', (select count(*)::int
        from public.brain_prepared_custody_receipt_events where receipt_id = $2::uuid and event_type = 'erased')
    ) as state
  `, [context.legacyReceipt, context.custodyReceipt]);
  assert(state.legacy_erased && state.custody_erased, `${label} erasure timestamps missing`);
  assert(state.legacy_payload_null && state.custody_payload_null, `${label} payload bytes survived`);
  assert(state.legacy_dependencies === 0 && state.custody_dependencies === 0,
    `${label} dependencies survived`);
  assert(state.legacy_events === 1 && state.custody_events === 1,
    `${label} final events are not exact`);
}

async function runPositive(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  const checks = [];
  try {
    await db.exec("set role service_role");
    const resolved = await seedReceipts(db);
    const unrelatedBefore = await snapshotContext(db, resolved.unrelated);

    const mainErasure = erasureFor(resolved.target, contexts.target.erasure, "9");
    const mainResult = await eraseBoth(db, mainErasure);
    assert(mainResult.status === "erased", "main erasure did not execute");
    assert(mainResult.legacy_erased_receipt_count === 1, "legacy erasure count is not exact");
    assert(mainResult.custody_erased_receipt_count === 1, "custody erasure count is not exact");
    assert(mainResult.erased_receipt_count === 2, "combined erasure count is not exact");
    await assertErased(db, resolved.target, "main");
    checks.push("both_generations_erased_exactly");
    checks.push("payload_dependencies_and_prior_events_destroyed");
    checks.push("one_content_free_final_event_per_generation");

    const unrelatedAfter = await snapshotContext(db, resolved.unrelated);
    assert(JSON.stringify(unrelatedBefore) === JSON.stringify(unrelatedAfter),
      "unrelated workspace bytes changed");
    checks.push("unrelated_workspace_preserved_byte_for_byte");

    const replay = await eraseBoth(db, mainErasure);
    assert(replay.status === "idempotent" && replay.erased_receipt_count === 2,
      "exact replay changed the outcome");
    checks.push("exact_replay_idempotent");
    checks.push(await expectFailure(
      () => eraseBoth(db, { ...mainErasure, request_sha256: "a".repeat(64) }),
      "erasure_identity_conflict",
      "conflicting_replay",
    ));
    const already = await eraseBoth(db, {
      ...mainErasure,
      erasure_id: "79000000-0000-4000-8000-000000000099",
      request_sha256: "b".repeat(64),
    });
    assert(already.status === "already_erased" && already.erasure_id === contexts.target.erasure,
      "second identity did not converge on the original erasure");
    checks.push("second_identity_converged_without_rewrite");
    checks.push(await expectFailure(
      () => eraseBoth(db, { ...mainErasure, owner_id: contexts.target.owner }),
      "erasure_shape_invalid",
      "legacy_owner_smuggling",
    ));
    checks.push(await expectFailure(
      () => eraseBoth(db, { ...mainErasure, occurred_at: "2999-01-01T00:00:00.000Z" }),
      "erasure_occurred_in_future",
      "future_erasure_time",
    ));

    checks.push(await expectFailure(
      () => storeLegacy(
        db, resolved.target, contexts.target.legacyRevival, "r30-target-legacy-revival", "c",
      ),
      "prepared_subject_erased",
      "legacy_silent_revival",
    ));
    checks.push(await expectFailure(
      () => storeCustody(
        db, resolved.target, contexts.target.custodyRevival, "r30-target-custody-revival", "d",
      ),
      "prepared_subject_erased",
      "custody_silent_revival",
    ));

    const legacyBridgeErasure = {
      erasure_id: contexts.legacyBridge.legacyErasure,
      workspace_id: resolved.legacyBridge.workspace,
      owner_id: resolved.legacyBridge.owner,
      subject_id: resolved.legacyBridge.subject,
      request_sha256: "e".repeat(64),
      occurred_at: new Date().toISOString(),
    };
    const legacyOnly = await scalar(db,
      "select private.brain_erase_prepared_subject($1::jsonb) as result",
      [JSON.stringify(legacyBridgeErasure)],
    );
    assert(legacyOnly.status === "erased" && legacyOnly.erased_receipt_count === 1,
      "legacy bridge setup failed");
    const custodyBeforeBridge = await scalar(db, `
      select erased_at is null from public.brain_prepared_custody_receipts where id = $1::uuid
    `, [resolved.legacyBridge.custodyReceipt]);
    assert(custodyBeforeBridge, "legacy erasure unexpectedly reached custody generation");
    await db.query(`
      update private.brain_custody_assignments
      set ended_at = greatest(statement_timestamp(), accepted_at)
      where custody_principal_id = $1::uuid and ended_at is null
    `, [resolved.legacyBridge.custody]);
    await db.query(`
      update private.brain_custody_principals
      set closed_at = greatest(statement_timestamp(), created_at),
        closure_authorization_sha256 = $2
      where id = $1::uuid
    `, [resolved.legacyBridge.custody, "f".repeat(64)]);
    const bridgeResult = await eraseBoth(
      db,
      erasureFor(resolved.legacyBridge, contexts.legacyBridge.erasure, "1"),
    );
    assert(bridgeResult.status === "erased" && bridgeResult.erased_receipt_count === 2,
      "stable erasure did not bridge the legacy tombstone");
    await assertErased(db, resolved.legacyBridge, "legacy bridge");
    checks.push("legacy_tombstone_bridged_into_stable_erasure");
    checks.push("closed_custody_remained_erasable");

    await db.exec(`
      reset role;
      create function private.g25_r30_force_custody_event_failure()
      returns trigger language plpgsql set search_path = '' as $$
      begin
        if new.event_type = 'erased'
          and new.receipt_id = '${contexts.rollback.custodyReceipt}'::uuid
        then raise exception 'forced_r30_custody_event_failure'; end if;
        return new;
      end;
      $$;
      create trigger g25_r30_force_custody_event_failure
      before insert on public.brain_prepared_custody_receipt_events
      for each row execute function private.g25_r30_force_custody_event_failure();
      set role service_role;
    `);
    const rollbackErasure = erasureFor(resolved.rollback, contexts.rollback.erasure, "2");
    checks.push(await expectFailure(
      () => eraseBoth(db, rollbackErasure),
      "forced_r30_custody_event_failure",
      "cross_generation_event_failure",
    ));
    const rollbackState = await scalar(db, `
      select jsonb_build_object(
        'legacy_current', (select erased_at is null and payload_ciphertext is not null
          from public.brain_prepared_receipts where id = $1::uuid),
        'custody_current', (select erased_at is null and payload_ciphertext is not null
          from public.brain_prepared_custody_receipts where id = $2::uuid),
        'legacy_dependencies', (select count(*)::int
          from public.brain_prepared_receipt_dependencies where receipt_id = $1::uuid),
        'custody_dependencies', (select count(*)::int
          from public.brain_prepared_custody_receipt_dependencies where receipt_id = $2::uuid),
        'legacy_accepted_event', (select count(*)::int
          from public.brain_prepared_receipt_events where receipt_id = $1::uuid and event_type = 'accepted'),
        'custody_accepted_event', (select count(*)::int
          from public.brain_prepared_custody_receipt_events where receipt_id = $2::uuid and event_type = 'accepted'),
        'tombstones', (select count(*)::int
          from public.brain_prepared_custody_subject_erasure_tombstones
          where erasure_id = $3::uuid)
      ) as state
    `, [resolved.rollback.legacyReceipt, resolved.rollback.custodyReceipt, contexts.rollback.erasure]);
    assert(rollbackState.legacy_current && rollbackState.custody_current,
      "failed operation left an erased receipt");
    assert(rollbackState.legacy_dependencies === 1 && rollbackState.custody_dependencies === 1,
      "failed operation deleted dependencies");
    assert(rollbackState.legacy_accepted_event === 1 && rollbackState.custody_accepted_event === 1,
      "failed operation deleted prior events");
    assert(rollbackState.tombstones === 0, "failed operation left a stable tombstone");
    checks.push("cross_generation_failure_rolled_back_atomically");

    await db.exec("reset role; set role authenticated");
    try {
      checks.push(await expectFailure(
        () => eraseBoth(db, mainErasure),
        "permission denied",
        "ordinary_user_erasure",
      ));
    } finally {
      await db.exec("reset role");
    }

    const security = await scalar(db, `
      select jsonb_build_object(
        'tombstone_rls_forced', (
          select relrowsecurity and relforcerowsecurity from pg_class
          where oid = 'public.brain_prepared_custody_subject_erasure_tombstones'::regclass
        ),
        'erasure_function_definer', (
          select prosecdef from pg_proc
          where oid = 'private.brain_erase_both_prepared_generations(jsonb)'::regprocedure
        ),
        'authenticated_function_closed', not has_function_privilege(
          'authenticated', 'private.brain_erase_both_prepared_generations(jsonb)', 'EXECUTE'
        ),
        'service_function_open', has_function_privilege(
          'service_role', 'private.brain_erase_both_prepared_generations(jsonb)', 'EXECUTE'
        ),
        'service_tombstone_insert_closed', not has_table_privilege(
          'service_role', 'public.brain_prepared_custody_subject_erasure_tombstones', 'INSERT'
        ),
        'service_legacy_payload_update_closed', not has_column_privilege(
          'service_role', 'public.brain_prepared_receipts', 'payload_ciphertext', 'UPDATE'
        ),
        'service_custody_payload_update_closed', not has_column_privilege(
          'service_role', 'public.brain_prepared_custody_receipts', 'payload_ciphertext', 'UPDATE'
        )
      ) as security
    `);
    assert(Object.values(security).every((value) => value === true),
      `schema security failed: ${JSON.stringify(security)}`);
    checks.push("forced_rls_and_service_only_definer_boundary");

    return {
      status: "pass",
      runtime: "@electric-sql/pglite@0.5.8",
      postgres: (await db.query("show server_version")).rows[0].server_version,
      checks,
      counts: {
        main_legacy: mainResult.legacy_erased_receipt_count,
        main_custody: mainResult.custody_erased_receipt_count,
        bridge_total: bridgeResult.erased_receipt_count,
      },
      schema_security: security,
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

const legacyTargetScope = `where receipt_row.workspace_id = workspace_id
      and receipt_row.subject_id = subject_id
      and receipt_row.erased_at is null`;
const legacyUpdateScope = `where receipt_row.id = target.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.subject_id = subject_id;`;
const custodyTargetScope = `where receipt_row.workspace_id = workspace_id
      and receipt_row.custody_principal_id = custody_principal_id
      and receipt_row.subject_id = subject_id
      and receipt_row.erased_at is null`;
const custodyUpdateScope = `where receipt_row.id = target.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.custody_principal_id = custody_principal_id
    and receipt_row.subject_id = subject_id;`;
const stableSeam = `) or exists (
    select 1
    from public.brain_prepared_custody_subject_erasure_tombstones custody_tombstone
    where custody_tombstone.workspace_id = p_workspace_id
      and custody_tombstone.subject_id = p_subject_id
  )`;

const result = await runPositive();
let legacyScopeMutation = candidate.replace(legacyTargetScope, "where receipt_row.erased_at is null");
legacyScopeMutation = legacyScopeMutation.replace(
  legacyUpdateScope,
  "where receipt_row.id = target.id;",
);
let custodyScopeMutation = candidate.replace(custodyTargetScope, "where receipt_row.erased_at is null");
custodyScopeMutation = custodyScopeMutation.replace(
  custodyUpdateScope,
  "where receipt_row.id = target.id;",
);
result.negative_controls = {
  legacy_scope: await mutationMustFail(
    legacyScopeMutation,
    "legacy_subject_scope_removed",
  ),
  custody_scope: await mutationMustFail(
    custodyScopeMutation,
    "custody_subject_scope_removed",
  ),
  payload_destruction: await mutationMustFail(
    replaceNth(candidate, "payload_ciphertext = null,", "payload_ciphertext = receipt_row.payload_ciphertext,", 2),
    "custody_payload_destruction_removed",
  ),
  anti_revival: await mutationMustFail(
    candidate.replace(stableSeam, ")"),
    "stable_anti_revival_seam_removed",
  ),
};

console.log(JSON.stringify(result, null, 2));
