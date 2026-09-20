import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(scriptDir, "probe-ctrl-g25-standard-change-owner-r116.mjs");
const scratchRoot = process.env.CTRL_SCRATCH_ROOT ?? join(homedir(), ".scratch");
mkdirSync(scratchRoot, { recursive: true });
const temporaryDirectory = mkdtempSync(join(scratchRoot, "mm-ctrl-r119-"));
const executablePath = join(temporaryDirectory, "authenticated-r119-probe.mjs");

const routeCall = 'invoke("review-standard-change"';
const routeCallV2 = 'invoke("review-standard-change-v2"';
const source = readFileSync(sourcePath, "utf8");
const routeCallCount = source.split(routeCall).length - 1;
if (routeCallCount !== 17) throw new Error(`unexpected_r116_route_call_count:${routeCallCount}`);

let executable = source.replaceAll(routeCall, routeCallV2);
const prepareAnchor = `  const prepareRetry = await ${routeCallV2}, tokenA, ownerAction("prepare", {`;
const presentationAssertion = `  const presentationBound = prepared.every((item) =>
    item.packet?.presentation?.schema === "ctrl.standard-change.owner-review.presentation.v1" &&
    item.packet.presentation.question === "Should this be your proposal rule?" &&
    item.packet.presentation.current_rule === "Name the proof before confidence." &&
    item.packet.presentation.proposed_rule === "Treat this check as advisory for proposal work." &&
    item.packet.presentation.consequence === "fewer false positive blocks" &&
    item.packet.presentation.risk_if_wrong === "Weak proposals may pass." &&
    item.packet.presentation.validation === "fresh independent check" &&
    item.packet.presentation.alternative_explanations?.length === 1 &&
    item.packet.presentation.evidence?.length === 2 &&
    item.packet.consequences?.deploy_authorized === false &&
    item.packet.consequences?.release_authorized === false);
  if (!presentationBound) throw new Error("presentation_binding_failed");

`;
if (!executable.includes(prepareAnchor)) throw new Error("r119_prepare_anchor_missing");
executable = executable.replace(prepareAnchor, `${presentationAssertion}${prepareAnchor}`);
executable = executable.replace(
  "    prepared_count: prepared.length,",
  "    prepared_count: prepared.length,\n    presentation_bound: presentationBound,",
);
executable = executable.replace(
  "    prepared.length === 3,",
  "    prepared.length === 3,\n    presentationBound,",
);

try {
  writeFileSync(executablePath, executable, "utf8");
  const run = spawnSync(process.execPath, [executablePath], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.status !== 0) {
    if (run.stdout) process.stderr.write(run.stdout);
    throw new Error(`r119_hosted_probe_failed:${run.status ?? "unknown"}`);
  }
  const finalLine = run.stdout.trim().split(/\r?\n/).at(-1);
  const result = JSON.parse(finalLine);
  if (result.presentation_bound !== true || Object.values(result.cleanup).some((value) => Number(value) !== 0)) {
    throw new Error("r119_hosted_probe_result_invalid");
  }
  console.log(JSON.stringify(result));
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
