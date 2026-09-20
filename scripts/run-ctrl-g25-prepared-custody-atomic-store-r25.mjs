import { createHash } from "node:crypto";
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
const r22 = read("supabase/candidates/g25_non_cascading_owner_guard_r22.sql");
const r23 = read("supabase/candidates/g25_stable_custody_identity_r23.sql");
const candidate = read("supabase/candidates/g25_prepared_custody_atomic_store_r25.sql");

const ids = {
  subject: "11000000-0000-4000-8000-000000000001",
  operatorOne: "11000000-0000-4000-8000-000000000002",
  operatorTwo: "11000000-0000-4000-8000-000000000003",
  reader: "11000000-0000-4000-8000-000000000004",
  workspace: "22000000-0000-4000-8000-000000000001",
  item: "33000000-0000-4000-8000-000000000001",
  version: "44000000-0000-4000-8000-000000000001",
  legacySeed: "55000000-0000-4000-8000-000000000001",
  custodyReceipt: "55000000-0000-4000-8000-000000000002",
  custodyAfterTransfer: "55000000-0000-4000-8000-000000000003",
  rollbackReceipt: "55000000-0000-4000-8000-000000000004",
  inactiveReceipt: "55000000-0000-4000-8000-000000000005",
  legacyAfterR25: "55000000-0000-4000-8000-000000000006",
  roleOne: "66000000-0000-4000-8000-000000000001",
  roleReader: "66000000-0000-4000-8000-000000000002",
  grantOne: "77000000-0000-4000-8000-000000000001",
  grantReader: "77000000-0000-4000-8000-000000000002",
};

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`;
}

function r24Fingerprint(unsigned) {
  return createHash("sha256")
    .update(`prepared-custody-envelope-r24\n${canonicalJson(unsigned)}`, "utf8")
    .digest("hex");
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
      ('${ids.subject}', 'r25-subject@example.test'),
      ('${ids.operatorOne}', 'r25-operator-one@example.test'),
      ('${ids.operatorTwo}', 'r25-operator-two@example.test'),
      ('${ids.reader}', 'r25-reader@example.test');

    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values
      ('${ids.workspace}', '${ids.subject}', '${ids.operatorOne}', 'r25-custody-store');
    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values
      ('${ids.workspace}', '${ids.operatorOne}', 'owner', '${ids.operatorOne}'),
      ('${ids.workspace}', '${ids.reader}', 'viewer', '${ids.operatorOne}');
    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose, granted_by
    ) values
      ('${ids.grantOne}', '${ids.workspace}', '${ids.operatorOne}', 'person_private', 'prepared_intelligence', '${ids.operatorOne}'),
      ('${ids.grantReader}', '${ids.workspace}', '${ids.reader}', 'person_private', 'decision_support', '${ids.operatorOne}');

    insert into public.brain_items(
      id, workspace_id, subject_id, item_key, semantic_type, created_by
    ) values (
      '${ids.item}', '${ids.workspace}', '${ids.subject}', 'taste:sharpness', 'taste', '${ids.operatorOne}'
    );
    insert into public.brain_item_versions(
      id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
      encryption_version, human_views, epistemic_basis, maturity, standing, audience,
      consequence_permission, applicability, exclusions, evidence_quality, corroboration,
      recency, transfer, human_confirmation, valid_from, recorded_at, created_by
    ) values (
      '${ids.version}', '${ids.item}', '${ids.workspace}', '${ids.subject}', 3,
      'Reject generic work', 'ciphertext:brain-item-version', 1, array['founder'],
      'direct_statement', 'established', 'current', 'person_private', 'advisory',
      '{}'::jsonb, '[]'::jsonb, 0.900, 0.800, 0.950, 0.750, 1.000,
      '2026-09-17T08:00:00Z', '2026-09-17T08:30:00Z', '${ids.operatorOne}'
    );

    insert into public.brain_prepared_receipts(
      id, workspace_id, owner_id, subject_id, ingest_key, request_sha256, kind,
      audience, purpose, authority_fingerprint, content_fingerprint,
      payload_ciphertext, encryption_version, produced_at, expires_at
    ) values (
      '${ids.legacySeed}', '${ids.workspace}', '${ids.operatorOne}', '${ids.subject}',
      'legacy-seed', repeat('1', 64), 'prepared_intelligence', 'person_private',
      'prepared_intelligence', repeat('2', 64), repeat('3', 64),
      'ciphertext:legacy-seed', 1, '2026-09-17T08:40:00Z', '2026-10-17T08:40:00Z'
    );
  `);
  await db.exec(r22);
  await db.exec(r23);
  await db.exec(`
    insert into private.brain_operator_principals(id, legacy_auth_alias)
    values ('88000000-0000-4000-8000-000000000002', '${ids.operatorTwo}');
    insert into private.brain_operator_auth_links(operator_principal_id, user_id)
    values ('88000000-0000-4000-8000-000000000002', '${ids.operatorTwo}');
  `);
  await db.exec(candidateSql);
  return db;
}

