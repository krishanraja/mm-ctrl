import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const registry = JSON.parse(read("project-documentation/ctrl-evolution/g25-non-fk-erasure-registry-r58.json"));
const note = read("project-documentation/ctrl-evolution/g25-non-fk-erasure-registry-r58.md");
const qa = read("project-documentation/ctrl-evolution/g25-non-fk-erasure-registry-r58-qa-record.md");
const discovery = JSON.parse(execFileSync(process.execPath, [
  resolve(root, "scripts/discover-ctrl-g25-non-fk-identifiers-r57.mjs"),
], { cwd: root, encoding: "utf8" }));

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-non-fk-erasure-registry-r58] ${message}`);
};

const allowedActions = new Set(Object.keys(registry.actions));
const allowedStandings = new Set(Object.keys(registry.standings));
const discoveredKeys = discovery.high_risk_anchors
  .map((candidate) => `${candidate.table}.${candidate.column}`)
  .sort();

function validate(candidate) {
  assert(candidate.status === "current_high_risk_surface_classified_execution_blocked", "status drifted");
  assert(candidate.execution_gate?.status === "blocked", "execution gate opened");
  assert(Array.isArray(candidate.targets), "targets missing");
  const keys = candidate.targets.map((target) => target.key);
  assert(new Set(keys).size === keys.length, "duplicate target key");
  assert(JSON.stringify([...keys].sort()) === JSON.stringify(discoveredKeys), "registry does not exactly cover R57 high-risk anchors");
  assert(candidate.targets.every((target) => allowedActions.has(target.action)), "unknown action");
  assert(candidate.targets.every((target) => allowedStandings.has(target.standing)), "unknown standing");
  assert(candidate.targets.every((target) => target.reason.length >= 40), "material reason missing");
  assert(candidate.targets.every((target) => Array.isArray(target.companions)), "companion list missing");
  const phone = candidate.targets.find((target) => target.key === "booking_requests.phone");
  assert(phone?.action === "erase_with_selected_subject_row", "phone became an independent selector");
  const shared = candidate.targets.filter((target) => target.action === "redact_shared_record_role_bundle");
  assert(shared.length === 5, "shared-role surface drifted");
  assert(shared.every((target) => target.companions.length >= 2), "shared-role bundle is incomplete");
  const audit = candidate.targets.filter((target) => target.action === "pseudonymize_retained_audit_identity");
  assert(audit.length === 2, "retained-audit surface drifted");
  assert(audit.every((target) => target.standing === "blocks_retention_policy"), "retained audit marked ready");
  const authenticatedParticipant = candidate.targets.find((target) => target.key === "index_participant_data.user_id");
  assert(authenticatedParticipant?.action === "delete_participant_row_by_auth_id", "participant UUID uses the wrong selector authority");
  assert(candidate.known_live_contradictions.length === 3, "known live contradiction disappeared");
}

validate(registry);

const clone = () => structuredClone(registry);
const attacks = [
  ["removed_target", (value) => value.targets.pop()],
  ["stale_target", (value) => value.targets.push({ ...value.targets[0], key: "unknown.email" })],
  ["duplicate_target", (value) => value.targets.push({ ...value.targets[0] })],
  ["phone_selector", (value) => {
    value.targets.find((target) => target.key === "booking_requests.phone").action = "delete_subject_row_by_verified_email";
  }],
  ["participant_selector_swapped", (value) => {
    value.targets.find((target) => target.key === "index_participant_data.user_id").action = "delete_participant_row_by_verified_email";
  }],
  ["empty_shared_bundle", (value) => {
    value.targets.find((target) => target.key === "workshop_sessions.facilitator_email").companions = [];
  }],
  ["execution_opened", (value) => { value.execution_gate.status = "ready"; }],
];

for (const [name, mutate] of attacks) {
  const attacked = clone();
  mutate(attacked);
  let rejected = false;
  try {
    validate(attacked);
  } catch {
    rejected = true;
  }
  assert(rejected, `negative control passed: ${name}`);
}

assert(note.includes("three-way contradiction blocks claims of complete leader erasure"), "leader contradiction rationale disappeared");
assert(qa.includes("Email selectors are limited to verified subject-role matches"), "email selector boundary disappeared");

const blockerCount = registry.targets.filter((target) => target.standing.startsWith("blocks_")).length;
console.log(`[g25-non-fk-erasure-registry-r58] PASS: ${registry.targets.length} anchors classified; ${blockerCount} blockers keep execution closed`);
