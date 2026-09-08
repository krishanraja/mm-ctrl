import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const contractPath = path.join(root, 'project-documentation', 'ctrl-evolution', 'g14-decision-bench-implementation-contract.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

const equal = (actual, expected, label) => {
  if (actual !== expected) fail(`${label} expected ${expected}, got ${actual}`);
};

const includesAll = (actual, expected, label) => {
  for (const value of expected) if (!actual.includes(value)) fail(`${label} missing ${value}`);
};

const sha256 = (relativePath) => crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(root, relativePath)))
  .digest('hex');

equal(contract.schema_version, 'ctrl.g14.decision-bench.implementation.v1', 'schema_version');
equal(contract.status, 'founder_locked_contract', 'status');
equal(sha256(contract.approved_artifact.path), contract.approved_artifact.sha256, 'approved artifact SHA-256');
equal(
  sha256('project-documentation/ctrl-evolution/design/g14-private-brain-builder-fixture.json'),
  contract.approved_artifact.fixture_sha256,
  'fixture SHA-256',
);
equal(contract.surface.desktop_rule, 'no_page_scroll_1440x900', 'desktop rule');
equal(contract.surface.mobile_rule, 'one_work_region_at_a_time', 'mobile rule');
equal(contract.first_slice.write_policy, 'no_database_writes', 'first-slice write policy');
equal(contract.first_slice.data, 'synthetic_fixture_only', 'first-slice data policy');
equal(contract.first_slice.route_visibility, 'local_direct_url_only', 'first-slice route visibility');

includesAll(contract.projection.regions, [
  'decision_header',
  'meaning_comparison',
  'evidence_bench',
  'focused_brain_route',
  'next_session_move',
], 'projection regions');

includesAll(contract.projection.states, [
  'ready',
  'sparse',
  'quiet',
  'loading',
  'stale',
  'error',
  'rejected',
], 'projection states');

includesAll(contract.invariants, [
  'HISTORY_CANNOT_STEER',
  'EVIDENCE_EXACT_AND_INSPECTABLE',
  'PRIVATE_GUIDANCE_NON_DURABLE',
  'CUSTOMER_PROJECTION_AUDIENCE_SAFE',
  'NO_COMPUTED_PERMISSION_OR_CLEARANCE',
  'DESKTOP_NO_PAGE_SCROLL',
  'MOBILE_PROGRESSIVE_DISCLOSURE',
], 'invariants');

includesAll(contract.forbidden_shortcuts, [
  'cross_user_reads_through_service_role_in_browser',
  'user_memory_as_target_brain_ontology',
  'memory_edges_as_canonical_relationships',
  'private_guidance_in_customer_projection',
  'production_schema_or_account_creation_without_action_time_approval',
], 'forbidden shortcuts');

if (process.exitCode) process.exit(process.exitCode);
console.log('ok: G14 Decision Bench implementation contract');
console.log(`ok: ${contract.projection.regions.length} work regions, ${contract.projection.states.length} required states`);
console.log(`ok: ${contract.invariants.length} invariants, ${contract.forbidden_shortcuts.length} forbidden shortcuts`);
console.log('ok: approved proof and fixture hashes match');
