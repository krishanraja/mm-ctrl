import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-legacy-producer-adapters-r3.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.legacy-producer-adapters.r3.v1") fail("unexpected schema version");
if (contract.status !== "local_characterization_pass_with_required_producer_repairs") fail("status hides the producer blockers");
if (contract.evidence?.adapter_tests !== 12 || contract.evidence?.combined_prepared_intelligence_tests !== 28) fail("test counts drifted");
if (contract.evidence?.runtime_callers_added !== 0 || contract.evidence?.producer_files_modified !== 0) fail("R3 exceeded dormant characterization authority");

for (const relative of [
  contract.depends_on,
  contract.implementation,
  contract.test,
  "project-documentation/ctrl-evolution/g25-legacy-producer-adapters-r3.md",
  "project-documentation/ctrl-evolution/g25-legacy-producer-adapters-r3-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

const findings = Array.isArray(contract.producer_findings) ? contract.producer_findings : [];
for (const id of ["GAP-NEWS-QUALIFICATION-RECEIPT", "GAP-DECISION-WATCH-EVIDENCE-RECEIPT"]) {
  const finding = findings.find((candidate) => candidate.id === id);
  if (!finding || finding.severity !== "blocking_for_runtime_adapter") fail(`missing blocking finding ${id}`);
  for (const relative of finding?.current_sources || []) {
    if (!fs.existsSync(path.join(root, relative))) fail(`${id} points to missing source ${relative}`);
  }
}

const tests = fs.readFileSync(path.join(root, contract.test), "utf8");
for (const name of [
  "holds the current display-card shape because it lost source evidence",
  "holds the current alert-row shape because verification evidence was dropped",
  "composes both adapted legacy producers through one read and audio object",
]) {
  if (!tests.includes(`it(\"${name}\"`)) fail(`missing executable receipt: ${name}`);
}

const runtimeCandidates = [
  "supabase/functions/live-headlines/index.ts",
  "supabase/functions/decision-watch/index.ts",
  "supabase/functions/_shared/decision-alerts.ts",
];
for (const relative of runtimeCandidates) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  if (source.includes("prepared-intelligence-producer-adapters.r3")) fail(`runtime caller added in ${relative}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-adapters-r3] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-adapters-r3] PASS: 2 blocking producer gaps explicit, 12 adapter tests declared, zero runtime callers");
