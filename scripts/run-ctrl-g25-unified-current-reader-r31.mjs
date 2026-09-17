import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const foundations = [
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
  "supabase/candidates/g25_both_generation_correction_r29.sql",
  "supabase/candidates/g25_both_generation_subject_erasure_r30.sql",
].map(read);
const candidate = read("supabase/candidates/g25_unified_current_prepared_reader_r31.sql");
const scenarioNow = Date.now();

const contexts = {
  active: {
    subject: "13100000-0000-4000-8000-000000000001",
    owner: "13100000-0000-4000-8000-000000000002",
    workspace: "24100000-0000-4000-8000-000000000001",
    grant: "35100000-0000-4000-8000-000000000001",
    item: "46100000-0000-4000-8000-000000000001",
    version: "57100000-0000-4000-8000-000000000001",
  },
  erased: {
    subject: "13100000-0000-4000-8000-000000000011",
    owner: "13100000-0000-4000-8000-000000000012",
    workspace: "24100000-0000-4000-8000-000000000011",
    grant: "35100000-0000-4000-8000-000000000011",
    item: "46100000-0000-4000-8000-000000000011",
    version: "57100000-0000-4000-8000-000000000011",
    legacyReceipt: "68100000-0000-4000-8000-000000000011",
    custodyReceipt: "68100000-0000-4000-8000-000000000012",
    erasure: "79100000-0000-4000-8000-000000000011",
  },
  closed: {
    subject: "13100000-0000-4000-8000-000000000021",
    owner: "13100000-0000-4000-8000-000000000022",
    workspace: "24100000-0000-4000-8000-000000000021",
    grant: "35100000-0000-4000-8000-000000000021",
    item: "46100000-0000-4000-8000-000000000021",
    version: "57100000-0000-4000-8000-000000000021",
  },
};

