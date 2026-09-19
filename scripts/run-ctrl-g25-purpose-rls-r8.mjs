import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const candidatePath = path.join(root, "supabase/tests/database/g25_prepared_receipt_purpose_canary.test.sql");
const candidate = fs.readFileSync(candidatePath, "utf8");
const purposePredicate = "and grant_row.purpose = g25_prepared_receipt_purpose_canary.purpose";

if (!candidate.includes(purposePredicate)) throw new Error("R8 purpose predicate is missing");

async function createHarnessDatabase() {
  return createG25PostgresHarness();
}

async function runPositiveControl() {
  const db = await createHarnessDatabase();
  try {
    const results = await db.exec(candidate);
    const result = results
      .flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, "g25_purpose_canary_result"));
    if (!result) throw new Error("R8 produced no purpose-canary result");

    const tableReadback = await db.query(
      "select to_regclass('public.g25_prepared_receipt_purpose_canary') is null as table_rolled_back",
    );
    const fixtureReadback = await db.query(
      "select count(*)::int as fixture_users from auth.users where email like 'g25-purpose-%'",
    );
    const canary = result.g25_purpose_canary_result;
    if (canary?.status !== "passed" || canary?.exact_purpose_match_required !== true) {
      throw new Error("R8 positive control did not establish exact-purpose isolation");
    }
    if (tableReadback.rows[0].table_rolled_back !== true || fixtureReadback.rows[0].fixture_users !== 0) {
      throw new Error("R8 rollback left test residue");
    }
    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      canary,
      table_rolled_back: true,
      fixture_users_after_rollback: 0,
    };
  } finally {
    await db.close();
  }
}

async function runNegativeControl() {
  const db = await createHarnessDatabase();
  try {
    const weakened = candidate.replace(purposePredicate, "and true");
    try {
      await db.exec(weakened);
    } catch (error) {
      if (String(error?.message).includes("crossed the exact-purpose boundary")) {
        return { purpose_predicate_removed: "failed_as_required" };
      }
      throw error;
    }
    throw new Error("R8 negative control unexpectedly passed");
  } finally {
    await db.close();
  }
}

const positive = await runPositiveControl();
const negative = await runNegativeControl();

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_control: negative,
}, null, 2)}\n`);
