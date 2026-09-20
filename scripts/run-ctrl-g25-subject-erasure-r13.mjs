import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const candidateFiles = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
];
const candidates = candidateFiles.map((relative) => fs.readFileSync(path.join(root, relative), "utf8"));
const r13 = candidates[3];
const test = fs.readFileSync(
  path.join(root, "supabase/tests/database/g25_prepared_subject_erasure_r13.test.sql"),
  "utf8",
);
const r10 = candidates[0];

const workspacePredicate = "where receipt_row.workspace_id = workspace_id\n      and receipt_row.owner_id = owner_id";
const ciphertextDestruction = "payload_ciphertext = null,";
const subjectErasureGuard = "if private.brain_prepared_subject_erased(workspace_id, subject_id) then";

for (const required of [workspacePredicate, ciphertextDestruction]) {
  if (!r13.includes(required)) throw new Error(`R13 candidate is missing ${required}`);
}
if (!r10.includes(subjectErasureGuard)) throw new Error("R10 store is missing the R13 subject-erasure guard seam");

async function createHarnessDatabase({ r13Sql = r13, r10Sql = r10 } = {}) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  await db.exec(r10Sql);
  await db.exec(candidates[1]);
  await db.exec(candidates[2]);
  await db.exec(r13Sql);
  return db;
}

async function runPositiveControl() {
  const db = await createHarnessDatabase();
  try {
    const results = await db.exec(test);
    const result = results
      .flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, "g25_subject_erasure_result"));
    if (!result || result.g25_subject_erasure_result?.status !== "passed") {
      throw new Error("R13 produced no passing subject-erasure result");
    }

    const residue = await db.query(`
      select
        (select count(*)::int from public.brain_prepared_receipts) as receipts,
        (select count(*)::int from public.brain_prepared_receipt_dependencies) as dependencies,
        (select count(*)::int from public.brain_prepared_receipt_events) as events,
        (select count(*)::int from public.brain_prepared_subject_erasure_tombstones) as tombstones
    `);
    if (Object.values(residue.rows[0]).some((count) => count !== 0)) {
      throw new Error(`R13 rollback left residue: ${JSON.stringify(residue.rows[0])}`);
    }

    const security = await db.query(`
      select jsonb_build_object(
        'tombstone_rls_forced', (
          select relrowsecurity and relforcerowsecurity
          from pg_class where oid = 'public.brain_prepared_subject_erasure_tombstones'::regclass
        ),
        'erasure_function_definer', (
          select prosecdef from pg_proc
          where oid = 'private.brain_erase_prepared_subject(jsonb)'::regprocedure
        ),
        'authenticated_function_closed', not has_function_privilege(
          'authenticated', 'private.brain_erase_prepared_subject(jsonb)', 'EXECUTE'
        ),
        'service_function_open', has_function_privilege(
          'service_role', 'private.brain_erase_prepared_subject(jsonb)', 'EXECUTE'
        ),
        'service_payload_update_closed', not has_column_privilege(
          'service_role', 'public.brain_prepared_receipts', 'payload_ciphertext', 'UPDATE'
        ),
        'service_dependency_delete_closed', not has_table_privilege(
          'service_role', 'public.brain_prepared_receipt_dependencies', 'DELETE'
        )
      ) as result
    `);
    const securityResult = security.rows[0].result;
    if (Object.values(securityResult).some((value) => value !== true)) {
      throw new Error(`R13 schema security failed: ${JSON.stringify(securityResult)}`);
    }

    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      canary: result.g25_subject_erasure_result,
      schema_security: securityResult,
      rollback_residue: residue.rows[0],
    };
  } finally {
    await db.close();
  }
}

async function expectNegativeControl(options, expectedMessage, label) {
  const db = await createHarnessDatabase(options);
  try {
    try {
      await db.exec(test);
    } catch (error) {
      if (String(error?.message).includes(expectedMessage)) return { [label]: "failed_as_required" };
      throw error;
    }
    throw new Error(`R13 ${label} negative control unexpectedly passed`);
  } finally {
    await db.close();
  }
}

const positive = await runPositiveControl();
const scopeNegative = await expectNegativeControl(
  { r13Sql: r13.replace(workspacePredicate, "where true\n      and receipt_row.owner_id = owner_id") },
  "subject erasure did not erase exactly one receipt",
  "workspace_predicate_removed",
);
const ciphertextNegative = await expectNegativeControl(
  { r13Sql: r13.replace(ciphertextDestruction, "payload_ciphertext = receipt_row.payload_ciphertext,") },
  "brain_prepared_receipts_payload_erasure_state_check",
  "ciphertext_destruction_removed",
);
const revivalNegative = await expectNegativeControl(
  { r10Sql: r10.replace(subjectErasureGuard, "if false and private.brain_prepared_subject_erased(workspace_id, subject_id) then") },
  "silent subject revival was accepted",
  "subject_erasure_guard_removed",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_controls: {
    ...scopeNegative,
    ...ciphertextNegative,
    ...revivalNegative,
  },
}, null, 2)}\n`);
