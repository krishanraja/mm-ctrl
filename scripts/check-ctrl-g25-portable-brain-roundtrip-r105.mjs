import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-portable-brain-roundtrip-r105.json";
const notePath = "project-documentation/ctrl-evolution/g25-portable-brain-roundtrip-r105.md";
const qaPath = "project-documentation/ctrl-evolution/g25-portable-brain-roundtrip-r105-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const note = read(notePath);
const qa = read(qaPath);
const config = read("supabase/config.toml");
const containmentRaw = read("supabase/containment/manifest.json");
const containment = JSON.parse(containmentRaw);
const migration = read(contract.database_authority.migration);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contractRaw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "current_brain_portable_roundtrip_complete_full_archive_open", "status drifted");
check(contract.package_contract.schema_version === "ctrl.portable-brain.v1", "package schema drifted");
check(sha256(read(contract.package_contract.shared_module)) === contract.package_contract.shared_module_sha256, "shared package module hash drifted");
check(contract.package_contract.maximum_request_bytes === 1_048_576, "request byte limit drifted");
check(contract.package_contract.maximum_facts === 500, "fact limit drifted");
check(contract.package_contract.maximum_patterns === 250, "pattern limit drifted");
check(contract.package_contract.maximum_decisions === 250, "decision limit drifted");
check(contract.package_contract.source_user_identifier_in_package === false, "source user identifier entered the package contract");
check(contract.package_contract.stable_key_order === true, "stable package ordering disappeared");
check(contract.package_contract.per_record_sha256 === true, "record integrity disappeared");
check(contract.package_contract.whole_package_content_sha256 === true, "package integrity disappeared");
check(contract.package_contract.hidden_fields_rejected === true, "closed package schema disappeared");

check(sha256(migration) === contract.database_authority.migration_sha256, "portable import migration hash drifted");
check(migration.includes("auth.uid()"), "database import is not bound to auth.uid()");
check(!migration.includes("target_user_id"), "database import accepts a target user");
check(migration.includes("alter table public.portable_brain_imports enable row level security"), "receipt RLS disappeared");
check(migration.includes("unique (user_id, database_fingerprint)"), "database idempotency key disappeared");
check(migration.includes("'inferred'::public.verification_status"), "fact standing downgrade disappeared");
check(migration.includes("least(0.50::numeric"), "pattern confidence cap disappeared");
check(migration.includes("'emerging'"), "pattern standing downgrade disappeared");
check(migration.includes("revoke all on function public.import_portable_brain_package(jsonb) from public, anon"), "anonymous RPC denial disappeared");
check(contract.database_authority.rls_enabled === true, "hosted RLS proof drifted");
check(contract.database_authority.authenticated_direct_insert === false, "direct receipt insertion opened");
check(contract.database_authority.authenticated_owner_select === true, "owner receipt read disappeared");
check(contract.database_authority.anonymous_function_execute === false, "anonymous import execution opened");
check(contract.database_authority.atomic_transaction === true, "atomic import boundary disappeared");
check(contract.database_authority.stored_package_content === false, "raw package storage appeared");

const expectedFunctions = {
  "brain-portable-export": "supabase/functions/brain-portable-export/index.ts",
  "brain-portable-import": "supabase/functions/brain-portable-import/index.ts",
};
for (const entry of contract.hosted_functions) {
  check(expectedFunctions[entry.slug], `unexpected hosted route ${entry.slug}`);
  check(sha256(read(expectedFunctions[entry.slug])) === entry.source_sha256, `${entry.slug} source hash drifted`);
  check(entry.status === "ACTIVE" && entry.version === 1 && entry.verify_jwt === true, `${entry.slug} hosted posture drifted`);
  check(/^[0-9a-f]{64}$/.test(entry.hosted_bundle_sha256), `${entry.slug} hosted bundle hash is invalid`);
  check(new RegExp(`^\\[functions\\.${entry.slug}\\]\\s*\\r?\\nverify_jwt\\s*=\\s*true`, "m").test(config), `${entry.slug} gateway JWT config drifted`);
  const containmentEntry = containment.functions.find((item) => item.name === entry.slug);
  check(containmentEntry?.verify_jwt === true, `${entry.slug} containment gateway posture drifted`);
}
check(contract.hosted_functions.length === 2, "hosted portability route count drifted");
check(sha256(config) === contract.configuration.config_sha256, "function config hash drifted");
check(/^[0-9a-f]{64}$/.test(contract.configuration.containment_manifest_sha256), "deploy-time containment manifest hash is invalid");
check(containment.functions.length >= contract.configuration.containment_contract_count, "current containment coverage regressed below the R105 baseline");

