import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-runtime-caller-inventory-r34.json";
const contract = JSON.parse(readFileSync(resolve(root, contractPath), "utf8"));
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".sql", ".toml"]);
const activeFunctions = [
  "brain_store_prepared_custody_receipt",
  "brain_invalidate_both_prepared_generations_for_correction",
  "brain_erase_both_prepared_generations",
  "brain_read_current_prepared_intelligence",
];
const retiredRuntimeFunctions = [
  "brain_store_prepared_receipt",
  "brain_invalidate_prepared_receipts_for_correction",
  "brain_erase_prepared_subject",
];
const dormantModules = [
  "supabase/functions/_shared/prepared-intelligence.r1.ts",
  "supabase/functions/_shared/prepared-intelligence-producer-adapters.r3.ts",
  "supabase/functions/_shared/prepared-intelligence-receipts.r4.ts",
  "supabase/functions/_shared/prepared-intelligence-receipt-store.r5.ts",
  "supabase/functions/_shared/prepared-intelligence-authority-envelope.r7.ts",
  "supabase/functions/_shared/prepared-intelligence-custody-envelope.r24.ts",
  "supabase/functions/_shared/prepared-custody-crypto.r26.ts",
];

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-runtime-caller-inventory-r34] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function filesUnder(start) {
  const result = [];
  const visit = (absolute) => {
    for (const entry of readdirSync(absolute)) {
      const child = resolve(absolute, entry);
      if (statSync(child).isDirectory()) visit(child);
      else if (textExtensions.has(extname(entry))) result.push(child);
    }
  };
  visit(resolve(root, start));
  return result;
}

function normalized(absolute) {
  return relative(root, absolute).replaceAll("\\", "/");
}

function isTest(relativePath) {
  return relativePath.includes("/__tests__/")
    || relativePath.includes(".test.")
    || relativePath.includes("/tests/");
}

const clientAndEntryFiles = [
  ...filesUnder("src"),
  ...filesUnder("supabase/functions"),
].filter((absolute) => {
  const file = normalized(absolute);
  return !isTest(file) && !file.startsWith("supabase/functions/_shared/");
});

const functionReferences = [];
const moduleReferences = [];
for (const absolute of clientAndEntryFiles) {
  const file = normalized(absolute);
  const source = readFileSync(absolute, "utf8");
  for (const token of [...activeFunctions, ...retiredRuntimeFunctions]) {
    if (source.includes(token)) functionReferences.push({ file, token });
  }
  for (const module of dormantModules) {
    const basename = module.split("/").at(-1).replace(/\.ts$/, "");
    if (source.includes(basename)) moduleReferences.push({ file, module: basename });
  }
}

const migrationReferences = [];
for (const absolute of filesUnder("supabase/migrations")) {
  const file = normalized(absolute);
  const source = readFileSync(absolute, "utf8");
  for (const token of [...activeFunctions, ...retiredRuntimeFunctions, "brain_prepared_custody_receipts"]) {
    if (source.includes(token)) migrationReferences.push({ file, token });
  }
}

const moduleHashes = Object.fromEntries(dormantModules.map((file) => {
  const bytes = readFileSync(resolve(root, file));
  return [file, sha256(bytes)];
}));
const scriptSource = readFileSync(new URL(import.meta.url));

assert(contract.status === "dormant_no_application_callers", "claim boundary drifted");
assert(contract.artifacts.checker_sha256 === sha256(scriptSource), "checker hash drifted");
assert(JSON.stringify(contract.active_database_functions) === JSON.stringify(activeFunctions),
  "active function inventory drifted");
assert(JSON.stringify(contract.retired_runtime_functions) === JSON.stringify(retiredRuntimeFunctions),
  "retired function inventory drifted");
assert(JSON.stringify(contract.dormant_module_sha256) === JSON.stringify(moduleHashes),
  "dormant module bytes drifted");
assert(functionReferences.length === 0,
  `application function caller found: ${JSON.stringify(functionReferences)}`);
assert(moduleReferences.length === 0,
  `dormant module imported by application entrypoint: ${JSON.stringify(moduleReferences)}`);
assert(migrationReferences.length === 0,
  `candidate machinery appeared in migration history: ${JSON.stringify(migrationReferences)}`);
assert(contract.observed.application_function_references === functionReferences.length,
  "application function reference count drifted");
assert(contract.observed.application_module_imports === moduleReferences.length,
  "application module import count drifted");
assert(contract.observed.migration_references === migrationReferences.length,
  "migration reference count drifted");

console.log(JSON.stringify({
  status: "pass",
  scanned_application_files: clientAndEntryFiles.length,
  application_function_references: functionReferences.length,
  application_module_imports: moduleReferences.length,
  migration_references: migrationReferences.length,
  dormant_modules: dormantModules.length,
  conclusion: "no application caller exists to switch; runtime integration remains closed",
}, null, 2));
