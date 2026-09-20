import { createHash, webcrypto } from "node:crypto";
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
const candidate = read("supabase/candidates/g25_prepared_custody_cipher_admission_r27.sql");

const ids = {
  subject: "12000000-0000-4000-8000-000000000001",
  operator: "12000000-0000-4000-8000-000000000002",
  workspace: "23000000-0000-4000-8000-000000000001",
  item: "34000000-0000-4000-8000-000000000001",
  version: "45000000-0000-4000-8000-000000000001",
  receipt: "56000000-0000-4000-8000-000000000001",
  grant: "78000000-0000-4000-8000-000000000001",
};

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function cipherContext(scope) {
  return JSON.stringify({
    v: 2,
    schema_version: "ctrl.brain-prepared-custody-cipher-context.r26",
    workspace_id: scope.workspace_id.toLowerCase(),
    custody_principal_id: scope.custody_principal_id.toLowerCase(),
    subject_id: scope.subject_id.toLowerCase(),
    record_kind: "prepared_custody_receipt",
    record_id: scope.receipt_id.toLowerCase(),
    field: "payload",
    audience: scope.audience,
    purpose: scope.purpose,
    authority_fingerprint: scope.authority_fingerprint,
  });
}

async function encryptPayload(plaintext, scope, keyBytes) {
  const aad = cipherContext(scope);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await webcrypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(aad), tagLength: 128 },
    key,
    new TextEncoder().encode(plaintext),
  );
  return JSON.stringify({
    v: 2,
    alg: "A256GCM",
    kid: "custody-v2",
    iv: base64Url(iv),
    ciphertext: base64Url(new Uint8Array(encrypted)),
    aad_sha256: sha256(aad),
  });
}

