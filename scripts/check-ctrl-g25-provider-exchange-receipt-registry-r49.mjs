import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-provider-exchange-receipt-registry-r49.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-provider-exchange-receipt-registry-r49.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-exchange-receipt-registry-r49-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-exchange-receipt-registry-r49] ${message}`);
};

assert(contract.status === "dormant_provider_exchange_registry_verified", "status drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("provider_exchange_private_research_payload_forbidden"),
  "private research gate disappeared");
assert(candidate.includes("provider_exchange_private_model_control_unverified"),
  "private model control gate disappeared");
assert(candidate.includes("alter table private.brain_provider_exchanges force row level security"),
  "forced RLS disappeared");
assert(candidate.includes("not in ('contractual_zdr', 'request_verified_zdr')"),
  "verified private-processing modes drifted");
assert(!/\b(prompt|query|content|email|recipient|provider_request_id)\s+(text|jsonb)\b/i.test(candidate),
  "raw payload column appeared");
assert(note.includes("not a promise that CTRL can recall every downstream copy"),
  "downstream-copy claim boundary disappeared");
assert(qa.includes("Single-process PGlite cannot prove"), "database proof boundary disappeared");

const output = execFileSync(
  process.execPath,
  [resolve(root, contract.artifacts.runner)],
  { cwd: root, encoding: "utf8" },
);
const observed = JSON.parse(output);
assert(observed.status === "local_registry_verified", "local registry did not verify");
assert(observed.checks.length === contract.observed.checks, "check count drifted");

console.log("[g25-provider-exchange-receipt-registry-r49] PASS: provider exchange state is bounded and locally enforced");