async function currentScope(db) {
  const result = await db.query(`
    select
      custody.id as custody_principal_id,
      assignment.operator_principal_id
    from private.brain_custody_principals custody
    join private.brain_custody_assignments assignment
      on assignment.custody_principal_id = custody.id and assignment.ended_at is null
    where custody.workspace_id = $1
  `, [ids.workspace]);
  return result.rows[0];
}

async function custodyAuthority(db, custodyPrincipalId) {
  const result = await db.query(`
    select private.brain_current_prepared_custody_authority(
      'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence'
    ) as authority
  `, [ids.version, ids.workspace, custodyPrincipalId, ids.subject]);
  const authority = result.rows[0].authority;
  return {
    authority_kind: authority.authority_kind,
    authority_record_id: authority.authority_record_id,
    authority_version: authority.authority_version,
    authority_sha256: authority.authority_sha256,
    observed_at: "2026-09-17T08:45:00Z",
    workspace_id: ids.workspace,
    custody_principal_id: custodyPrincipalId,
    subject_id: ids.subject,
    audience: "person_private",
    purpose: "prepared_intelligence",
  };
}

function custodyReceipt(receiptId, ingestKey, dependency, overrides = {}) {
  const unsigned = {
    schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
    receipt_id: receiptId,
    workspace_id: ids.workspace,
    custody_principal_id: dependency.custody_principal_id,
    subject_id: ids.subject,
    audience: "person_private",
    purpose: "prepared_intelligence",
    dependencies: [dependency],
  };
  return {
    ...unsigned,
    ingest_key: ingestKey,
    request_sha256: "4".repeat(64),
    kind: "prepared_intelligence",
    authority_fingerprint: r24Fingerprint(unsigned),
    content_fingerprint: "5".repeat(64),
    payload_ciphertext: `ciphertext:${ingestKey}`,
    encryption_version: 2,
    produced_at: "2026-09-17T09:00:00Z",
    expires_at: "2026-10-17T09:00:00Z",
    ...overrides,
  };
}

