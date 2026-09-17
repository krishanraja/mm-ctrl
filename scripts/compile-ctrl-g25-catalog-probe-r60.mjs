import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = process.cwd();
const discovery = JSON.parse(execFileSync(process.execPath, [
  resolve(root, "scripts/discover-ctrl-g25-non-fk-identifiers-r57.mjs"),
], { cwd: root, encoding: "utf8" }));

const IDENTIFIER = /^[a-z][a-z0-9_]{0,62}$/;
const literal = (value) => `'${value.replaceAll("'", "''")}'`;
const targets = [
  ...discovery.migration_only_candidates.map((candidate) => ({
    table: candidate.table,
    column: candidate.column,
    origin: "migration_only_candidate",
    kind: candidate.kind,
  })),
  ...discovery.opaque_json_candidates.map((candidate) => ({
    table: candidate.table,
    column: candidate.column,
    origin: "generated_schema_opaque_json",
    kind: "opaque_json_may_embed_identifier",
  })),
].sort((left, right) => `${left.table}.${left.column}.${left.origin}`.localeCompare(`${right.table}.${right.column}.${right.origin}`));

for (const target of targets) {
  if (!IDENTIFIER.test(target.table) || !IDENTIFIER.test(target.column)) {
    throw new Error(`unsafe catalog identifier: ${target.table}.${target.column}`);
  }
}
const keys = targets.map((target) => `${target.origin}:${target.table}.${target.column}`);
if (new Set(keys).size !== keys.length) throw new Error("duplicate catalog probe target");

const values = targets
  .map((target) => `    (${literal(target.table)}, ${literal(target.column)}, ${literal(target.origin)}, ${literal(target.kind)})`)
  .join(",\n");
const sql = `-- CTRL G25 R60: read-only public-schema catalog reconciliation.\n` +
`-- This reads schema metadata only. It never reads table rows.\n` +
`WITH requested(table_name, column_name, origin, candidate_kind) AS (\n` +
`  VALUES\n${values}\n` +
`), observed AS (\n` +
`  SELECT\n` +
`    requested.table_name,\n` +
`    requested.column_name,\n` +
`    requested.origin,\n` +
`    requested.candidate_kind,\n` +
`    classes.oid IS NOT NULL AS table_exists,\n` +
`    attributes.attnum IS NOT NULL AS column_exists,\n` +
`    CASE classes.relkind\n` +
`      WHEN 'r' THEN 'ordinary_table'\n` +
`      WHEN 'p' THEN 'partitioned_table'\n` +
`      WHEN 'v' THEN 'view'\n` +
`      WHEN 'm' THEN 'materialized_view'\n` +
`      WHEN 'f' THEN 'foreign_table'\n` +
`      ELSE NULL\n` +
`    END AS relation_kind,\n` +
`    CASE WHEN attributes.attnum IS NULL THEN NULL ELSE pg_catalog.format_type(attributes.atttypid, attributes.atttypmod) END AS data_type,\n` +
`    CASE WHEN attributes.attnum IS NULL THEN NULL ELSE attributes.attnotnull END AS not_null,\n` +
`    COALESCE(classes.relrowsecurity, false) AS row_level_security_enabled,\n` +
`    COALESCE((\n` +
`      SELECT jsonb_agg(jsonb_build_object(\n` +
`        'constraint_name', constraints.conname,\n` +
`        'constraint_type', constraints.contype,\n` +
`        'definition', pg_catalog.pg_get_constraintdef(constraints.oid, true)\n` +
`      ) ORDER BY constraints.conname)\n` +
`      FROM pg_catalog.pg_constraint AS constraints\n` +
`      WHERE constraints.conrelid = classes.oid\n` +
`        AND attributes.attnum = ANY(constraints.conkey)\n` +
`    ), '[]'::jsonb) AS column_constraints\n` +
`  FROM requested\n` +
`  LEFT JOIN pg_catalog.pg_namespace AS namespaces\n` +
`    ON namespaces.nspname = 'public'\n` +
`  LEFT JOIN pg_catalog.pg_class AS classes\n` +
`    ON classes.relnamespace = namespaces.oid\n` +
`   AND classes.relname = requested.table_name\n` +
`   AND classes.relkind IN ('r', 'p', 'v', 'm', 'f')\n` +
`  LEFT JOIN pg_catalog.pg_attribute AS attributes\n` +
`    ON attributes.attrelid = classes.oid\n` +
`   AND attributes.attname = requested.column_name\n` +
`   AND attributes.attnum > 0\n` +
`   AND NOT attributes.attisdropped\n` +
`)\n` +
`SELECT *\n` +
`FROM observed\n` +
`ORDER BY origin, table_name, column_name;\n`;

const payload = {
  schema_version: "ctrl.catalog-probe.r60",
  claim_boundary: "Read-only PostgreSQL catalog metadata. No application row, identifier value, storage object or provider state is read.",
  target_counts: {
    total: targets.length,
    migration_only: targets.filter((target) => target.origin === "migration_only_candidate").length,
    opaque_json: targets.filter((target) => target.origin === "generated_schema_opaque_json").length,
  },
  targets,
  sql_sha256: createHash("sha256").update(sql, "utf8").digest("hex"),
  sql,
};

if (process.argv.includes("--sql-only")) {
  process.stdout.write(sql);
} else {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