check(sha256(read(contract.probe.path)) === contract.probe.sha256, "hosted probe hash drifted");
check(contract.probe.synthetic_users === 2, "two-user proof disappeared");
check(contract.probe.anonymous_export_status === 401, "anonymous export denial drifted");
check(contract.probe.owner_export_status === 200 && contract.probe.repeat_export_status === 200, "owner export proof drifted");
check(contract.probe.stable_package_fingerprint === true && contract.probe.stable_package_bytes === true, "deterministic export proof drifted");
check(contract.probe.exported_counts.total === 3, "exported record count drifted");
check(contract.probe.package_contains_source_user_id === false, "source user ID entered hosted package");
check(contract.probe.tampered_import_status === 400, "tamper rejection drifted");
check(contract.probe.wrong_media_status === 415 && contract.probe.wrong_method_status === 405, "HTTP guard proof drifted");
check(contract.probe.first_import_status === 200 && contract.probe.first_import_already_imported === false, "first import proof drifted");
check(contract.probe.first_import_counts.total === 3, "first import count drifted");
check(contract.probe.repeat_import_status === 200 && contract.probe.repeat_import_already_imported === true, "idempotent retry proof drifted");
check(contract.probe.repeat_import_counts.total === 0, "retry created records");
check(contract.probe.destination_guard_fact_preserved === true, "destination guard fact was lost");
check(contract.probe.imported_fact_standing === "inferred" && contract.probe.imported_fact_source === "manual", "imported fact standing drifted");
check(contract.probe.imported_pattern_standing === "emerging", "imported pattern standing drifted");
check(contract.probe.imported_pattern_confidence === 0.5 && contract.probe.imported_pattern_evidence_count === 1, "imported pattern evidence posture drifted");
check(contract.probe.imported_decision_source === "manual" && contract.probe.imported_decision_receipt_present === true, "imported decision receipt drifted");
check(contract.probe.source_fact_count_after_import === 1 && contract.probe.source_fact_standing_unchanged === true, "source Brain changed during import");
check(contract.probe.source_reliance_count_after_two_exports === 2, "export reliance proof drifted");
check(contract.probe.destination_receipt_count === 1 && contract.probe.source_receipt_count === 0, "receipt ownership drifted");
check(Object.values(contract.cleanup).every((count) => count === 0), "hosted fixtures remain");

check(contract.scope_boundary.complete_account_archive === false, "current package became a complete-archive claim");
check(contract.scope_boundary.cryptographic_source_authenticity === false, "unsigned package became authenticated provenance");
check(contract.scope_boundary.includes_superseded_or_archived_history === false, "historical coverage was fabricated");
check(contract.scope_boundary.github_delivery === false, "GitHub delivery was fabricated");
check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.production_functions_deployed === 0, "production deployment was claimed");
check(contract.authority.raw_secret_values_emitted_or_persisted === false, "raw secret persistence was claimed");
check(contract.authority.email_routes_open === false, "email gate opened");
check(contract.authority.payment_routes_open === false, "payment gate opened");
check(contract.authority.model_spend_routes_open === false, "model-spend gate opened");
check(contract.authority.legacy_retirement_open === false, "legacy retirement gate opened");

const combined = `${contractRaw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("Portability is not treated as proof of origin"), "standing boundary disappeared");
check(note.includes("not a complete account archive"), "archive limit disappeared");
check(qa.includes("Repeat import: 200, zero rows created"), "retry proof disappeared");
check(qa.includes("Production writes: zero"), "production boundary disappeared");

if (failures.length) {
  console.error(`[g25-portable-brain-roundtrip-r105] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-portable-brain-roundtrip-r105] PASS: deterministic current-Brain export and owner-bound idempotent import passed; complete archive remains open");
