import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const relativeRegister = "project-documentation/ctrl-evolution/g25-legacy-capability-preservation-register-r1.json";
const registerPath = path.join(root, relativeRegister);
const relativeFounderLock = "project-documentation/ctrl-evolution/g24-predicate-authority-r97-founder-lock-r99.md";
const founderLockPath = path.join(root, relativeFounderLock);
const relativeFounderRecord = "project-documentation/ctrl-evolution/g24-predicate-authority-r97-founder-lock-r99.json";
const founderRecordPath = path.join(root, relativeFounderRecord);
const relativeImprovementRecord = "project-documentation/ctrl-evolution/g25-preservation-improvement-founder-clarification-r7.json";
const improvementRecordPath = path.join(root, relativeImprovementRecord);

function fail(message) {
  console.error(`[g25-preservation] FAIL: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(registerPath)) {
  fail(`missing ${relativeRegister}`);
  process.exit();
}

if (!fs.existsSync(founderLockPath)) {
  fail(`missing ${relativeFounderLock}`);
  process.exit();
}

if (!fs.existsSync(founderRecordPath)) {
  fail(`missing ${relativeFounderRecord}`);
  process.exit();
}

if (!fs.existsSync(improvementRecordPath)) {
  fail(`missing ${relativeImprovementRecord}`);
  process.exit();
}

const founderRecord = JSON.parse(fs.readFileSync(founderRecordPath, "utf8"));
const decision = founderRecord.decision_record;
if (founderRecord.schema_version !== "ctrl.g24.predicate-authority-r97-founder-lock.r99.v1") fail("unexpected R99 project-record schema");
if (founderRecord.exact_final_call !== "great stuff, approved r97 lets move forward") fail("R99 exact founder call drifted");
if (decision?.decision_id !== "DEC-20260917-g24-predicate-authority-r97" || decision?.status !== "active" || decision?.decider !== "Krish Raja") fail("R99 decision identity drifted");
for (const field of ["title", "decision", "decided_at", "recorded_at", "accountable_owner", "scope", "affected_entities", "rationale", "alternatives", "dissent", "tradeoffs", "evidence_refs", "assumptions", "revisit", "authority_granted", "source_ref", "supersedes", "superseded_by", "outcome", "events", "last_verified_at"]) {
  if (!Object.hasOwn(decision || {}, field)) fail(`R99 decision record missing ${field}`);
}
if (founderRecord.cross_venture_decision_ledger?.status !== "STORE_UNAVAILABLE_EXTERNAL_WRITE_NOT_AUTHORIZED") fail("R99 invents an unauthorised external ledger write");

const improvementRecord = JSON.parse(fs.readFileSync(improvementRecordPath, "utf8"));
if (improvementRecord.schema_version !== "ctrl.g25.preservation-improvement-founder-clarification.r7.v1") fail("unexpected R7 improvement-record schema");
if (improvementRecord.exact_founder_call !== "dont presume those legacy systems cannot be improved, they most likely can. continue onwards") fail("R7 exact founder clarification drifted");
if (improvementRecord.decision_record?.decision_id !== "DEC-20260917-g25-preservation-improvement") fail("R7 improvement decision identity drifted");
if (improvementRecord.decision_record?.status !== "active") fail("R7 improvement decision must remain active");

const founderLock = fs.readFileSync(founderLockPath, "utf8");
for (const exact of [
  "DEC-20260917-g24-predicate-authority-r97",
  "great stuff, approved r97 lets move forward",
  "2ec11845b5dde7c19009119dd41213d3e54326e2",
  "2f9f15849d1c577eee2dab9d4cb3aa62654664f7",
  "48d491a6b025d6a33985da6e9c27f22da5237557c93d528a32339bc3bae1035a",
  "f65d8afa7c5cd54b740b330a6ae0e7615237a7e231976a5b02bd9237b68f7a3e",
  "dont forget about the news curation and audio briefing, as well as any other brain control mechanics that were useful!",
]) {
  if (!founderLock.includes(exact)) fail(`founder lock is missing exact evidence: ${exact}`);
}

const bytes = fs.readFileSync(registerPath, "utf8");
let register;
try {
  register = JSON.parse(bytes);
} catch (error) {
  fail(`invalid JSON: ${error.message}`);
  process.exit();
}

if (register.schema_version !== "1.0.0") fail("schema_version must be 1.0.0");
if (register.register_id !== "G25-LEGACY-CAPABILITY-PRESERVATION-R1") fail("unexpected register_id");
if (register.status !== "binding_preimplementation_gate") fail("unexpected status");
if (register.source_baseline !== "8174677125bc2799929e3196282e75cba215b443") fail("source baseline drifted");

const requiredPolicy = ["preserve", "may_change", "improvement_mandate", "no_legacy_reverence", "replacement_route", "briefing_position", "retirement_gate", "default_on_uncertainty"];
for (const key of requiredPolicy) {
  if (typeof register.policy?.[key] !== "string" || register.policy[key].trim().length < 20) {
    fail(`policy.${key} is missing or too weak`);
  }
}

if (!register.policy.improvement_mandate.includes("presumed improvable")) fail("improvement mandate must presume legacy systems are improvable");
if (!register.policy.replacement_route.includes("prove improvement")) fail("replacement route must require positive improvement proof");

const capabilities = Array.isArray(register.capabilities) ? register.capabilities : [];
if (capabilities.length < 20) fail(`expected at least 20 protected capabilities, found ${capabilities.length}`);

const ids = new Set();
const allowedTreatments = new Set(["retain_behind_adapter", "recompose", "promote", "retain_selectively"]);
const forbiddenStatuses = new Set(["retired", "delete", "deleted", "unprotected"]);

for (const capability of capabilities) {
  const label = capability?.id || "<missing-id>";
  if (typeof capability?.id !== "string" || !/^CAP-[A-Z0-9-]+$/.test(capability.id)) fail(`${label}: invalid id`);
  if (ids.has(capability.id)) fail(`${label}: duplicate id`);
  ids.add(capability.id);

  for (const field of ["name", "product_value", "target_role", "status"]) {
    if (typeof capability?.[field] !== "string" || capability[field].trim().length < 8) fail(`${label}: weak or missing ${field}`);
  }

  if (!allowedTreatments.has(capability.target_treatment)) fail(`${label}: invalid target_treatment ${capability.target_treatment}`);
  if (forbiddenStatuses.has(String(capability.status).toLowerCase())) fail(`${label}: forbidden status ${capability.status}`);

  for (const field of ["current_owners", "callers_or_triggers", "data_contracts", "existing_evidence", "characterization_proof", "retirement_conditions"]) {
    if (!Array.isArray(capability[field]) || capability[field].length === 0) fail(`${label}: ${field} must be non-empty`);
  }

  for (const relativePath of [...(capability.current_owners || []), ...(capability.existing_evidence || [])]) {
    const target = path.join(root, relativePath);
    if (!fs.existsSync(target)) fail(`${label}: missing repository evidence ${relativePath}`);
  }

  if ((capability.characterization_proof || []).length < 3) fail(`${label}: needs at least three characterization proofs`);
  if ((capability.retirement_conditions || []).length < 2) fail(`${label}: needs at least two retirement conditions`);
}

for (const id of register.mandatory_capability_ids || []) {
  if (!ids.has(id)) fail(`mandatory capability missing: ${id}`);
}

const mandatory = new Set(register.mandatory_capability_ids || []);
if (mandatory.size !== (register.mandatory_capability_ids || []).length) fail("mandatory_capability_ids contains duplicates");

const briefing = capabilities.find((item) => item.id === "CAP-BRIEFING-AUDIO-CONVERSATION");
if (!briefing?.current_owners?.includes("supabase/functions/generate-briefing/index.ts")) fail("audio briefing does not pin generate-briefing");
if (!briefing?.current_owners?.includes("src/components/briefing/GlobalBriefingPlayer.tsx")) fail("audio briefing does not pin the global player");

const news = capabilities.find((item) => item.id === "CAP-NEWS-CURATION");
for (const owner of ["supabase/functions/live-headlines/index.ts", "supabase/functions/_shared/news-cluster.ts", "docs/CURATION-SYSTEM-SPEC.md"]) {
  if (!news?.current_owners?.includes(owner)) fail(`news curation does not pin ${owner}`);
}

const crosswire = capabilities.find((item) => item.id === "CAP-DECISION-WATCH-CROSSWIRE");
for (const owner of ["supabase/functions/decision-watch/index.ts", "supabase/functions/generate-briefing/index.ts"]) {
  if (!crosswire?.current_owners?.includes(owner)) fail(`decision return loop does not pin ${owner}`);
}

if (process.exitCode) process.exit();

console.log(`[g25-preservation] PASS: ${capabilities.length} protected capability systems, ${mandatory.size} mandatory IDs, all repository evidence paths present`);
