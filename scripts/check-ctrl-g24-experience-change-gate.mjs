import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const runGit = (args) => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const changed = new Set([
  ...runGit(["diff", "--name-only", "HEAD"]),
  ...runGit(["diff", "--cached", "--name-only"]),
  ...runGit(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]),
]);

const materialSurfacePattern = /^(?:src\/(?:components|pages|features|routes|styles)\/.*\.(?:tsx|ts|css|scss)|src\/(?:App|main|index)\.(?:tsx|ts|css)|public\/.*\.(?:html|css|js|svg|png|jpe?g|webp))$/i;
const receiptPattern = /^project-documentation\/ctrl-evolution\/runs\/g24-experience-[^/]+\/receipt\.json$/;
const materialChanges = [...changed].filter((file) => materialSurfacePattern.test(file) && !/\.(?:test|spec)\.[^.]+$/i.test(file));

if (!materialChanges.length) {
  console.log("[g24-experience-change-gate] PASS: no material customer or operator surface changed");
  process.exit(0);
}

const receiptPaths = [...changed].filter((file) => receiptPattern.test(file));
if (!receiptPaths.length) {
  console.error("[g24-experience-change-gate] FAIL: material UI changed without a same-change experience receipt");
  for (const file of materialChanges) console.error(`- ${file}`);
  process.exit(1);
}

const allowedStatuses = new Set(["preflight", "vetoed", "passed_for_founder_review", "founder_approved_scope"]);
const failures = [];
const receipts = [];
for (const relative of receiptPaths) {
  const path = resolve(root, relative);
  if (!existsSync(path)) {
    failures.push(`${relative}: receipt file is missing`);
    continue;
  }
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${relative}: receipt is not valid JSON`);
    continue;
  }
  if (receipt.protocol_id !== "G24-EXPERIENCE-PROOF-COUNCIL-R1") failures.push(`${relative}: wrong protocol_id`);
  if (!allowedStatuses.has(receipt.status)) failures.push(`${relative}: invalid status`);
  if (!receipt.surface || !receipt.materiality) failures.push(`${relative}: surface and materiality are required`);
  if (!Array.isArray(receipt.changed_surface_files) || !receipt.changed_surface_files.length) failures.push(`${relative}: changed_surface_files are required`);
  receipts.push({ relative, receipt });
  if (!receipt.authority || !receipt.release_status) failures.push(`${relative}: authority and release_status are required`);
  if (!Array.isArray(receipt.approval_claims)) failures.push(`${relative}: approval_claims must be explicit`);
  if (receipt.status === "preflight" && receipt.approval_claims?.length) failures.push(`${relative}: preflight receipt cannot claim approval`);
  if (["passed_for_founder_review", "founder_approved_scope"].includes(receipt.status)) {
    if (!receipt.first_pass_pack_hash || !Array.isArray(receipt.sealed_verdicts) || !receipt.sealed_verdicts.length) failures.push(`${relative}: sealed blind verdict evidence is required`);
    if (!receipt.reality_lab_results || !receipt.unverified_or_blocked) failures.push(`${relative}: rendered proof and limits are required`);
  }
}

for (const materialChange of materialChanges) {
  if (!receipts.some(({ receipt }) => receipt.changed_surface_files?.includes(materialChange))) {
    failures.push(`${materialChange}: no changed experience receipt covers this material surface`);
  }
}

if (failures.length) {
  console.error(`[g24-experience-change-gate] FAIL: ${failures.length} receipt issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[g24-experience-change-gate] PASS: ${materialChanges.length} material surface change(s) carry an explicit experience receipt`);
