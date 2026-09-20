import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const hash = (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const r116Contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-standard-change-owner-gate-r116.json"));
const r116ProbePath = r116Contract.artifacts.probe;
const r119Probe = read("scripts/probe-ctrl-g25-human-review-binding-r119.mjs");

check(hash(r116ProbePath) === r116Contract.artifacts.probe_sha256, "R116 probe changed instead of being reused read-only");
check(r119Probe.includes('routeCallCount !== 17'), "R119 does not fail closed on R116 route-call drift");
check(r119Probe.includes('review-standard-change-v2'), "R119 does not exercise the authenticated V2 route");
check(r119Probe.includes('ctrl.standard-change.owner-review.presentation.v1'), "R119 does not require the exact presentation schema");
check(r119Probe.includes('item.packet.presentation.evidence?.length === 2'), "R119 does not require resolved presentation evidence");
check(r119Probe.includes('deploy_authorized === false') && r119Probe.includes('release_authorized === false'), "R119 does not preserve authority closure");
check(r119Probe.includes('Object.values(result.cleanup)'), "R119 does not verify complete fixture cleanup");
check(r119Probe.includes('rmSync(temporaryDirectory'), "R119 does not remove its generated executable");
check(!r119Probe.includes('\u2014'), "R119 probe contains an em dash");

if (failures.length) {
  console.error(`[g25-human-review-binding-r119] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-human-review-binding-r119] PASS: V2 reuses the frozen R116 lifecycle probe without mutating its evidence and adds presentation-complete assertions");
