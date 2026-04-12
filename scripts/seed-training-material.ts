#!/usr/bin/env -S node --loader ts-node/esm
/**
 * Seeds `training/anchor.yaml` into the `training_material` table via the
 * ingest-training-material edge function.
 *
 * Usage:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   node --loader ts-node/esm scripts/seed-training-material.ts
 *
 * Idempotent: a new version is created each run, and the prior active row is
 * demoted. Rollback is a one-row UPDATE against training_material.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANCHOR_PATH = join(__dirname, '..', 'training', 'anchor.yaml');

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const yaml = readFileSync(ANCHOR_PATH, 'utf8');
  const endpoint = `${supabaseUrl}/functions/v1/ingest-training-material`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format: 'yaml', body: yaml, scope: 'global' }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Seed failed: ${res.status} ${text}`);
    process.exit(1);
  }

  console.log('Seed OK:', text);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
