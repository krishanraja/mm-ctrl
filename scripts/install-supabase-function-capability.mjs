// Install one matching random capability in Supabase Edge Secrets and Vault.
// The value exists only in this process and is never printed or written.
//
// Usage:
//   SUPABASE_ACCESS_TOKEN=... node scripts/install-supabase-function-capability.mjs \
//     --project-ref <20-char-ref> --edge-name NAME --vault-name name

import { randomBytes } from "node:crypto";

const argv = process.argv.slice(2);
const arg = (name) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] ?? "" : "";
};
const projectRef = arg("project-ref");
const edgeName = arg("edge-name");
const vaultName = arg("vault-name");
const token = process.env.SUPABASE_ACCESS_TOKEN ?? "";

if (!/^[a-z0-9]{20}$/.test(projectRef)) throw new Error("exact project ref required");
if (!/^[A-Z][A-Z0-9_]{2,100}$/.test(edgeName)) throw new Error("valid Edge secret name required");
if (!/^[a-z][a-z0-9_]{2,100}$/.test(vaultName)) throw new Error("valid Vault secret name required");
if (!token.startsWith("sbp_")) throw new Error("SUPABASE_ACCESS_TOKEN required");

const secret = randomBytes(48).toString("hex");
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const edge = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
  method: "POST",
  headers,
  body: JSON.stringify([{ name: edgeName, value: secret }]),
});
if (!edge.ok) throw new Error(`Edge secret install failed with HTTP ${edge.status}`);

const sql = `
do $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = '${vaultName}' limit 1;
  if v_id is null then
    perform vault.create_secret('${secret}', '${vaultName}');
  else
    perform vault.update_secret(v_id, '${secret}', '${vaultName}', null);
  end if;
end $$;`;
const vault = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers,
  body: JSON.stringify({ query: sql }),
});
if (!vault.ok) throw new Error(`Vault capability install failed with HTTP ${vault.status}`);

console.log(JSON.stringify({ project_ref: projectRef, edge_name: edgeName, vault_name: vaultName, installed: true }));

