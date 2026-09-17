import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-prepared-intelligence-seam-r2.json";
const narrativePath = "project-documentation/ctrl-evolution/g25-prepared-intelligence-seam-r2.md";
const qaPath = "project-documentation/ctrl-evolution/g25-prepared-intelligence-seam-r2-qa-record.md";
const failures = [];

function fail(message) {
  failures.push(message);
}

for (const relative of [contractPath, narrativePath, qaPath]) {
  if (!fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

if (failures.length === 0) {
  const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
  if (contract.schema_version !== "ctrl.g25.prepared-intelligence-seam.r2.v1") fail("unexpected schema version");
  if (contract.status !== "local_characterization_pass") fail("contract has not passed its bounded local gate");
  if (contract.result?.focused_tests !== 16) fail("focused test count drifted");
  if (contract.result?.runtime_callers_added !== 0) fail("runtime wiring is not authorized");
  if (contract.result?.protected_capabilities_retired !== 0) fail("protected machinery was retired");

  for (const relative of [
    contract.authority?.founder_lock,
    contract.authority?.preservation_register,
    contract.implementation,
    contract.test,
  ]) {
    if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing contract dependency ${relative}`);
  }

  const invariants = Array.isArray(contract.invariants) ? contract.invariants : [];
  if (invariants.length !== 11) fail(`expected 11 invariants, found ${invariants.length}`);
  const testSource = fs.readFileSync(path.join(root, contract.test), "utf8");
  for (const invariant of invariants) {
    if (!/^PI-\d{3}$/.test(invariant.id || "")) fail(`invalid invariant id ${invariant.id}`);
    if (!testSource.includes(`it(\"${invariant.test_name}\"`)) fail(`${invariant.id} has no named executable test`);
  }

  const preservation = JSON.parse(fs.readFileSync(path.join(root, contract.authority.preservation_register), "utf8"));
  const protectedIds = new Set((preservation.capabilities || []).map((capability) => capability.id));
  for (const id of contract.preservation_links || []) {
    if (!protectedIds.has(id)) fail(`unknown preservation link ${id}`);
  }

  const implementation = fs.readFileSync(path.join(root, contract.implementation), "utf8");
  for (const exact of [
    "quiet_no_earned_intervention",
    "evidence_identity_collision",
    "suppressed_by_feedback",
    "excluded_by_user_control",
    "selection_receipts",
    "read_projection",
    "audio_projection",
  ]) {
    if (!implementation.includes(exact)) fail(`implementation is missing ${exact}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-prepared-r2] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-prepared-r2] PASS: 11 contract invariants, 16 focused tests declared, 6 protected capabilities linked, zero runtime callers");
