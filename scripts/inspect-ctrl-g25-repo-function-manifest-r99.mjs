import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const functionsRoot = resolve(root, "supabase/functions");
const configPath = resolve(root, "supabase/config.toml");
const bytewise = (left, right) => Buffer.from(left).compare(Buffer.from(right));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => value.split(sep).join("/");

function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => bytewise(a.name, b.name))) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function digestTree(directory) {
  const files = walkFiles(directory);
  const lines = [];
  let bytes = 0;
  for (const absolute of files) {
    const content = readFileSync(absolute);
    const filePath = normalize(relative(directory, absolute));
    bytes += content.length;
    lines.push(`${filePath}\0${content.length}\0${sha256(content)}`);
  }
  return {
    file_count: files.length,
    source_bytes: bytes,
    source_sha256: sha256(`${lines.join("\n")}\n`),
    files,
  };
}

function parseConfig(raw) {
  const result = new Map();
  const lines = raw.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const section = line.match(/^\s*\[functions\.([^\]]+)\]\s*$/);
    if (section) {
      current = section[1];
      if (!result.has(current)) result.set(current, null);
      continue;
    }
    if (!current) continue;
    const verify = line.match(/^\s*verify_jwt\s*=\s*(true|false)\s*(?:#.*)?$/);
    if (verify) result.set(current, verify[1] === "true");
  }
  return result;
}

function inspectText(files) {
  const envSymbols = new Set();
  let getUserMarker = false;
  let serviceRoleMarker = false;
  for (const absolute of files) {
    const text = readFileSync(absolute, "utf8");
    for (const match of text.matchAll(/Deno\.env\.get\(\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g)) {
      envSymbols.add(match[1]);
    }
    if (/\.auth\.getUser\s*\(/.test(text)) getUserMarker = true;
    if (/SUPABASE_SERVICE_ROLE_KEY|service[_-]?role/i.test(text)) serviceRoleMarker = true;
  }
  return {
    environment_symbols: [...envSymbols].sort(bytewise),
    explicit_get_user_marker: getUserMarker,
    service_role_marker: serviceRoleMarker,
  };
}

export function buildManifest() {
  const configRaw = readFileSync(configPath, "utf8");
  const config = parseConfig(configRaw);
  const shared = digestTree(resolve(functionsRoot, "_shared"));
  const slugs = readdirSync(functionsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .map((entry) => entry.name)
    .sort(bytewise);
  const functions = slugs.map((slug) => {
    const directory = resolve(functionsRoot, slug);
    const tree = digestTree(directory);
    return {
      slug,
      entrypoint_present: existsSync(resolve(directory, "index.ts")),
      file_count: tree.file_count,
      source_bytes: tree.source_bytes,
      source_sha256: tree.source_sha256,
      shared_source_sha256: shared.source_sha256,
      config_verify_jwt: config.has(slug) ? config.get(slug) : null,
      config_explicit: config.has(slug) && config.get(slug) !== null,
      ...inspectText(tree.files),
    };
  });
  const configuredWithoutSource = [...config.keys()].filter((slug) => !slugs.includes(slug)).sort(bytewise);
  const uniqueEnvironmentSymbols = [...new Set(functions.flatMap((entry) => entry.environment_symbols))].sort(bytewise);
  const core = {
    schema_version: "ctrl.g25.repo-function-source-manifest.r99.v1",
    generated_from: {
      functions_root: "supabase/functions",
      config_path: "supabase/config.toml",
      config_sha256: sha256(configRaw),
      shared_file_count: shared.file_count,
      shared_source_bytes: shared.source_bytes,
      shared_source_sha256: shared.source_sha256,
    },
    summary: {
      local_function_count: functions.length,
      entrypoint_count: functions.filter((entry) => entry.entrypoint_present).length,
      explicit_verify_jwt_true: functions.filter((entry) => entry.config_verify_jwt === true).length,
      explicit_verify_jwt_false: functions.filter((entry) => entry.config_verify_jwt === false).length,
      verify_jwt_unspecified: functions.filter((entry) => entry.config_verify_jwt === null).length,
      service_role_marker_count: functions.filter((entry) => entry.service_role_marker).length,
      explicit_get_user_marker_count: functions.filter((entry) => entry.explicit_get_user_marker).length,
      unique_environment_symbol_count: uniqueEnvironmentSymbols.length,
      configured_without_local_source_count: configuredWithoutSource.length,
    },
    configured_without_local_source: configuredWithoutSource,
    unique_environment_symbols: uniqueEnvironmentSymbols,
    functions,
  };
  return { ...core, manifest_sha256: sha256(`${JSON.stringify(core)}\n`) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const manifest = buildManifest();
  if (process.argv.includes("--summary")) {
    console.log(JSON.stringify({ ...manifest.summary, manifest_sha256: manifest.manifest_sha256 }, null, 2));
  } else {
    console.log(JSON.stringify(manifest, null, 2));
  }
}
