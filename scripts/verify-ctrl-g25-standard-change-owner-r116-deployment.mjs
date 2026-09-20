import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(
  root,
  "project-documentation/ctrl-evolution/g25-standard-change-owner-gate-r116-deployment-manifest.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const npxCli = resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const runNpx = (args, options = {}) =>
  execFileSync(process.execPath, [npxCli, ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    ...options,
  });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (message) => {
  throw new Error(`r116_deployment_identity_failed:${message}`);
};
const normalize = (value) => value.split(sep).join("/");
const collectFiles = (directory) => {
  const result = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const bytes = readFileSync(absolute);
        result.push({
          path: normalize(relative(directory, absolute)),
          bytes: bytes.byteLength,
          sha256: sha256(bytes),
        });
      }
    }
  };
  visit(directory);
  return result.sort((left, right) => left.path.localeCompare(right.path));
};
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

if (
  manifest.project_ref !== "cgkcplcamsijghalintq" ||
  manifest.production_project_ref !== "bkyuxvschuwngtcdhsyg" ||
  manifest.production_allowed !== false ||
  manifest.functions.length !== 1
) fail("target_boundary");
if (!existsSync(npxCli)) fail("npx_cli_missing");

const listFunctions = () => JSON.parse(runNpx([
  "supabase", "functions", "list",
  "--project-ref", manifest.project_ref,
  "--output-format", "json",
])).functions;

const selectInventory = (functions) => manifest.functions.map((expected) => {
  const matches = functions.filter((candidate) => candidate.slug === expected.slug);
  if (matches.length !== 1) fail(`function_cardinality:${expected.slug}`);
  const actual = matches[0];
  for (const key of ["slug", "status", "verify_jwt", "import_map", "ezbr_sha256"]) {
    if (actual[key] !== expected[key]) fail(`function_metadata:${expected.slug}:${key}`);
  }
  if (!Number.isInteger(actual.version) || actual.version < 1) {
    fail(`function_metadata:${expected.slug}:version`);
  }
  return {
    id: actual.id,
    slug: actual.slug,
    version: actual.version,
    status: actual.status,
    verify_jwt: actual.verify_jwt,
    import_map: actual.import_map,
    ezbr_sha256: actual.ezbr_sha256,
    updated_at: actual.updated_at,
  };
});

const inventoryBefore = selectInventory(listFunctions());
const downloadedSources = [];
for (const expected of manifest.functions) {
  if (!/^[a-z0-9-]+$/.test(expected.slug)) fail("invalid_function_slug");
  const scratch = mkdtempSync(join(tmpdir(), `ctrl-r116-${expected.slug}-`));
  try {
    runNpx([
      "supabase", "functions", "download", expected.slug,
      "--project-ref", manifest.project_ref,
      "--use-api", "--workdir", scratch,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    const downloadedRoot = join(scratch, "supabase", "functions");
    if (!statSync(downloadedRoot).isDirectory()) fail(`download_missing:${expected.slug}`);
    const actualFiles = collectFiles(downloadedRoot);
    const expectedFiles = [...expected.source_files].sort((left, right) =>
      left.path.localeCompare(right.path));
    if (!same(actualFiles, expectedFiles)) fail(`downloaded_source_mismatch:${expected.slug}`);
    for (const file of expectedFiles) {
      const localPath = resolve(root, manifest.local_source_root, file.path);
      const localBytes = readFileSync(localPath);
      if (localBytes.byteLength !== file.bytes || sha256(localBytes) !== file.sha256) {
        fail(`local_source_mismatch:${expected.slug}:${file.path}`);
      }
    }
    downloadedSources.push({
      slug: expected.slug,
      exact_file_count: actualFiles.length,
      exact_downloaded_source_match: true,
      exact_local_source_match: true,
    });
  } finally {
    if (basename(scratch).startsWith(`ctrl-r116-${expected.slug}-`)) {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
}

const inventoryAfter = selectInventory(listFunctions());
if (!same(inventoryBefore, inventoryAfter)) fail("inventory_changed_during_download");

process.stdout.write(`${JSON.stringify({
  schema_version: "ctrl.g25.standard-change-owner-gate.r116.deployment-identity.v1",
  project_ref: manifest.project_ref,
  production_project_ref: manifest.production_project_ref,
  production_writes: 0,
  inventory_stable_during_download: true,
  functions: inventoryAfter,
  downloaded_sources: downloadedSources,
})}\n`);
