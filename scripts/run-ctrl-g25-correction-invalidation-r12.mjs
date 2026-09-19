import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const r10 = fs.readFileSync(path.join(root, "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql"), "utf8");
const r11 = fs.readFileSync(path.join(root, "supabase/candidates/g25_prepared_authority_adapter_r11.sql"), "utf8");
const r12Path = path.join(root, "supabase/candidates/g25_prepared_correction_invalidation_r12.sql");
const testPath = path.join(root, "supabase/tests/database/g25_prepared_correction_invalidation_r12.test.sql");
const r12 = fs.readFileSync(r12Path, "utf8");
const test = fs.readFileSync(testPath, "utf8");

const affectedRecordPredicate = "and dependency_row.authority_record_id = affected_authority_record_id";
const replacementCurrentGuard = "if not private.brain_prepared_authority_current(";
const invalidationEventType = "'invalidated',";

for (const required of [affectedRecordPredicate, replacementCurrentGuard, invalidationEventType]) {
  if (!r12.includes(required)) throw new Error(`R12 candidate is missing ${required}`);
}

async function createHarnessDatabase(r12Sql = r12) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  await db.exec(r10);
  await db.exec(r11);
  await db.exec(r12Sql);
  return db;
}

async function runPositiveControl() {
  const db = await createHarnessDatabase();
  try {
    const results = await db.exec(test);
    const result = results
      .flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, "g25_correction_invalidation_result"));
    if (!result || result.g25_correction_invalidation_result?.status !== "passed") {
      throw new Error("R12 produced no passing correction-invalidation result");
    }

    const residue = await db.query(`
      select
        (select count(*)::int from public.brain_prepared_receipts) as receipts,
        (select count(*)::int from public.brain_prepared_receipt_dependencies) as dependencies,
        (select count(*)::int from public.brain_prepared_receipt_events) as events,
        (select count(*)::int from public.brain_prepared_authority_corrections) as corrections
    `);
    if (Object.values(residue.rows[0]).some((count) => count !== 0)) {
      throw new Error(`R12 rollback left residue: ${JSON.stringify(residue.rows[0])}`);
    }

    const security = await db.query(`
      select jsonb_build_object(
        'correction_rls_forced', (
          select relrowsecurity and relforcerowsecurity
          from pg_class where oid = 'public.brain_prepared_authority_corrections'::regclass
        ),
        'authenticated_function_closed', not has_function_privilege(
          'authenticated', 'private.brain_invalidate_prepared_receipts_for_correction(jsonb)', 'EXECUTE'
        ),
        'authenticated_update_closed', not has_table_privilege(
          'authenticated', 'public.brain_prepared_receipts', 'UPDATE'
        ),
        'service_invalidation_column_open', has_column_privilege(
          'service_role', 'public.brain_prepared_receipts', 'invalidated_at', 'UPDATE'
        ),
        'service_delete_closed', not has_table_privilege(
          'service_role', 'public.brain_prepared_receipts', 'DELETE'
        )
      ) as result
    `);
    const securityResult = security.rows[0].result;
    if (Object.values(securityResult).some((value) => value !== true)) {
      throw new Error(`R12 schema security failed: ${JSON.stringify(securityResult)}`);
    }

    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      canary: result.g25_correction_invalidation_result,
      schema_security: securityResult,
      rollback_residue: residue.rows[0],
    };
  } finally {
    await db.close();
  }
}

async function expectNegativeControl(r12Sql, expectedMessage, label) {
  const db = await createHarnessDatabase(r12Sql);
  try {
    try {
      await db.exec(test);
    } catch (error) {
      if (String(error?.message).includes(expectedMessage)) return { [label]: "failed_as_required" };
      throw error;
    }
    throw new Error(`R12 ${label} negative control unexpectedly passed`);
  } finally {
    await db.close();
  }
}

const positive = await runPositiveControl();
const affectedRecordNegative = await expectNegativeControl(
  r12.replace(affectedRecordPredicate, "and true"),
  "correction did not invalidate exactly one receipt",
  "affected_record_predicate_removed",
);
const currentAuthorityNegative = await expectNegativeControl(
  r12.replace(replacementCurrentGuard, "if false and not private.brain_prepared_authority_current("),
  "superseded replacement authority was accepted",
  "replacement_current_guard_removed",
);
const eventNegative = await expectNegativeControl(
  r12.replace(invalidationEventType, "'delivery_referenced',"),
  "invalidation event missing or duplicated",
  "invalidation_event_type_changed",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_controls: {
    ...affectedRecordNegative,
    ...currentAuthorityNegative,
    ...eventNegative,
  },
}, null, 2)}\n`);
