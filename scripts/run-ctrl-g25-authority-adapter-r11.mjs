import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const r10Path = path.join(root, "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql");
const r11Path = path.join(root, "supabase/candidates/g25_prepared_authority_adapter_r11.sql");
const testPath = path.join(root, "supabase/tests/database/g25_prepared_authority_adapter_r11.test.sql");
const r10 = fs.readFileSync(r10Path, "utf8");
const r11 = fs.readFileSync(r11Path, "utf8");
const test = fs.readFileSync(testPath, "utf8");

const consequencePredicate = "and version_row.consequence_permission <> 'prohibited_in_context'";
const retentionPredicate = "and (source_row.retention_expires_at is null or source_row.retention_expires_at > now())";
const workspacePredicate = "and version_row.workspace_id = p_workspace_id";

for (const required of [consequencePredicate, retentionPredicate, workspacePredicate]) {
  if (!r11.includes(required)) throw new Error(`R11 candidate is missing ${required}`);
}

async function createHarnessDatabase(r11Sql = r11) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  await db.exec(r10);
  await db.exec(r11Sql);
  return db;
}

async function runPositiveControl() {
  const db = await createHarnessDatabase();
  try {
    const results = await db.exec(test);
    const result = results
      .flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, "g25_authority_adapter_result"));
    if (!result || result.g25_authority_adapter_result?.status !== "passed") {
      throw new Error("R11 produced no passing authority-adapter result");
    }

    const residue = await db.query(`
      select
        (select count(*)::int from public.brain_items) as items,
        (select count(*)::int from public.brain_item_versions) as item_versions,
        (select count(*)::int from public.brain_sources) as sources,
        (select count(*)::int from public.brain_prepared_receipts) as receipts,
        (select count(*)::int from public.brain_prepared_receipt_dependencies) as dependencies,
        (select count(*)::int from public.brain_prepared_receipt_events) as events
    `);
    if (Object.values(residue.rows[0]).some((count) => count !== 0)) {
      throw new Error(`R11 rollback left residue: ${JSON.stringify(residue.rows[0])}`);
    }

    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      canary: result.g25_authority_adapter_result,
      rollback_residue: residue.rows[0],
    };
  } finally {
    await db.close();
  }
}

async function expectNegativeControl(r11Sql, expectedMessage, label) {
  const db = await createHarnessDatabase(r11Sql);
  try {
    try {
      await db.exec(test);
    } catch (error) {
      if (String(error?.message).includes(expectedMessage)) return { [label]: "failed_as_required" };
      throw error;
    }
    throw new Error(`R11 ${label} negative control unexpectedly passed`);
  } finally {
    await db.close();
  }
}

const positive = await runPositiveControl();
const consequenceNegative = await expectNegativeControl(
  r11.replace(consequencePredicate, "and true"),
  "prohibited item authority was accepted",
  "consequence_permission_check_removed",
);
const retentionNegative = await expectNegativeControl(
  r11.replace(retentionPredicate, "and true"),
  "expired external source authority was accepted",
  "source_retention_check_removed",
);
const workspaceNegative = await expectNegativeControl(
  r11.replace(workspacePredicate, "and true"),
  "cross-workspace item authority was accepted",
  "item_workspace_check_removed",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_controls: {
    ...consequenceNegative,
    ...retentionNegative,
    ...workspaceNegative,
  },
}, null, 2)}\n`);