const activeReceipts = {
  currentLegacy: "68100000-0000-4000-8000-000000000101",
  currentCustody: "68100000-0000-4000-8000-000000000102",
  duplicateLegacy: "68100000-0000-4000-8000-000000000103",
  duplicateCustody: "68100000-0000-4000-8000-000000000104",
  invalidLegacy: "68100000-0000-4000-8000-000000000105",
  invalidCustody: "68100000-0000-4000-8000-000000000106",
  expiredLegacy: "68100000-0000-4000-8000-000000000107",
  expiredCustody: "68100000-0000-4000-8000-000000000108",
  staleLegacy: "68100000-0000-4000-8000-000000000109",
  staleCustody: "68100000-0000-4000-8000-000000000110",
  futureLegacy: "68100000-0000-4000-8000-000000000111",
  futureCustody: "68100000-0000-4000-8000-000000000112",
  dependencyless: "68100000-0000-4000-8000-000000000113",
};

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-unified-current-reader-r31] ${message}`);
}

async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
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

function replaceOnce(source, needle, replacement) {
  const index = source.indexOf(needle);
  if (index === -1) throw new Error(`mutation target missing: ${needle}`);
  return `${source.slice(0, index)}${replacement}${source.slice(index + needle.length)}`;
}

function reversedGenerationCandidate(source) {
  const legacy = source.match(/    -- R31_GENERATION_LEGACY_BEGIN[\s\S]*?    -- R31_GENERATION_LEGACY_END/)?.[0];
  const custody = source.match(/    -- R31_GENERATION_CUSTODY_BEGIN[\s\S]*?    -- R31_GENERATION_CUSTODY_END/)?.[0];
  assert(legacy && custody, "generation markers missing");
  const original = `${legacy}\n\n    union all\n\n${custody}`;
  assert(source.includes(original), "generation sequence missing");
  return source.replace(original, `${custody}\n\n    union all\n\n${legacy}`);
}

async function seedBase(db) {
  for (const [name, context] of Object.entries(contexts)) {
    await db.query(
      "insert into auth.users(id, email) values ($1::uuid, $2), ($3::uuid, $4)",
      [
        context.subject,
        `r31-${name}-subject@example.test`,
        context.owner,
        `r31-${name}-owner@example.test`,
      ],
    );
    await db.query(`
      insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key)
      values ($1::uuid, $2::uuid, $3::uuid, $4)
    `, [context.workspace, context.subject, context.owner, `r31-${name}`]);
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
      `R31 ${name} judgement`,
      `ciphertext:${name}:authority`,
      context.owner,
    ]);
  }
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const sql of foundations) await db.exec(sql);
  await seedBase(db);
  for (const sql of overlays) await db.exec(sql);
  await db.exec(candidateSql);
  return db;
}

async function withCustody(db, context) {
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

async function storeLegacy(db, context, options) {
  const authority = await legacyAuthority(db, context);
  assert(authority, `legacy authority missing for ${options.ingestKey}`);
  const dependencies = [dependencyFrom(authority, options.producedAt)];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_authority_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [options.receiptId, context.workspace, context.owner, context.subject, JSON.stringify(dependencies)]);
  const receipt = {
    receipt_id: options.receiptId,
    workspace_id: context.workspace,
    owner_id: context.owner,
    subject_id: context.subject,
    ingest_key: options.ingestKey,
    request_sha256: options.requestMarker.repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: options.contentMarker.repeat(64),
    payload_ciphertext: `ciphertext:legacy:${options.ingestKey}`,
    encryption_version: 1,
    produced_at: options.producedAt,
    expires_at: options.expiresAt,
  };
  await scalar(db,
    "select private.brain_store_prepared_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

async function storeCustody(db, context, options) {
  const authority = await custodyAuthority(db, context);
  assert(authority, `custody authority missing for ${options.ingestKey}`);
  const dependencies = [dependencyFrom(authority, options.producedAt)];
  const fingerprint = await scalar(db, `
    select private.brain_prepared_custody_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5::jsonb
    ) as fingerprint
  `, [options.receiptId, context.workspace, context.custody, context.subject, JSON.stringify(dependencies)]);
  const aadSha256 = await scalar(db, `
    select private.brain_prepared_custody_cipher_aad_sha256(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid,
      'person_private', 'prepared_intelligence', $5
    ) as aad_sha256
  `, [context.workspace, context.custody, context.subject, options.receiptId, fingerprint]);
  const receipt = {
    schema_version: "ctrl.prepared-intelligence-custody-envelope.r24",
    receipt_id: options.receiptId,
    workspace_id: context.workspace,
    custody_principal_id: context.custody,
    subject_id: context.subject,
    ingest_key: options.ingestKey,
    request_sha256: options.requestMarker.repeat(64),
    kind: "prepared_intelligence",
    audience: "person_private",
    purpose: "prepared_intelligence",
    authority_fingerprint: fingerprint,
    content_fingerprint: options.contentMarker.repeat(64),
    payload_ciphertext: JSON.stringify({
      v: 2,
      alg: "A256GCM",
      kid: "r31-test-key",
      iv: "c2FmZS1pdi0x",
      ciphertext: `Y3VzdG9keS0${options.requestMarker}`,
      aad_sha256: aadSha256,
    }),
    encryption_version: 2,
    produced_at: options.producedAt,
    expires_at: options.expiresAt,
    dependencies,
  };
  await scalar(db,
    "select private.brain_store_prepared_custody_receipt($1::jsonb, $2::jsonb) as result",
    [JSON.stringify(receipt), JSON.stringify(dependencies)],
  );
}

function scopeFor(context) {
  return {
    schema_version: "ctrl.prepared-intelligence-current-reader.r31",
    workspace_id: context.workspace,
    custody_principal_id: context.custody,
    subject_id: context.subject,
    audience: "person_private",
    purpose: "prepared_intelligence",
  };
}

async function readCurrent(db, context, scope = scopeFor(context)) {
  return scalar(db,
    "select private.brain_read_current_prepared_intelligence($1::jsonb) as result",
    [JSON.stringify(scope)],
  );
}

async function readAsService(db, context) {
  await db.exec("set role service_role");
  try {
    return await readCurrent(db, context);
  } finally {
    await db.exec("reset role");
  }
}

async function seedScenario(db) {
  const active = await withCustody(db, contexts.active);
  const erased = await withCustody(db, contexts.erased);
  const closed = await withCustody(db, contexts.closed);
  const at = (offset) => new Date(scenarioNow + offset).toISOString();
  const futureExpiry = at(30 * 86_400_000);

  const legacy = (receiptId, ingestKey, requestMarker, contentMarker, producedAt, expiresAt = futureExpiry) =>
    storeLegacy(db, active, { receiptId, ingestKey, requestMarker, contentMarker, producedAt, expiresAt });
  const custody = (receiptId, ingestKey, requestMarker, contentMarker, producedAt, expiresAt = futureExpiry) =>
    storeCustody(db, active, { receiptId, ingestKey, requestMarker, contentMarker, producedAt, expiresAt });

  await legacy(activeReceipts.currentLegacy, "current-legacy", "a", "a", at(-12 * 60_000));
  await custody(activeReceipts.currentCustody, "current-custody", "b", "b", at(-11 * 60_000));
  await legacy(activeReceipts.duplicateLegacy, "duplicate-legacy", "c", "c", at(-10 * 60_000));
  await custody(activeReceipts.duplicateCustody, "duplicate-custody", "d", "c", at(-9 * 60_000));
  await legacy(activeReceipts.invalidLegacy, "invalid-legacy", "e", "d", at(-8 * 60_000));
  await custody(activeReceipts.invalidCustody, "invalid-custody", "f", "e", at(-7 * 60_000));
  await legacy(activeReceipts.expiredLegacy, "expired-legacy", "1", "f", at(-24 * 3_600_000), at(-60 * 60_000));
  await custody(activeReceipts.expiredCustody, "expired-custody", "2", "0", at(-24 * 3_600_000), at(-60 * 60_000));
  await legacy(activeReceipts.staleLegacy, "stale-legacy", "3", "1", at(-6 * 60_000));
  await custody(activeReceipts.staleCustody, "stale-custody", "4", "2", at(-5 * 60_000));
  await legacy(activeReceipts.futureLegacy, "future-legacy", "5", "3", at(60 * 60_000), at(2 * 60 * 60_000));
  await custody(activeReceipts.futureCustody, "future-custody", "6", "4", at(60 * 60_000), at(2 * 60 * 60_000));
  await legacy(activeReceipts.dependencyless, "dependencyless", "7", "5", at(-4 * 60_000));

  await db.query(`
    update public.brain_prepared_receipts set invalidated_at = now()
    where id = $1::uuid
  `, [activeReceipts.invalidLegacy]);
  await db.query(`
    update public.brain_prepared_custody_receipts set invalidated_at = now()
    where id = $1::uuid
  `, [activeReceipts.invalidCustody]);
  await db.query(`
    update public.brain_prepared_receipt_dependencies set authority_version = '999'
    where receipt_id = $1::uuid
  `, [activeReceipts.staleLegacy]);
  await db.query(`
    update public.brain_prepared_custody_receipt_dependencies set authority_version = '999'
    where receipt_id = $1::uuid
  `, [activeReceipts.staleCustody]);
  await db.query(`
    delete from public.brain_prepared_receipt_dependencies where receipt_id = $1::uuid
  `, [activeReceipts.dependencyless]);

  await storeLegacy(db, erased, {
    receiptId: erased.legacyReceipt,
    ingestKey: "erased-legacy",
    requestMarker: "8",
    contentMarker: "8",
    producedAt: at(-3 * 60_000),
    expiresAt: futureExpiry,
  });
  await storeCustody(db, erased, {
    receiptId: erased.custodyReceipt,
    ingestKey: "erased-custody",
    requestMarker: "9",
    contentMarker: "9",
    producedAt: at(-2 * 60_000),
    expiresAt: futureExpiry,
  });
  const erasure = {
    schema_version: "ctrl.prepared-intelligence-custody-subject-erasure.r30",
    erasure_id: erased.erasure,
    workspace_id: erased.workspace,
    custody_principal_id: erased.custody,
    subject_id: erased.subject,
    request_sha256: "a".repeat(64),
    occurred_at: at(-60_000),
  };
  await scalar(db,
    "select private.brain_erase_both_prepared_generations($1::jsonb) as result",
    [JSON.stringify(erasure)],
  );

  await db.query(`
    update private.brain_custody_assignments
    set ended_at = now()
    where custody_principal_id = $1::uuid and ended_at is null
  `, [closed.custody]);
  await db.query(`
    update private.brain_custody_principals
    set closed_at = now(), closure_authorization_sha256 = $2
    where id = $1::uuid
  `, [closed.custody, "f".repeat(64)]);

  return { active, erased, closed };
}

async function evaluate(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  try {
    const scenario = await seedScenario(db);
    const activeResult = await readAsService(db, scenario.active);
    const erasedResult = await readAsService(db, scenario.erased);
    const wrongScope = { ...scopeFor(scenario.active), custody_principal_id: scenario.erased.custody };
    const wrongScopeResult = await expectFailure(
      () => readCurrent(db, scenario.active, wrongScope),
      "reader_stable_scope_invalid",
      "cross_workspace_custody",
    );
    const closedResult = await expectFailure(
      () => readCurrent(db, scenario.closed),
      "reader_custody_inactive",
      "closed_custody",
    );
    const extraKeyResult = await expectFailure(
      () => readCurrent(db, scenario.active, { ...scopeFor(scenario.active), owner_id: scenario.active.owner }),
      "reader_scope_shape_invalid",
      "owner_smuggling",
    );
    const ordinaryRoleResult = await expectFailure(async () => {
      await db.exec("set role authenticated");
      try {
        await readCurrent(db, scenario.active);
      } finally {
        await db.exec("reset role");
      }
    }, "permission denied", "ordinary_authenticated");
    const rawReadResult = await expectFailure(async () => {
      await db.exec("set role authenticated");
      try {
        await db.query("select id from public.brain_prepared_receipts limit 1");
      } finally {
        await db.exec("reset role");
      }
    }, "permission denied", "authenticated_raw_read");

    return {
      activeResult,
      erasedResult,
      wrongScopeResult,
      closedResult,
      extraKeyResult,
      ordinaryRoleResult,
      rawReadResult,
    };
  } finally {
    await db.close();
  }
}

function assertCanonicalResult(result) {
  assert(result.activeResult.status === "current", "active scope was not current");
  assert(result.activeResult.item_count === 4, `expected 4 current items, got ${result.activeResult.item_count}`);
  const ids = result.activeResult.items.map((item) => item.receipt_id);
  assert(ids.includes(activeReceipts.currentLegacy), "exact current legacy material was hidden");
  assert(ids.includes(activeReceipts.currentCustody), "exact current custody material was hidden");
  assert(ids.includes(activeReceipts.duplicateCustody), "current custody material sharing content was hidden");
  assert(ids.includes(activeReceipts.duplicateLegacy), "current legacy material sharing content was hidden");
  const forbidden = [
    activeReceipts.invalidLegacy,
    activeReceipts.invalidCustody,
    activeReceipts.expiredLegacy,
    activeReceipts.expiredCustody,
    activeReceipts.staleLegacy,
    activeReceipts.staleCustody,
    activeReceipts.futureLegacy,
    activeReceipts.futureCustody,
    activeReceipts.dependencyless,
  ];
  assert(forbidden.every((id) => !ids.includes(id)), "non-current material escaped the reader");
  assert(result.erasedResult.status === "erased", "erased scope did not retain explicit standing");
  assert(result.erasedResult.item_count === 0 && result.erasedResult.items.length === 0,
    "erased scope returned protected material");
}

const result = await evaluate();
assertCanonicalResult(result);

const reversed = await evaluate(reversedGenerationCandidate(candidate));
assertCanonicalResult(reversed);
const generationInvariantProjection = (items) => items.map((item) => ({
  receipt_id: item.receipt_id,
  generation: item.generation,
  ingest_key: item.ingest_key,
  content_fingerprint: item.content_fingerprint,
  encryption_version: item.encryption_version,
  produced_at: item.produced_at,
  expires_at: item.expires_at,
}));
assert(JSON.stringify(generationInvariantProjection(reversed.activeResult.items))
    === JSON.stringify(generationInvariantProjection(result.activeResult.items)),
  "reversing generation branches changed the current answer");

const mutations = [
  {
    name: "legacy_invalidated_guard_removed",
    sql: replaceOnce(candidate, "      and legacy.invalidated_at is null", "      and true"),
  },
  {
    name: "custody_invalidated_guard_removed",
    sql: replaceOnce(candidate, "      and custody.invalidated_at is null", "      and true"),
  },
  {
    name: "legacy_expiry_guard_removed",
    sql: replaceOnce(candidate, "      and legacy.expires_at > read_at", "      and true"),
  },
  {
    name: "future_material_guard_removed",
    sql: candidate
      .replace("      and legacy.produced_at <= read_at", "      and true")
      .replace("      and custody.produced_at <= read_at", "      and true"),
  },
  {
    name: "legacy_authority_currentness_inverted",
    sql: replaceOnce(
      candidate,
      "          and not private.brain_prepared_authority_current(",
      "          and private.brain_prepared_authority_current(",
    ),
  },
  {
    name: "custody_authority_currentness_inverted",
    sql: replaceOnce(
      candidate,
      "            current_row.authority is null",
      "            current_row.authority is not null",
    ),
  },
  {
    name: "erasure_standing_guard_removed",
    sql: replaceOnce(
      candidate,
      "  if private.brain_prepared_subject_erased(workspace_id, subject_id) then",
      "  if false and private.brain_prepared_subject_erased(workspace_id, subject_id) then",
    ),
  },
];

const mutationResults = {};
for (const mutation of mutations) {
  try {
    const mutated = await evaluate(mutation.sql);
    assertCanonicalResult(mutated);
  } catch {
    mutationResults[mutation.name] = "failed_as_required";
    continue;
  }
  throw new Error(`[g25-unified-current-reader-r31] mutation survived: ${mutation.name}`);
}

console.log(JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  postgresql: "18.3",
  current_item_count: result.activeResult.item_count,
  generations: result.activeResult.items.map((item) => item.generation),
  erased_scope: result.erasedResult.status,
  generation_order_invariant: true,
  closed_boundaries: {
    cross_workspace_custody: result.wrongScopeResult,
    closed_custody: result.closedResult,
    owner_smuggling: result.extraKeyResult,
    ordinary_authenticated: result.ordinaryRoleResult,
    authenticated_raw_read: result.rawReadResult,
  },
  negative_controls: mutationResults,
}, null, 2));
