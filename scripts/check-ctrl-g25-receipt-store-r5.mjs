import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-receipt-store-state-machine-r5.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.receipt-store-state-machine.r5.v1") fail("unexpected schema version");
if (contract.status !== "local_pure_state_machine_pass") fail("unexpected status");
if (contract.evidence?.state_machine_tests !== 13 || contract.evidence?.full_g25_chain_tests !== 53) fail("test counts drifted");
for (const field of ["database_files_modified", "runtime_callers_added", "deliveries_sent"]) {
  if (contract.evidence?.[field] !== 0) fail(`${field} exceeded R5 authority`);
}

for (const relative of [
  contract.depends_on,
  contract.implementation,
  contract.test,
  "project-documentation/ctrl-evolution/g25-receipt-store-state-machine-r5.md",
  "project-documentation/ctrl-evolution/g25-receipt-store-state-machine-r5-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

if (!Array.isArray(contract.invariants) || contract.invariants.length !== 10) fail("expected ten lifecycle invariants");
if (!Array.isArray(contract.residual_risks) || contract.residual_risks.length < 5) fail("residual risks are incomplete");

const source = fs.readFileSync(path.join(root, contract.implementation), "utf8");
for (const exact of [
  "receipt_identity_conflict",
  "receipt_scope_mismatch",
  "receipt_expired",
  "receipt_invalidated",
  "receipt_erased",
  "subject_erasure_tombstone_active",
  "projection_stale",
  "delivery_receipt_unavailable",
]) {
  if (!source.includes(exact)) fail(`state machine is missing ${exact}`);
}

const tests = fs.readFileSync(path.join(root, contract.test), "utf8");
for (const name of [
  "holds a conflicting replay without changing state",
  "invalidates dependent receipts and their registered projection after correction",
  "erases subject content while retaining a payload-free audit tombstone",
  "a past delivery receipt does not keep corrected truth alive",
]) {
  if (!tests.includes(`it(\"${name}\"`)) fail(`missing executable receipt: ${name}`);
}

const forbiddenRuntime = [
  "supabase/functions/live-headlines/index.ts",
  "supabase/functions/decision-watch/index.ts",
  "supabase/functions/generate-briefing/index.ts",
];
for (const relative of forbiddenRuntime) {
  const runtime = fs.readFileSync(path.join(root, relative), "utf8");
  if (runtime.includes("prepared-intelligence-receipt-store.r5")) fail(`runtime imports dormant R5 store: ${relative}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-store-r5] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-store-r5] PASS: 10 lifecycle invariants, 13 state-machine tests declared, zero runtime or database integration");
