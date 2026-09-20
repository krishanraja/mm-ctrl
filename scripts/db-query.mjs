// Apply SQL to one explicitly named Supabase project via the Management API.
// Usage:
//   node scripts/db-query.mjs --project-ref <ref> --file path/to.sql
//   node scripts/db-query.mjs --project-ref <ref> --sql "select 1"
// Requires SUPABASE_ACCESS_TOKEN in env. There is deliberately no default
// project because a database mutation must never inherit a production target.
import { readFileSync } from 'node:fs';

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const args = process.argv.slice(2);
let query = '';
const projectIdx = args.indexOf('--project-ref');
const fileIdx = args.indexOf('--file');
const sqlIdx = args.indexOf('--sql');
const projectRef = projectIdx === -1 ? '' : args[projectIdx + 1];
if (!/^[a-z0-9]{20}$/.test(projectRef)) {
  console.error('Provide an exact --project-ref <20-character-ref>');
  process.exit(1);
}
if (fileIdx !== -1) query = readFileSync(args[fileIdx + 1], 'utf8');
else if (sqlIdx !== -1) query = args[sqlIdx + 1];
else {
  console.error('Provide --file <path> or --sql "<query>"');
  process.exit(1);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  }
);

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, text);
  process.exit(1);
}
console.log(text);
