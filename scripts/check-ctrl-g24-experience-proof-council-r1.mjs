import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g24-experience-proof-council-r1.json"));
const protocol = read("project-documentation/ctrl-evolution/g24-experience-proof-council-r1.md");
const audit = read("project-documentation/ctrl-evolution/g24-experience-proof-council-r1-audit.md");

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contract.status === "active_required_for_every_material_surface", "material-surface status drifted");
check(contract.existing_truth_council.length === 7, "truth council must retain seven roles");
check(new Set(contract.existing_truth_council).size === 7, "truth council roles must be unique");
check(contract.experience_specialists.length === 8, "experience council must retain eight roles");
check(new Set(contract.experience_specialists.map((role) => role.id)).size === 8, "experience specialist ids must be unique");
check(contract.experience_specialists.every((role) => role.owned_truth && role.veto_examples.length >= 4), "each experience specialist needs owned truth and concrete vetoes");
check(contract.blind_first_pass.same_context_self_review_counts_as_blind === false, "same-context review cannot become blind evidence");
check(contract.blind_first_pass.first_pass_verdicts_sealed_before_history === true, "history must remain closed until first-pass seal");
check(contract.blind_first_pass.excluded_from_pack.includes("founder predicted reaction"), "founder-reaction anchoring exclusion disappeared");
check(contract.blind_first_pass.excluded_from_pack.includes("other specialists' outputs"), "judge-output isolation disappeared");
check(contract.scope_router.material_customer_or_operator_surface.experience_specialists === "all", "material surfaces must reach all experience specialists");
check(contract.scope_router.release_candidate.truth_judges === "all", "release candidate must reach all truth judges");
check(contract.scope_router.release_candidate.physical_device_evidence.includes("iOS Safari") && contract.scope_router.release_candidate.physical_device_evidence.includes("Android Chrome"), "physical mobile release proof disappeared");
check(contract.reality_labs.state_floor.length >= 12, "state-range proof became too narrow");
check(contract.reality_labs.accessibility_floor.includes("screen-reader path for release-critical flows"), "screen-reader release proof disappeared");
check(contract.required_run_receipt.length >= 12, "run receipt lost required evidence");
check(contract.enforcement.not_run_means === "not_approved", "not-run state must remain not approved");
check(contract.enforcement.material_ui_change_requires_same_change_run_receipt === true, "material UI receipt gate disappeared");
check(contract.enforcement.ai_judge_pass_means_human_or_device_pass === false, "AI judges cannot impersonate human or device evidence");
check(contract.enforcement.one_viewport_pass_means_cross_device_pass === false, "one viewport cannot become cross-device evidence");
check(protocol.includes("A same-context self-review is not blind."), "protocol obscures the blindness limit");
check(protocol.includes("If that receipt does not exist, the surface is `not_approved`."), "protocol lost receipt enforcement");
check(audit.includes("G25 R76 to R80 backend recovery"), "audit omits recent autonomous work");
check(audit.includes("no rendered-experience approval exists or is implied"), "backend work is being allowed to imply UI approval");
const emDash = String.fromCodePoint(0x2014);
check(!protocol.includes(emDash) && !audit.includes(emDash), "no em dash allowed");

if (failures.length) {
  console.error(`[g24-experience-proof-council-r1] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g24-experience-proof-council-r1] PASS: truth judges, experience specialists, blind review and reality labs remain separate and enforceable");
