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
const candidate = read("supabase/candidates/g25_prepared_runtime_cutover_r32.sql");

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
const insertClosedTables = [
  "public.brain_prepared_receipts",
  "public.brain_prepared_receipt_dependencies",
  "public.brain_prepared_receipt_events",
  "public.brain_prepared_authority_corrections",
  "public.brain_prepared_custody_receipts",
  "public.brain_prepared_custody_receipt_dependencies",
  "public.brain_prepared_custody_receipt_events",
  "public.brain_prepared_custody_corrections",
];
const definerFunctions = [activeFunctions[0], activeFunctions[1], activeFunctions[2], activeFunctions[3]];

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-prepared-runtime-cutover-r32] ${message}`);
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
  for (const sql of chain) await db.exec(sql);
  await db.exec(candidateSql);
  return db;
}

async function functionPrivilege(db, signature) {
  return scalar(db,
    "select has_function_privilege('service_role', $1, 'EXECUTE') as allowed",
    [signature],
  );
}

async function tablePrivilege(db, table, privilege) {
  return scalar(db,
    "select has_table_privilege('service_role', $1, $2) as allowed",
    [table, privilege],
  );
}

async function columnPrivilege(db, table, column, privilege) {
  return scalar(db,
    "select has_column_privilege('service_role', $1, $2, $3) as allowed",
    [table, column, privilege],
  );
}

async function isSecurityDefiner(db, signature) {
  return scalar(db, `
    select procedure_row.prosecdef
    from pg_proc procedure_row
    where procedure_row.oid = to_regprocedure($1)
  `, [signature]);
}

async function callAsService(db, sql) {
  await db.exec("set role service_role");
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}

async function evaluate(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  try {
    const legacyExecute = {};
    for (const signature of legacyFunctions) {
      legacyExecute[signature] = await functionPrivilege(db, signature);
    }
    const activeExecute = {};
    for (const signature of activeFunctions) {
      activeExecute[signature] = await functionPrivilege(db, signature);
    }
    const definers = {};
    for (const signature of definerFunctions) {
      definers[signature] = await isSecurityDefiner(db, signature);
    }
    const rawInsert = {};
    for (const table of insertClosedTables) {
      rawInsert[table] = await tablePrivilege(db, table, "INSERT");
    }
    const rawUpdates = {
      legacy_invalidated: await columnPrivilege(
        db, "public.brain_prepared_receipts", "invalidated_at", "UPDATE",
      ),
      legacy_correction_count: await columnPrivilege(
        db, "public.brain_prepared_authority_corrections", "affected_receipt_count", "UPDATE",
      ),
      custody_invalidated: await columnPrivilege(
        db, "public.brain_prepared_custody_receipts", "invalidated_at", "UPDATE",
      ),
      custody_legacy_count: await columnPrivilege(
        db, "public.brain_prepared_custody_corrections", "legacy_affected_receipt_count", "UPDATE",
      ),
      custody_native_count: await columnPrivilege(
        db, "public.brain_prepared_custody_corrections", "custody_affected_receipt_count", "UPDATE",
      ),
    };

    const legacyCalls = {
      create: await expectFailure(
        () => callAsService(db, "select private.brain_store_prepared_receipt('{}'::jsonb, '[]'::jsonb)"),
        "permission denied",
        "legacy_create",
      ),
      correct: await expectFailure(
        () => callAsService(db, "select private.brain_invalidate_prepared_receipts_for_correction('{}'::jsonb)"),
        "permission denied",
        "legacy_correction",
      ),
      erase: await expectFailure(
        () => callAsService(db, "select private.brain_erase_prepared_subject('{}'::jsonb)"),
        "permission denied",
        "legacy_erasure",
      ),
    };
    const activeCalls = {
      create: await expectFailure(
        () => callAsService(db, "select private.brain_store_prepared_custody_receipt('{}'::jsonb, '[]'::jsonb)"),
        "receipt_shape_invalid",
        "custody_create_reached_contract",
      ),
      correct: await expectFailure(
        () => callAsService(db, "select private.brain_invalidate_both_prepared_generations_for_correction('{}'::jsonb)"),
        "correction_shape_invalid",
        "both_generation_correction_reached_contract",
      ),
      erase: await expectFailure(
        () => callAsService(db, "select private.brain_erase_both_prepared_generations('{}'::jsonb)"),
        "erasure_shape_invalid",
        "both_generation_erasure_reached_contract",
      ),
      read: await expectFailure(
        () => callAsService(db, "select private.brain_read_current_prepared_intelligence('{}'::jsonb)"),
        "reader_scope_shape_invalid",
        "unified_reader_reached_contract",
      ),
    };

    return { legacyExecute, activeExecute, definers, rawInsert, rawUpdates, legacyCalls, activeCalls };
  } finally {
    await db.close();
  }
}

function assertCutover(result) {
  assert(Object.values(result.legacyExecute).every((allowed) => allowed === false),
    "a legacy-only function remains executable");
  assert(Object.values(result.activeExecute).every((allowed) => allowed === true),
    "an active function is not executable");
  assert(Object.values(result.definers).every((enabled) => enabled === true),
    "an active function still depends on revoked caller table privileges");
  assert(Object.values(result.rawInsert).every((allowed) => allowed === false),
    "service role retains direct raw insert privilege");
  assert(Object.values(result.rawUpdates).every((allowed) => allowed === false),
    "service role retains direct lifecycle update privilege");
}

const result = await evaluate();
assertCutover(result);

const mutations = [
  {
    name: "legacy_create_revoke_removed",
    sql: replaceOnce(
      candidate,
      "revoke execute on function private.brain_store_prepared_receipt(jsonb, jsonb)\n  from service_role;",
      "grant execute on function private.brain_store_prepared_receipt(jsonb, jsonb)\n  to service_role;",
    ),
  },
  {
    name: "legacy_correction_revoke_removed",
    sql: replaceOnce(
      candidate,
      "revoke execute on function private.brain_invalidate_prepared_receipts_for_correction(jsonb)\n  from service_role;",
      "grant execute on function private.brain_invalidate_prepared_receipts_for_correction(jsonb)\n  to service_role;",
    ),
  },
  {
    name: "legacy_erasure_revoke_removed",
    sql: replaceOnce(
      candidate,
      "revoke execute on function private.brain_erase_prepared_subject(jsonb)\n  from service_role;",
      "grant execute on function private.brain_erase_prepared_subject(jsonb)\n  to service_role;",
    ),
  },
  {
    name: "custody_writer_definer_removed",
    sql: replaceOnce(
      candidate,
      "alter function private.brain_store_prepared_custody_receipt(jsonb, jsonb)\n  security definer;",
      "alter function private.brain_store_prepared_custody_receipt(jsonb, jsonb)\n  security invoker;",
    ),
  },
  {
    name: "both_generation_correction_definer_removed",
    sql: replaceOnce(
      candidate,
      "alter function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)\n  security definer;",
      "alter function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)\n  security invoker;",
    ),
  },
  {
    name: "legacy_raw_insert_reopened",
    sql: replaceOnce(
      candidate,
      "revoke insert on table public.brain_prepared_receipts from service_role;",
      "grant insert on table public.brain_prepared_receipts to service_role;",
    ),
  },
  {
    name: "custody_raw_insert_reopened",
    sql: replaceOnce(
      candidate,
      "revoke insert on table public.brain_prepared_custody_receipts from service_role;",
      "grant insert on table public.brain_prepared_custody_receipts to service_role;",
    ),
  },
];

const mutationResults = {};
for (const mutation of mutations) {
  try {
    const mutated = await evaluate(mutation.sql);
    assertCutover(mutated);
  } catch {
    mutationResults[mutation.name] = "failed_as_required";
    continue;
  }
  throw new Error(`[g25-prepared-runtime-cutover-r32] mutation survived: ${mutation.name}`);
}

console.log(JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  postgresql: "18.3",
  legacy_execute: result.legacyExecute,
  active_execute: result.activeExecute,
  active_security_definers: result.definers,
  raw_insert_privileges_closed: insertClosedTables.length,
  raw_lifecycle_updates_closed: Object.keys(result.rawUpdates).length,
  executable_boundaries: {
    legacy_calls: result.legacyCalls,
    active_calls: result.activeCalls,
  },
  negative_controls: mutationResults,
}, null, 2));
