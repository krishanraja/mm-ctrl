import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const walk = (directory) => readdirSync(resolve(root, directory), { withFileTypes: true })
  .flatMap((entry) => {
    const absolute = join(resolve(root, directory), entry.name);
    return entry.isDirectory() ? walk(relative(root, absolute)) : [relative(root, absolute).replaceAll("\\", "/")];
  });
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-storage-erasure-surface-r43] ${message}`);
};

const migrationFiles = walk("supabase/migrations").filter((file) => extname(file) === ".sql");
const migrationText = migrationFiles.map((file) => read(file)).join("\n");
const declaredBuckets = new Set([
  ...[...migrationText.matchAll(/bucket_id\s*=\s*'([^']+)'/g)].map((match) => match[1]),
  ...[...migrationText.matchAll(/storage\.buckets[\s\S]{0,300}?values\s*\(\s*'([^']+)'/gi)].map((match) => match[1]),
]);
const deletion = read("supabase/functions/delete-account/index.ts");
const deletionLoop = deletion.match(/for \(const bucket of \[([^\]]+)\]\)/)?.[1] ?? "";
const deletionBuckets = new Set([...deletionLoop.matchAll(/'([^']+)'/g)].map((match) => match[1]));
const e2e = read("src/__tests__/e2e/account-deletion.spec.ts");
const e2eLoop = e2e.match(/for \(const bucket of \[([^\]]+)\]\)/)?.[1] ?? "";
const e2eBuckets = new Set([...e2eLoop.matchAll(/'([^']+)'/g)].map((match) => match[1]));

const ownedBuckets = ["ctrl-briefings", "documents", "skill-packages"];
const uncovered = ownedBuckets.filter((bucket) => !deletionBuckets.has(bucket));
const untested = ownedBuckets.filter((bucket) => !e2eBuckets.has(bucket));

for (const bucket of ownedBuckets) {
  assert(declaredBuckets.has(bucket), `owned bucket not declared in migration evidence: ${bucket}`);
}
assert(deletionBuckets.has("ctrl-briefings"), "briefing audio deletion missing");
assert(deletionBuckets.has("documents"), "document deletion missing");
assert(uncovered.length === 1 && uncovered[0] === "skill-packages",
  `storage coverage finding drifted: ${uncovered.join(",")}`);
assert(untested.length === 1 && untested[0] === "skill-packages",
  `storage E2E finding drifted: ${untested.join(",")}`);
assert(deletion.includes(".list(userId, { limit: 1000 })"), "bounded one-page listing evidence drifted");
assert(!deletion.match(/\.list\(userId,\s*\{[^}]*offset/s), "deletion unexpectedly gained pagination");
assert(deletion.includes("const paths = files.map"),
  "single-level object mapping evidence drifted");
assert(!deletion.includes("storage.foldername") && !deletion.includes("nextOffset"),
  "deletion unexpectedly gained recursive or paginated traversal");
assert(deletion.includes("success: true") && deletion.includes("errors: deletionErrors.length > 0"),
  "partial-failure success contract evidence drifted");
assert(read("supabase/functions/generate-skill-export/index.ts").includes('.from("skill-packages")'),
  "paid skill-package producer missing");
assert(read("supabase/functions/free-skill-export/index.ts").includes('.from("skill-packages")'),
  "free skill-package producer missing");

console.log(JSON.stringify({
  status: "critical_storage_erasure_gap_confirmed",
  declared_owned_buckets: ownedBuckets,
  deletion_buckets: [...deletionBuckets].sort(),
  e2e_buckets: [...e2eBuckets].sort(),
  uncovered,
  untested,
  pagination: "single_page_limit_1000",
  recursion: false,
  partial_failure_http_standing: "success_true_with_errors",
}, null, 2));