async function decryptPayload(envelope, scope, keyBytes) {
  const parsed = JSON.parse(envelope);
  const decode = (value) => Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const key = await webcrypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await webcrypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: decode(parsed.iv),
      additionalData: new TextEncoder().encode(cipherContext(scope)),
      tagLength: 128,
    },
    key,
    decode(parsed.ciphertext),
  );
  return new TextDecoder().decode(plaintext);
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
      ('${ids.subject}', 'r27-subject@example.test'),
      ('${ids.operator}', 'r27-operator@example.test');
    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values
      ('${ids.workspace}', '${ids.subject}', '${ids.operator}', 'r27-cipher-admission');
    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values
      ('${ids.workspace}', '${ids.operator}', 'owner', '${ids.operator}');
    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose, granted_by
    ) values (
      '${ids.grant}', '${ids.workspace}', '${ids.operator}', 'person_private',
      'prepared_intelligence', '${ids.operator}'
    );
    insert into public.brain_items(
      id, workspace_id, subject_id, item_key, semantic_type, created_by
    ) values (
      '${ids.item}', '${ids.workspace}', '${ids.subject}', 'judgement:quality', 'judgement', '${ids.operator}'
    );
    insert into public.brain_item_versions(
      id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
      encryption_version, human_views, epistemic_basis, maturity, standing, audience,
      consequence_permission, applicability, exclusions, evidence_quality, corroboration,
      recency, transfer, human_confirmation, valid_from, recorded_at, created_by
    ) values (
      '${ids.version}', '${ids.item}', '${ids.workspace}', '${ids.subject}', 1,
      'Human owns the last mile', 'ciphertext:item', 1, array['founder'], 'direct_statement',
      'established', 'current', 'person_private', 'advisory', '{}'::jsonb, '[]'::jsonb,
      0.9, 0.8, 0.9, 0.8, 1.0, '2026-09-17T08:00:00Z', '2026-09-17T08:30:00Z', '${ids.operator}'
    );
  `);
  for (const sql of overlays) await db.exec(sql);
  await db.exec(candidateSql);
  return db;
}

async function store(db, receipt, dependencies) {
  return (await db.query(
    "select private.brain_store_prepared_custody_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  )).rows[0].result;
}

async function runScenario(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  try {
    const custody = (await db.query(
      "select id from private.brain_custody_principals where workspace_id = $1",
      [ids.workspace],
    )).rows[0].id;
    const authority = (await db.query(`
      select private.brain_current_prepared_custody_authority(
        'brain_item_version', $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        'person_private', 'prepared_intelligence'
      ) as value
    `, [ids.version, ids.workspace, custody, ids.subject])).rows[0].value;
    const dependency = {
      authority_kind: authority.authority_kind,
      authority_record_id: authority.authority_record_id,
      authority_version: authority.authority_version,
      authority_sha256: authority.authority_sha256,
      observed_at: "2026-09-17T08:45:00Z",
      workspace_id: ids.workspace,
      custody_principal_id: custody,
      subject_id: ids.subject,
      audience: "person_private",
      purpose: "prepared_intelligence",
    };
    const keyBytes = Uint8Array.from({ length: 32 }, (_, index) => index + 1);

    async function makeReceipt(receiptId, ingestKey, overrides = {}, envelopeTransform = (value) => value) {
      const unsigned = {
        schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
        receipt_id: receiptId,
        workspace_id: ids.workspace,
        custody_principal_id: custody,
        subject_id: ids.subject,
        audience: "person_private",
        purpose: "prepared_intelligence",
        dependencies: [dependency],
      };
      const authorityFingerprint = sha256(`prepared-custody-envelope-r24\n${canonicalJson(unsigned)}`);
      const scope = {
        workspace_id: ids.workspace,
        custody_principal_id: custody,
        subject_id: ids.subject,
        receipt_id: receiptId,
        audience: "person_private",
        purpose: "prepared_intelligence",
        authority_fingerprint: authorityFingerprint,
      };
      const payload = await encryptPayload("A decision-grade private payload", scope, keyBytes);
      return {
        receipt: {
          ...unsigned,
          ingest_key: ingestKey,
          request_sha256: "c".repeat(64),
          kind: "prepared_intelligence",
          authority_fingerprint: authorityFingerprint,
          content_fingerprint: sha256("A decision-grade private payload"),
          payload_ciphertext: envelopeTransform(payload),
          encryption_version: 2,
          produced_at: "2026-09-17T09:00:00Z",
          expires_at: "2026-10-17T09:00:00Z",
          ...overrides,
        },
        scope,
      };
    }

    const valid = await makeReceipt(ids.receipt, "r27-valid");
    const databaseAad = (await db.query(`
      select private.brain_prepared_custody_cipher_aad_sha256(
        $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7
      ) as value
    `, [
      valid.scope.workspace_id,
      valid.scope.custody_principal_id,
      valid.scope.subject_id,
      valid.scope.receipt_id,
      valid.scope.audience,
      valid.scope.purpose,
      valid.scope.authority_fingerprint,
    ])).rows[0].value;
    if (databaseAad !== sha256(cipherContext(valid.scope))) {
      throw new Error("R27 database AAD hash differs from the R26 context");
    }

    await db.exec("set role service_role");
    const created = await store(db, valid.receipt, [dependency]);
    if (created.status !== "created") throw new Error("R27 valid envelope was not stored");
    const stored = (await db.query(
      "select payload_ciphertext from public.brain_prepared_custody_receipts where id = $1",
      [ids.receipt],
    )).rows[0].payload_ciphertext;
    if (await decryptPayload(stored, valid.scope, keyBytes) !== "A decision-grade private payload") {
      throw new Error("R27 stored payload did not decrypt under the R26 context");
    }

    const wrongAad = await makeReceipt(
      "56000000-0000-4000-8000-000000000002",
      "r27-wrong-aad",
      {},
      (payload) => JSON.stringify({ ...JSON.parse(payload), aad_sha256: "0".repeat(64) }),
    );
    await expectFailure(
      () => store(db, wrongAad.receipt, [dependency]),
      "custody_cipher_context_mismatch",
      "wrong_aad",
    );

    const legacy = await makeReceipt(
      "56000000-0000-4000-8000-000000000003",
      "r27-legacy-v1",
      {},
      (payload) => JSON.stringify({ ...JSON.parse(payload), v: 1 }),
    );
    await expectFailure(
      () => store(db, legacy.receipt, [dependency]),
      "custody_cipher_envelope_invalid",
      "legacy_v1",
    );

    const extra = await makeReceipt(
      "56000000-0000-4000-8000-000000000004",
      "r27-extra-field",
      {},
      (payload) => JSON.stringify({ ...JSON.parse(payload), owner_id: ids.operator }),
    );
    await expectFailure(
      () => store(db, extra.receipt, [dependency]),
      "custody_cipher_envelope_invalid",
      "extra_envelope_identity",
    );

    const wrongVersion = await makeReceipt(
      "56000000-0000-4000-8000-000000000005",
      "r27-wrong-version",
      { encryption_version: 1 },
    );
    await expectFailure(
      () => store(db, wrongVersion.receipt, [dependency]),
      "custody_cipher_version_invalid",
      "wrong_storage_version",
    );

    const malformed = await makeReceipt(
      "56000000-0000-4000-8000-000000000006",
      "r27-malformed",
      { payload_ciphertext: "not-json" },
    );
    await expectFailure(
      () => store(db, malformed.receipt, [dependency]),
      "custody_cipher_envelope_invalid",
      "malformed_envelope",
    );

    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      cross_language_r26_aad_sha256: true,
      valid_r26_envelope_stored_and_decrypted: true,
      wrong_aad_closed: true,
      legacy_v1_closed: true,
      extra_identity_closed: true,
      wrong_storage_version_closed: true,
      malformed_envelope_closed: true,
    };
  } finally {
    await db.close();
  }
}

async function expectCandidateVeto(candidateSql, expectedFailure, label) {
  try {
    await runScenario(candidateSql);
  } catch (error) {
    if (String(error?.message).includes(expectedFailure)) return `${label}:failed_as_required`;
    throw new Error(`${label} failed for an unexpected reason: ${error?.message}`);
  }
  throw new Error(`${label} negative control unexpectedly passed`);
}

const proof = await runScenario();
const aadNegative = await expectCandidateVeto(
  candidate.replace(
    "if envelope ->> 'aad_sha256' <> expected_aad_sha256 then",
    "if false then",
  ),
  "wrong_aad unexpectedly passed",
  "aad_context_check_removed",
);
const versionNegative = await expectCandidateVeto(
  candidate.replace("if new.encryption_version <> 2 then", "if false then"),
  "wrong_storage_version unexpectedly passed",
  "storage_version_check_removed",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  proof,
  negative_controls: { aadNegative, versionNegative },
}, null, 2)}\n`);
