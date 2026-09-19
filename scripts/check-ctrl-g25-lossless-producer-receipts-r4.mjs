import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-lossless-producer-receipts-r4.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.lossless-producer-receipts.r4.v1") fail("unexpected schema version");
if (contract.status !== "local_pure_receipt_gate_pass") fail("unexpected status");
if (contract.evidence?.receipt_tests !== 12 || contract.evidence?.full_chain_tests !== 40) fail("test counts drifted");
for (const field of ["runtime_callers_added", "producer_files_modified", "database_files_modified"]) {
  if (contract.evidence?.[field] !== 0) fail(`${field} exceeded local authority`);
}

for (const relative of [
  contract.depends_on,
  contract.implementation,
  contract.test,
  "project-documentation/ctrl-evolution/g25-lossless-producer-receipts-r4.md",
  "project-documentation/ctrl-evolution/g25-lossless-producer-receipts-r4-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

for (const section of [contract.news_receipt, contract.decision_receipt]) {
  if (!Array.isArray(section?.preserves) || section.preserves.length < 5) fail("receipt has an incomplete preservation contract");
  if (!Array.isArray(section?.holds_on) || section.holds_on.length < 5) fail("receipt has an incomplete hold contract");
}

const tests = fs.readFileSync(path.join(root, contract.test), "utf8");
for (const name of [
  "creates a deterministic qualified-news receipt from lossless cluster members",
  "creates a deterministic decision-observation receipt from verifier evidence",
  "flows both receipts through adapters into one governed prepared object",
]) {
  if (!tests.includes(`it(\"${name}\"`)) fail(`missing executable receipt: ${name}`);
}

for (const relative of ["supabase/functions/live-headlines/index.ts", "supabase/functions/decision-watch/index.ts"]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  if (source.includes("prepared-intelligence-receipts.r4")) fail(`live producer imports dormant receipt creator: ${relative}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-receipts-r4] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-receipts-r4] PASS: 12 receipt tests declared, 40 full-chain tests declared, zero live callers");
