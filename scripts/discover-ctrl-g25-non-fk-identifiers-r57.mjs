import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const typesPath = "src/integrations/supabase/types.ts";
const deletePath = "supabase/functions/delete-account/index.ts";
const migrationsPath = "supabase/migrations";
const types = readFileSync(resolve(root, typesPath), "utf8");
const deleteAccount = readFileSync(resolve(root, deletePath), "utf8");

function parseSchema(source) {
  const tables = new Map();
  let inTables = false;
  let table = null;
  let inRow = false;
  for (const line of source.split(/\r?\n/)) {
    if (line === "    Tables: {") { inTables = true; continue; }
    if (inTables && line === "    Views: {") break;
    if (!inTables) continue;
    const tableMatch = line.match(/^      ([a-z0-9_]+): \{$/);
    if (tableMatch) {
      table = tableMatch[1];
      tables.set(table, { columns: [], foreignKeyColumns: new Set() });
      inRow = false;
      continue;
    }
    if (!table) continue;
    if (line === "        Row: {") { inRow = true; continue; }
    if (inRow && line === "        }") { inRow = false; continue; }
    const columnMatch = inRow && line.match(/^          ([a-z0-9_]+): (.+)$/);
    if (columnMatch) tables.get(table).columns.push({ name: columnMatch[1], type: columnMatch[2] });
    const relationshipMatch = line.match(/^            columns: (\[[^\]]*\])$/);
    if (relationshipMatch) {
      for (const column of JSON.parse(relationshipMatch[1])) tables.get(table).foreignKeyColumns.add(column);
    }
  }
  return tables;
}

const PERSON_NAME_COLUMNS = new Set([
  "participant_name", "facilitator_name", "organizer_name", "contact_name",
  "referee_name", "referrer_name", "display_name", "full_name", "username",
  "sponsor_name", "pilot_owner",
]);
const PERSON_NAME_TABLES = new Set(["leaders", "leads", "unified_profiles"]);
const AUTH_COLUMNS = new Set([
  "user_id", "auth_user_id", "owner_id", "subject_id", "actor_user_id",
  "created_by", "uploaded_by", "granted_by", "grantee_user_id",
]);
const EXTERNAL_ID_COLUMNS = new Set([
  "email_id", "stripe_customer_id", "stripe_subscription_id",
  "provider_request_id", "external_id",
]);
const NETWORK_COLUMNS = new Set(["ip_address", "user_agent"]);

function candidateKind(table, column, type) {
  if (/(^|_)email$/.test(column)) return "direct_email";
  if (/(^|_)phone$/.test(column)) return "direct_phone";
  if (AUTH_COLUMNS.has(column)) return "auth_identity_like";
  if (EXTERNAL_ID_COLUMNS.has(column)) return "external_provider_identity";
  if (NETWORK_COLUMNS.has(column)) return "network_or_device_identifier";
  if (column.endsWith("identifier_hash") || column.endsWith("company_hash")) {
    return "pseudonymous_linkage";
  }
  if (PERSON_NAME_COLUMNS.has(column) || (column === "name" && PERSON_NAME_TABLES.has(table))) {
    return "named_person_candidate";
  }
  if (/^Json(?: \| null)?$/.test(type)) return "opaque_json_may_embed_identifier";
  return null;
}

const tables = parseSchema(types);
const candidates = [];
for (const [table, definition] of tables) {
  for (const column of definition.columns) {
    const kind = candidateKind(table, column.name, column.type);
    if (!kind || definition.foreignKeyColumns.has(column.name)) continue;
    candidates.push({ table, column: column.name, type: column.type, kind });
  }
}
candidates.sort((left, right) => `${left.table}.${left.column}`.localeCompare(`${right.table}.${right.column}`));

const directKinds = new Set([
  "direct_email", "direct_phone", "auth_identity_like", "external_provider_identity",
  "network_or_device_identifier", "pseudonymous_linkage", "named_person_candidate",
]);
const directCandidates = candidates.filter((candidate) => directKinds.has(candidate.kind));
const opaqueCandidates = candidates.filter((candidate) => candidate.kind === "opaque_json_may_embed_identifier");
const kindCounts = Object.fromEntries([...new Set(candidates.map((candidate) => candidate.kind))]
  .sort()
  .map((kind) => [kind, candidates.filter((candidate) => candidate.kind === kind).length]));