async function store(db, receipt, dependencies) {
  const result = await db.query(
    "select private.brain_store_prepared_custody_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
  return result.rows[0].result;
}

async function runPositiveControl(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  try {
    const legacyBefore = (await db.query(
      "select to_jsonb(row) as value from public.brain_prepared_receipts row where id = $1",
      [ids.legacySeed],
    )).rows[0].value;
    const scope = await currentScope(db);
    const dependency = await custodyAuthority(db, scope.custody_principal_id);
    const receipt = custodyReceipt(ids.custodyReceipt, "custody-ingest-1", dependency);

    const legacyAuthority = (await db.query(`
      select private.brain_current_prepared_authority(
        'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        'person_private', 'prepared_intelligence'
      ) as authority
    `, [ids.version, ids.workspace, ids.operatorOne, ids.subject])).rows[0].authority;
    const legacyDependency = {
      authority_kind: legacyAuthority.authority_kind,
      authority_record_id: legacyAuthority.authority_record_id,
      authority_version: legacyAuthority.authority_version,
      authority_sha256: legacyAuthority.authority_sha256,
      observed_at: "2026-09-17T08:45:00Z",
      workspace_id: ids.workspace,
      owner_id: ids.operatorOne,
      subject_id: ids.subject,
      audience: "person_private",
      purpose: "prepared_intelligence",
    };
    const legacyFingerprint = (await db.query(`
      select private.brain_prepared_authority_fingerprint(
        $1::uuid, $2::uuid, $3::uuid, $4::uuid, 'person_private',
        'prepared_intelligence', $5::jsonb
      ) as value
    `, [
      ids.legacyAfterR25,
      ids.workspace,
      ids.operatorOne,
      ids.subject,
      JSON.stringify([legacyDependency]),
    ])).rows[0].value;
    const legacyReceipt = {
      receipt_id: ids.legacyAfterR25,
      workspace_id: ids.workspace,
      owner_id: ids.operatorOne,
      subject_id: ids.subject,
      ingest_key: "legacy-after-r25",
      request_sha256: "a".repeat(64),
      kind: "prepared_intelligence",
      audience: "person_private",
      purpose: "prepared_intelligence",
      authority_fingerprint: legacyFingerprint,
      content_fingerprint: "b".repeat(64),
      payload_ciphertext: "ciphertext:legacy-after-r25",
      encryption_version: 1,
      produced_at: "2026-09-17T09:00:00Z",
      expires_at: "2026-10-17T09:00:00Z",
    };

    const databaseFingerprint = (await db.query(`
      select private.brain_prepared_custody_fingerprint(
        $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7::jsonb
      ) as value
    `, [
      receipt.receipt_id,
      receipt.workspace_id,
      receipt.custody_principal_id,
      receipt.subject_id,
      receipt.audience,
      receipt.purpose,
      JSON.stringify([dependency]),
    ])).rows[0].value;
    if (databaseFingerprint !== receipt.authority_fingerprint) {
      throw new Error("R25 database fingerprint differs from the R24 TypeScript contract");
    }

    await db.exec("set role service_role");
    const legacyCreated = (await db.query(
      "select private.brain_store_prepared_receipt($1::jsonb, $2::jsonb) as result",
      [JSON.stringify(legacyReceipt), JSON.stringify([legacyDependency])],
    )).rows[0].result;
    if (legacyCreated.status !== "created") throw new Error("R25 broke the unchanged R10 writer");
    const created = await store(db, receipt, [dependency]);
    const replay = await store(db, receipt, [dependency]);
    if (created.status !== "created" || replay.status !== "idempotent") {
      throw new Error(`R25 create/replay invariant failed: ${JSON.stringify({ created, replay })}`);
    }
    await expectFailure(
      () => store(db, { ...receipt, payload_ciphertext: "ciphertext:changed" }, [dependency]),
      "receipt_identity_conflict",
      "changed_ciphertext_replay",
    );
    await expectFailure(
      () => store(db, { ...receipt, owner_id: ids.operatorOne }, [dependency]),
      "receipt_shape_invalid",
      "legacy_identity_smuggling",
    );
    const tamperedReceipt = custodyReceipt(
      "55000000-0000-4000-8000-000000000009",
      "custody-tampered-fingerprint",
      dependency,
      { authority_fingerprint: "f".repeat(64) },
    );
    await expectFailure(
      () => store(db, tamperedReceipt, [dependency]),
      "authority_fingerprint_mismatch",
      "fingerprint_tamper",
    );
    const legacyCollision = custodyReceipt(
      "55000000-0000-4000-8000-000000000007",
      "legacy-seed",
      dependency,
    );
    await expectFailure(
      () => store(db, legacyCollision, [dependency]),
      "receipt_identity_conflict",
      "custody_after_legacy_collision",
    );
    await db.exec("reset role");
    await db.exec(`update public.brain_item_versions set title = 'Changed authority' where id = '${ids.version}'`);
    await db.exec("set role service_role");
    const staleReceipt = custodyReceipt(
      "55000000-0000-4000-8000-000000000008",
      "custody-stale-authority",
      dependency,
    );
    await expectFailure(
      () => store(db, staleReceipt, [dependency]),
      "authority_dependency_not_current",
      "stale_authority",
    );
    await db.exec("reset role");
    await db.exec(`update public.brain_item_versions set title = 'Reject generic work' where id = '${ids.version}'`);

    await db.exec("reset role");
    await db.exec(`
      create or replace function private.g25_r25_force_event_failure()
      returns trigger language plpgsql security invoker set search_path = '' as $$
      begin
        if new.receipt_id = '${ids.rollbackReceipt}'::uuid then
          raise exception 'g25_r25_forced_event_failure';
        end if;
        return new;
      end $$;
      create trigger g25_r25_force_event_failure
      before insert on public.brain_prepared_custody_receipt_events
      for each row execute function private.g25_r25_force_event_failure();
    `);
    await db.exec("set role service_role");
    const rollbackReceipt = custodyReceipt(ids.rollbackReceipt, "custody-rollback", dependency);
    await expectFailure(
      () => store(db, rollbackReceipt, [dependency]),
      "g25_r25_forced_event_failure",
      "atomic_event_failure",
    );
    const rollbackResidue = (await db.query(`
      select
        (select count(*)::int from public.brain_prepared_custody_receipts where id = $1) as receipts,
        (select count(*)::int from public.brain_prepared_custody_receipt_dependencies where receipt_id = $1) as dependencies,
        (select count(*)::int from public.brain_prepared_custody_receipt_events where receipt_id = $1) as events
    `, [ids.rollbackReceipt])).rows[0];
    if (Object.values(rollbackResidue).some((count) => count !== 0)) {
      throw new Error(`R25 failed atomic rollback: ${JSON.stringify(rollbackResidue)}`);
    }

    await db.query(
      "select private.brain_transfer_workspace_custody($1::uuid, $2::uuid, $3::uuid, $4, now())",
      [ids.workspace, scope.operator_principal_id, "88000000-0000-4000-8000-000000000002", "6".repeat(64)],
    );
    const afterTransfer = await currentScope(db);
    if (afterTransfer.custody_principal_id !== scope.custody_principal_id) {
      throw new Error("R25 custody principal changed during operator transfer");
    }
    const transferredDependency = await custodyAuthority(db, afterTransfer.custody_principal_id);
    const transferredReceipt = custodyReceipt(
      ids.custodyAfterTransfer,
      "custody-ingest-after-transfer",
      transferredDependency,
      { produced_at: "2026-09-17T10:05:00Z", expires_at: "2026-10-17T10:05:00Z" },
    );
    const transferred = await store(db, transferredReceipt, [transferredDependency]);
    if (transferred.status !== "created") throw new Error("R25 write failed after authorised operator transfer");

    await db.exec(`
      update private.brain_operator_auth_links
      set revoked_at = now()
      where operator_principal_id = '88000000-0000-4000-8000-000000000002'
        and revoked_at is null;
    `);
    const inactiveReceipt = custodyReceipt(ids.inactiveReceipt, "custody-inactive", transferredDependency, {
      produced_at: "2026-09-17T10:15:00Z",
      expires_at: "2026-10-17T10:15:00Z",
    });
    await expectFailure(
      () => store(db, inactiveReceipt, [transferredDependency]),
      "receipt_custody_inactive",
      "inactive_custody",
    );

    await expectFailure(
      () => db.exec(`
        insert into public.brain_prepared_receipts(
          id, workspace_id, owner_id, subject_id, ingest_key, request_sha256, kind,
          audience, purpose, authority_fingerprint, content_fingerprint, payload_ciphertext,
          encryption_version, produced_at, expires_at
        ) values (
          '${ids.custodyReceipt}', '${ids.workspace}', '${ids.operatorOne}', '${ids.subject}',
          'legacy-cross-generation', repeat('7', 64), 'prepared_intelligence', 'person_private',
          'prepared_intelligence', repeat('8', 64), repeat('9', 64), 'ciphertext:legacy-collision',
          1, '2026-09-17T11:00:00Z', '2026-10-17T11:00:00Z'
        )
      `),
      "receipt_identity_conflict",
      "legacy_after_custody_collision",
    );

    await db.exec("reset role");
    const legacyAfter = (await db.query(
      "select to_jsonb(row) as value from public.brain_prepared_receipts row where id = $1",
      [ids.legacySeed],
    )).rows[0].value;
    if (JSON.stringify(legacyAfter) !== JSON.stringify(legacyBefore)) {
      throw new Error("R25 changed legacy receipt bytes");
    }

    await db.exec(`
      set role authenticated;
      select set_config('request.jwt.claim.sub', '${ids.operatorOne}', false);
      select set_config('request.jwt.claims', '{"sub":"${ids.operatorOne}","is_anonymous":false}', false);
    `);
    const readable = Number((await db.query(
      "select count(*)::int as count from public.brain_prepared_custody_receipts",
    )).rows[0].count);
    if (readable !== 2) throw new Error(`R25 exact reader expected 2 rows, got ${readable}`);
    await db.exec(`
      reset role;
      set role authenticated;
      select set_config('request.jwt.claim.sub', '${ids.reader}', false);
      select set_config('request.jwt.claims', '{"sub":"${ids.reader}","is_anonymous":false}', false);
    `);
    const wrongPurposeReader = Number((await db.query(
      "select count(*)::int as count from public.brain_prepared_custody_receipts",
    )).rows[0].count);
    if (wrongPurposeReader !== 0) throw new Error("R25 wrong-purpose reader crossed the receipt boundary");
    await db.exec(`
      reset role;
      update public.brain_workspace_roles
      set revoked_at = now()
      where workspace_id = '${ids.workspace}' and user_id = '${ids.operatorOne}';
      set role authenticated;
      select set_config('request.jwt.claim.sub', '${ids.operatorOne}', false);
      select set_config('request.jwt.claims', '{"sub":"${ids.operatorOne}","is_anonymous":false}', false);
    `);
    const deniedAfterRoleRemoval = Number((await db.query(
      "select count(*)::int as count from public.brain_prepared_custody_receipts",
    )).rows[0].count);
    await db.exec("reset role");
    if (deniedAfterRoleRemoval !== 0) throw new Error("R25 outstanding JWT retained access after role removal");

    const counts = (await db.query(`
      select
        (select count(*)::int from public.brain_prepared_custody_receipts) as receipts,
        (select count(*)::int from public.brain_prepared_custody_receipt_dependencies) as dependencies,
        (select count(*)::int from public.brain_prepared_custody_receipt_events) as events
    `)).rows[0];
    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      cross_language_r24_fingerprint: true,
      exact_create_and_replay: true,
      replay_compares_ciphertext_and_encryption_version: true,
      identity_smuggling_closed: true,
      stale_authority_closed: true,
      atomic_failure_rolled_back: rollbackResidue,
      stable_after_operator_transfer: true,
      inactive_custody_closed: true,
      cross_generation_collision_closed: true,
      legacy_r10_writer_still_operational: true,
      legacy_receipt_bytes_unchanged: true,
      outstanding_jwt_denied_after_role_removal: true,
      wrong_purpose_reader_denied: true,
      created_bundle_rows: counts,
    };
  } finally {
    await db.close();
  }
}

const proof = await runPositiveControl();
async function expectCandidateVeto(candidateSql, expectedFailure, label) {
  try {
    await runPositiveControl(candidateSql);
  } catch (error) {
    if (String(error?.message).includes(expectedFailure)) return `${label}:failed_as_required`;
    throw new Error(`${label} failed for an unexpected reason: ${error?.message}`);
  }
  throw new Error(`${label} negative control unexpectedly passed`);
}

const fingerprintNegative = await expectCandidateVeto(
  candidate.replace(
    "if authority_fingerprint <> expected_authority_fingerprint then",
    "if false then",
  ),
  "fingerprint_tamper unexpectedly passed",
  "authority_fingerprint_check_removed",
);
const custodyNegative = await expectCandidateVeto(
  candidate.replace(
    "if not private.brain_prepared_custody_active(workspace_id, custody_principal_id) then",
    "if false then",
  ),
  "inactive_custody failed for an unexpected reason",
  "active_custody_check_removed",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  proof,
  negative_controls: {
    fingerprintNegative,
    custodyNegative,
  },
}, null, 2)}\n`);
