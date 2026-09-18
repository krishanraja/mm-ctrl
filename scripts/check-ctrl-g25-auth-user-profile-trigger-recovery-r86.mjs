import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-auth-user-profile-trigger-recovery-r86.json"));
const note = read("project-documentation/ctrl-evolution/g25-auth-user-profile-trigger-recovery-r86.md");
const qa = read("project-documentation/ctrl-evolution/g25-auth-user-profile-trigger-recovery-r86-qa-record.md");
const candidate = read(contract.candidate.path);
const verification = read(contract.candidate.verification_path);
const smoke = read(contract.candidate.runtime_smoke_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "auth_trigger_gap_proved_candidate_ready_for_isolated_test", "status drifted");
check(contract.production_evidence.table === "auth.users", "production table drifted");
check(contract.production_evidence.trigger === "on_auth_user_created", "production trigger drifted");
check(contract.production_evidence.function === "public.handle_new_user_profile()", "production function drifted");
check(contract.production_evidence.enabled === true, "production enabled evidence drifted");
check(contract.recovery_preflight.trigger_count === 0, "recovery gap evidence drifted");
check(contract.recovery_preflight.function_present_with_production_digest === true, "recovery function evidence drifted");

check(sha256(candidate) === contract.candidate.sha256, "candidate hash drifted");
check(sha256(verification) === contract.candidate.verification_sha256, "verification hash drifted");
check(sha256(smoke) === contract.candidate.runtime_smoke_sha256, "runtime smoke hash drifted");
check(candidate.includes("IF NOT EXISTS"), "candidate lost idempotence guard");
check(candidate.includes("AFTER INSERT ON auth.users"), "candidate lost Auth insert event");
check(candidate.includes("EXECUTE FUNCTION public.handle_new_user_profile()"), "candidate lost explicit function target");
check(!/^\s*(DROP|ALTER|TRUNCATE|DELETE|UPDATE)\b/gimu.test(candidate), "candidate gained a destructive operation");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "verification gained a mutation");
check(smoke.trimStart().startsWith("-- G25 Auth user profile trigger runtime smoke R86"), "runtime smoke identity drifted");
check(smoke.includes("DELETE FROM public.user_roles") && smoke.includes("DELETE FROM public.profiles") && smoke.includes("DELETE FROM auth.users"), "runtime smoke lost fixture cleanup");
check(smoke.includes("signup smoke fixture cleanup failed"), "runtime smoke lost post-cleanup assertion");
check(smoke.includes("example.invalid"), "runtime smoke lost synthetic email boundary");
check(smoke.includes("FROM public.profiles") && smoke.includes("FROM public.user_roles"), "runtime smoke lost outcome assertions");

check(contract.acceptance_gate.isolated_trigger_created === false, "trigger creation was fabricated");
check(contract.acceptance_gate.read_only_verification_passed === false, "verification pass was fabricated");
check(contract.acceptance_gate.self_cleaning_runtime_smoke_passed === false, "runtime pass was fabricated");
check(contract.acceptance_gate.production_unchanged === true, "production boundary drifted");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production boundary disappeared");
check(note.includes("No external Auth API is called and no email is sent."), "external side-effect boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-auth-user-profile-trigger-recovery-r86] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-auth-user-profile-trigger-recovery-r86] PASS: the missing Auth hook has a bounded isolated recovery packet");