const directDeleteMentions = [...deleteAccount.matchAll(/\.from\('([a-z0-9_]+)'\)/g)]
  .map((match) => match[1]);
const sweepBlock = deleteAccount.match(/const sweepTables = \[([\s\S]*?)\n    \];/);
const sweepMentions = sweepBlock
  ? [...sweepBlock[1].matchAll(/'([a-z0-9_]+)'/g)].map((match) => match[1])
  : [];
const deleteMentionedTables = [...new Set([...directDeleteMentions, ...sweepMentions])].sort();
const highRiskAnchors = directCandidates.filter((candidate) => [
  "direct_email", "direct_phone", "auth_identity_like", "external_provider_identity",
].includes(candidate.kind));

function migrationCandidates() {
  const findings = [];
  for (const file of readdirSync(resolve(root, migrationsPath)).filter((name) => name.endsWith(".sql")).sort()) {
    const lines = readFileSync(resolve(root, migrationsPath, file), "utf8").split(/\r?\n/);
    let createTable = null;
    let depth = 0;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const create = line.match(/^\s*create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s*\(/i);
      if (create) {
        createTable = create[1].toLowerCase();
        depth = (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
        continue;
      }
      if (createTable) {
        const column = line.match(/^\s*"?([a-z][a-z0-9_]*)"?\s+(uuid|text|varchar(?:\(\d+\))?|jsonb?|inet)\b/i);
        if (column) {
          const columnName = column[1].toLowerCase();
          const kind = candidateKind(createTable, columnName, /^json/i.test(column[2]) ? "Json" : "string");
          if (kind && !/references\s+auth\.users\s*\(/i.test(line)) {
            findings.push({
              table: createTable,
              column: columnName,
              kind,
              evidence: `${file}:${index + 1}`,
            });
          }
        }
        depth += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
        if (depth <= 0) createTable = null;
        continue;
      }
      const added = line.match(/^\s*alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s+add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z0-9_]+)"?\s+(uuid|text|varchar(?:\(\d+\))?|jsonb?|inet)\b/i);
      if (added) {
        const table = added[1].toLowerCase();
        const column = added[2].toLowerCase();
        const kind = candidateKind(table, column, /^json/i.test(added[3]) ? "Json" : "string");
        if (kind && !/references\s+auth\.users\s*\(/i.test(line)) {
          findings.push({ table, column, kind, evidence: `${file}:${index + 1}` });
        }
      }
    }
  }
  const currentKeys = new Set(candidates.map((candidate) => `${candidate.table}.${candidate.column}`));
  const unique = new Map();
  for (const finding of findings) {
    const key = `${finding.table}.${finding.column}`;
    if (!currentKeys.has(key) && !unique.has(key)) unique.set(key, finding);
  }
  return [...unique.values()].sort((left, right) =>
    `${left.table}.${left.column}`.localeCompare(`${right.table}.${right.column}`));
}

const migrationOnlyCandidates = migrationCandidates();

console.log(JSON.stringify({
  schema_version: "ctrl.non-fk-identifier-discovery.r57",
  sources: { types: typesPath, live_delete_account: deletePath },
  observed: {
    table_count: tables.size,
    row_column_count: [...tables.values()].reduce((sum, table) => sum + table.columns.length, 0),
    non_fk_candidate_count: candidates.length,
    direct_candidate_count: directCandidates.length,
    opaque_json_candidate_count: opaqueCandidates.length,
    high_risk_anchor_count: highRiskAnchors.length,
    kind_counts: kindCounts,
    delete_account_mentioned_table_count: deleteMentionedTables.length,
    migration_only_candidate_count: migrationOnlyCandidates.length,
  },
  high_risk_anchors: highRiskAnchors,
  named_and_pseudonymous_candidates: directCandidates.filter((candidate) => [
    "named_person_candidate", "pseudonymous_linkage", "network_or_device_identifier",
  ].includes(candidate.kind)),
  opaque_json_candidates: opaqueCandidates.map(({ table, column }) => ({ table, column })),
  migration_only_candidates: migrationOnlyCandidates,
  delete_account_mentioned_tables: deleteMentionedTables,
  claim_boundary: "A name match is a discovery lead, not proof that a column contains personal data or that deleting by it is safe. A table mention in delete-account is not proof that every non-FK candidate in that table is erased.",
}, null, 2));
