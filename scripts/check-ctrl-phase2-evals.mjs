import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const fixtureRel = 'project-documentation/ctrl-evolution/phase-2-evaluation-fixtures.json';
const contractRel = 'project-documentation/ctrl-evolution/phase-2-evaluation-fixture-contract.md';
const expectedSource = 'project-documentation/ctrl-evolution/phase-2-decision-brain-vertical-slice-contract.md';
const traceRel = 'project-documentation/ctrl-evolution/phase-2-decision-traceability.json';
const ledgerRel = 'project-documentation/ctrl-evolution/ledger.snapshot.jsonl';

const expectedGlobalFailures = [
  'cross_subject_or_cross_audience_context_use',
  'off_record_persistence',
  'ai_recommendation_before_human_prior',
  'invented_or_distorted_decision_bearing_evidence',
  'durable_memory_without_human_authority',
  'incomplete_correction_propagation',
  'duplicate_committed_effect_after_retry',
  'stale_or_superseded_context_presented_as_current',
  'nonhuman_authorship_of_owned_call',
  'export_audience_violation',
  'nonreproducible_or_nonimportable_release',
  'named_person_employment_recommendation',
];

const expectedArms = [
  'ordinary_chat',
  'static_package',
  'current_ctrl',
  'new_without_brain',
  'new_with_brain',
];

const expectedCriteria = [
  'frame_fidelity',
  'causal_sharpness',
  'evidence_integrity',
  'numerical_integrity',
  'independent_challenge',
  'meaningful_diversity',
  'personal_standard_use',
  'uncertainty_and_abstention',
  'human_agency',
  'practical_movement',
  'voice_sovereignty',
  'cognitive_economy',
];

const expectedFixtureIds = Array.from({ length: 12 }, (_, index) => `F${String(index + 1).padStart(2, '0')}`);
const expectedDecisionIds = Array.from({ length: 52 }, (_, index) => `D-${String(index + 1).padStart(3, '0')}`);
const allowedDispositions = new Set(['required_now', 'constrains_now', 'deferred_with_guardrail']);
const allowedProductSurfaces = new Set([
  'advisor_workspace',
  'brain',
  'category_intelligence',
  'collective_intelligence',
  'company_map',
  'content_outputs',
  'decision_entry',
  'decision_loop',
  'delivery_state',
  'design_system',
  'engagement_model',
  'evaluation',
  'evidence_orchestration',
  'export',
  'positioning',
  'recall',
]);
const allowedProofTypes = new Set(['architecture', 'deterministic', 'fixture', 'human', 'longitudinal', 'release']);
const secretPattern = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sbp_[A-Za-z0-9]{20,}|vcp_[A-Za-z0-9]{20,}|sk_(?:live|test)_[A-Za-z0-9]{16,})/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

function exactKeys(value, expected) {
  return isObject(value) && sameMembers(Object.keys(value), expected);
}

function uniqueNonemptyStrings(value) {
  return Array.isArray(value)
    && value.length > 0
    && value.every((item) => typeof item === 'string' && item.trim().length > 0)
    && new Set(value).size === value.length;
}

function uniqueStrings(value, { allowEmpty = false } = {}) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every((item) => typeof item === 'string' && item.trim().length > 0)
    && new Set(value).size === value.length;
}

function githubHeadingSlug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[`*~]/g, '')
    .replace(/&amp;/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function markdownAnchors(path) {
  const anchors = new Set();
  const seen = new Map();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (!match) continue;
    const base = githubHeadingSlug(match[1]);
    if (!base) continue;
    const duplicateIndex = seen.get(base) ?? 0;
    seen.set(base, duplicateIndex + 1);
    anchors.add(duplicateIndex === 0 ? base : `${base}-${duplicateIndex}`);
  }
  return anchors;
}

function parseLedgerDecisions(raw, failures) {
  const current = new Map();
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  for (let index = 0; index < lines.length; index += 1) {
    let row;
    try {
      row = JSON.parse(lines[index]);
    } catch (error) {
      failures.push(`ledger snapshot row ${index + 1} is invalid JSON: ${error.message}`);
      continue;
    }
    if (row?.record_type !== 'decision') continue;
    const prior = current.get(row.record_key);
    if (!prior || Number(row.version) > Number(prior.version)) current.set(row.record_key, row);
  }
  return current;
}

function validateTrace(trace, raw, ledgerDecisions) {
  const failures = [];
  const fail = (message) => failures.push(message);

  if (!isObject(trace)) return ['traceability root must be an object'];
  if (!exactKeys(trace, ['schema_version', 'status', 'authority', 'source_of_truth', 'decision_range', 'next_design_gate', 'entries'])) {
    fail('traceability root fields changed');
  }
  if (trace.schema_version !== 'ctrl.phase2.decision-traceability.v2') fail('traceability schema_version must remain v2');
  if (trace.status !== 'approved_product_rule') fail('traceability status must preserve the D-052 product-rule approval');
  if (trace.authority !== 'founder_approved_via_D-052') fail('traceability authority must point to D-052');
  if (trace.source_of_truth !== ledgerRel) fail('traceability source_of_truth must remain the canonical ledger snapshot');
  if (trace.decision_range !== 'D-001..D-052') fail('traceability decision_range must remain D-001..D-052');
  if (trace.next_design_gate !== 'D-052 approves the combined product rule; material implementation remains gated on explicit founder approval of the rendered first-surface synthesis.') {
    fail('traceability must preserve the rendered first-surface implementation gate');
  }

  const entries = Array.isArray(trace.entries) ? trace.entries : [];
  const ids = entries.map((entry) => entry?.decision_id);
  if (ids.length !== expectedDecisionIds.length || !ids.every((id, index) => id === expectedDecisionIds[index])) {
    fail('traceability entries must be ordered, unique and complete from D-001 through D-052');
  }

  for (const entry of entries) {
    const id = entry?.decision_id ?? '<unknown>';
    if (!exactKeys(entry, ['decision_id', 'decision_version', 'disposition', 'product_surfaces', 'contract_refs', 'fixture_ids', 'proof_types', 'exit_evidence', 'failure_if_lost'])) {
      fail(`${id}: traceability entry fields changed`);
    }
    if (!Number.isInteger(entry?.decision_version) || entry.decision_version < 1) fail(`${id}: decision_version must be a positive integer`);
    if (!allowedDispositions.has(entry?.disposition)) fail(`${id}: invalid disposition`);

    if (!uniqueStrings(entry?.product_surfaces)) fail(`${id}: product_surfaces must contain unique nonempty values`);
    else for (const surface of entry.product_surfaces) if (!allowedProductSurfaces.has(surface)) fail(`${id}: unknown product surface ${surface}`);

    if (!uniqueStrings(entry?.contract_refs)) fail(`${id}: contract_refs must contain unique nonempty values`);
    else {
      for (const ref of entry.contract_refs) {
        const splitIndex = ref.lastIndexOf('#');
        if (splitIndex <= 0 || splitIndex === ref.length - 1) {
          fail(`${id}: contract reference must include a file and heading anchor: ${ref}`);
          continue;
        }
        const rel = ref.slice(0, splitIndex);
        const anchor = ref.slice(splitIndex + 1);
        if (!rel.startsWith('project-documentation/ctrl-evolution/') || rel.includes('..') || !rel.endsWith('.md')) {
          fail(`${id}: contract reference is outside the approved documentation boundary: ${ref}`);
          continue;
        }
        const path = join(root, rel);
        if (!existsSync(path)) {
          fail(`${id}: contract file is missing: ${rel}`);
          continue;
        }
        if (!markdownAnchors(path).has(anchor)) fail(`${id}: contract heading is missing: ${ref}`);
      }
    }

    if (!uniqueStrings(entry?.fixture_ids, { allowEmpty: true })) fail(`${id}: fixture_ids must contain unique nonempty values`);
    else for (const fixtureId of entry.fixture_ids) if (!expectedFixtureIds.includes(fixtureId)) fail(`${id}: unknown fixture ${fixtureId}`);

    if (!uniqueStrings(entry?.proof_types)) fail(`${id}: proof_types must contain unique nonempty values`);
    else for (const proofType of entry.proof_types) if (!allowedProofTypes.has(proofType)) fail(`${id}: unknown proof type ${proofType}`);

    for (const field of ['exit_evidence', 'failure_if_lost']) {
      if (typeof entry?.[field] !== 'string' || entry[field].trim().length === 0) fail(`${id}: ${field} must be a nonempty string`);
    }

    const decision = ledgerDecisions.get(id);
    if (!decision) fail(`${id}: current decision is missing from the ledger snapshot`);
    else {
      if (decision.version !== entry.decision_version) fail(`${id}: traceability version ${entry.decision_version} does not match ledger version ${decision.version}`);
      if (decision.state !== 'final' || decision.content?.state !== 'final') fail(`${id}: ledger decision is not final`);
      if (decision.authority !== 'user') fail(`${id}: ledger decision does not have user authority`);
    }
  }

  for (const id of expectedDecisionIds) if (!ledgerDecisions.has(id)) fail(`ledger snapshot is missing ${id}`);
  if (ledgerDecisions.size !== expectedDecisionIds.length) fail('ledger decision set has drifted beyond D-001 through D-052 without a traceability update');

  const serialized = JSON.stringify(trace);
  if (secretPattern.test(serialized)) fail('traceability contains credential-shaped content');
  if (/\u2014/.test(serialized)) fail('traceability contains an em dash');
  if (/"(?:generated_at|exported_at|current_timestamp|run_timestamp)"\s*:/.test(serialized)) fail('traceability contains a volatile timestamp field');
  if (raw !== null && raw !== `${JSON.stringify(trace, null, 2)}\n`) fail('traceability file must be canonical two-space JSON with one trailing newline');

  return failures;
}

function runTraceNegativeProbes(trace, ledgerDecisions) {
  const probes = [
    ['missing D-052', (copy) => copy.entries.pop()],
    ['wrong D-017 version', (copy) => { copy.entries[16].decision_version = 1; }],
    ['lost founder decision authority', (copy) => { copy.status = 'provisional'; copy.authority = 'agent_synthesis_not_founder_approval'; }],
    ['unknown trace fixture', (copy) => { copy.entries[0].fixture_ids[0] = 'F99'; }],
    ['broken contract reference', (copy) => { copy.entries[0].contract_refs[0] = 'project-documentation/ctrl-evolution/README.md#not-a-real-heading'; }],
    ['unknown product surface', (copy) => { copy.entries[0].product_surfaces[0] = 'magic_dashboard'; }],
  ];

  const failures = [];
  for (const [name, mutate] of probes) {
    const copy = structuredClone(trace);
    mutate(copy);
    if (validateTrace(copy, null, ledgerDecisions).length === 0) failures.push(`negative trace probe escaped validation: ${name}`);
  }
  return { failures, count: probes.length };
}

function validatePack(pack, raw = null) {
  const failures = [];
  const fail = (message) => failures.push(message);

  if (!isObject(pack)) return ['root must be an object'];
  if (pack.schema_version !== 'ctrl.phase2.evaluation-fixtures.v1') fail('schema_version must remain v1');
  if (pack.status !== 'provisional') fail('status must remain provisional until the founder gate is recorded');
  if (pack.authority !== 'agent_synthesis_not_founder_approval') fail('authority must not imply founder approval');
  if (pack.source_contract !== expectedSource) fail('source_contract does not match the canonical slice contract');
  if (pack.data_classification !== 'synthetic_or_sanitised_internal') fail('fixture data classification changed');

  if (!sameMembers(pack.global_blocking_failures, expectedGlobalFailures)) fail('global blocking failures changed or duplicated');
  if (!sameMembers(pack.comparator_arms, expectedArms)) fail('comparator arms changed or duplicated');

  if (!isObject(pack.qualitative_scale)) fail('qualitative_scale must be an object');
  else {
    if (pack.qualitative_scale.minimum !== 0 || pack.qualitative_scale.maximum !== 4) fail('qualitative scale must remain 0 to 4');
    if (!sameMembers(pack.qualitative_scale.criteria, expectedCriteria)) fail('qualitative criteria changed or duplicated');
  }

  const fixtures = Array.isArray(pack.fixtures) ? pack.fixtures : [];
  if (!sameMembers(fixtures.map((fixture) => fixture?.fixture_id), expectedFixtureIds)) fail('fixtures must contain unique F01 through F12');
  const fixtureIds = new Set(fixtures.map((fixture) => fixture?.fixture_id));

  if (!isObject(pack.global_invariant_fixture_map)) fail('global_invariant_fixture_map must be an object');
  else {
    if (!sameMembers(Object.keys(pack.global_invariant_fixture_map), expectedGlobalFailures)) fail('invariant map must cover exactly the global failures');
    for (const [invariant, mappedIds] of Object.entries(pack.global_invariant_fixture_map)) {
      if (!uniqueNonemptyStrings(mappedIds)) fail(`${invariant}: fixture map must contain unique fixture ids`);
      for (const id of mappedIds ?? []) if (!fixtureIds.has(id)) fail(`${invariant}: unknown fixture ${id}`);
    }
  }

  const allowedPrivacy = new Set(['synthetic', 'sanitised_founder_case']);
  const visibleKeys = ['decision', 'human_prior', 'settledness', 'change_condition', 'evidence', 'eligible_brain_context'];
  const expectedKeys = ['primary_criteria', 'required_properties', 'allowed_end_states', 'memory_result', 'blocking_failures'];
  const sourceKeys = ['id', 'claim', 'status'];
  const brainKeys = new Set(['id', 'state', 'audience', 'content', 'age', 'applicability']);

  for (const fixture of fixtures) {
    const id = fixture?.fixture_id ?? '<unknown>';
    if (!exactKeys(fixture, ['fixture_id', 'title', 'fixture_class', 'privacy', 'visible_to_candidate', 'hidden_expected'])) {
      fail(`${id}: fixture fields changed or hidden material leaked into the visible envelope`);
    }
    for (const field of ['title', 'fixture_class']) {
      if (typeof fixture?.[field] !== 'string' || fixture[field].trim().length === 0) fail(`${id}: ${field} must be a nonempty string`);
    }
    if (!allowedPrivacy.has(fixture?.privacy)) fail(`${id}: unapproved privacy class`);

    const visible = fixture?.visible_to_candidate;
    if (!exactKeys(visible, visibleKeys)) fail(`${id}: visible_to_candidate fields changed`);
    for (const field of ['decision', 'human_prior', 'settledness', 'change_condition']) {
      if (typeof visible?.[field] !== 'string' || visible[field].trim().length === 0) fail(`${id}: visible ${field} must be a nonempty string`);
    }
    if (!Array.isArray(visible?.evidence) || visible.evidence.length === 0) fail(`${id}: evidence must be nonempty`);
    else {
      const evidenceIds = [];
      for (const source of visible.evidence) {
        if (!exactKeys(source, sourceKeys)) fail(`${id}: evidence source fields changed`);
        for (const field of sourceKeys) if (typeof source?.[field] !== 'string' || source[field].trim().length === 0) fail(`${id}: evidence ${field} must be nonempty`);
        evidenceIds.push(source?.id);
      }
      if (new Set(evidenceIds).size !== evidenceIds.length) fail(`${id}: duplicate evidence id`);
    }

    if (!Array.isArray(visible?.eligible_brain_context)) fail(`${id}: eligible_brain_context must be an array`);
    else {
      const brainIds = [];
      for (const item of visible.eligible_brain_context) {
        if (!isObject(item) || Object.keys(item).some((key) => !brainKeys.has(key))) fail(`${id}: Brain context fields changed`);
        for (const field of ['id', 'state', 'audience', 'content']) {
          if (typeof item?.[field] !== 'string' || item[field].trim().length === 0) fail(`${id}: Brain ${field} must be nonempty`);
        }
        brainIds.push(item?.id);
      }
      if (new Set(brainIds).size !== brainIds.length) fail(`${id}: duplicate Brain context id`);
    }

    const expected = fixture?.hidden_expected;
    if (!exactKeys(expected, expectedKeys)) fail(`${id}: hidden_expected fields changed`);
    if (!uniqueNonemptyStrings(expected?.primary_criteria)) fail(`${id}: primary_criteria must be unique and nonempty`);
    else for (const criterion of expected.primary_criteria) if (!expectedCriteria.includes(criterion)) fail(`${id}: unknown criterion ${criterion}`);
    for (const field of ['required_properties', 'allowed_end_states', 'blocking_failures']) {
      if (!uniqueNonemptyStrings(expected?.[field])) fail(`${id}: ${field} must contain unique nonempty strings`);
    }
    if (typeof expected?.memory_result !== 'string' || expected.memory_result.trim().length === 0) fail(`${id}: memory_result must be nonempty`);
  }

  const serialized = JSON.stringify(pack);
  if (secretPattern.test(serialized)) fail('credential-shaped content detected');
  if (/\u2014/.test(serialized)) fail('em dash detected');
  if (/"(?:generated_at|exported_at|current_timestamp|run_timestamp)"\s*:/.test(serialized)) fail('volatile timestamp field detected');
  if (raw !== null && raw !== `${JSON.stringify(pack, null, 2)}\n`) fail('fixture file must be canonical two-space JSON with one trailing newline');

  return failures;
}

function runNegativeProbes(pack) {
  const probes = [
    ['missing fixture', (copy) => copy.fixtures.pop()],
    ['unmapped invariant', (copy) => { copy.global_invariant_fixture_map.off_record_persistence = []; }],
    ['visible hidden field', (copy) => { copy.fixtures[0].visible_to_candidate.hidden_expected = {}; }],
    ['credential shape', (copy) => { copy.fixtures[0].title = `ghp_${'A'.repeat(24)}`; }],
    ['em dash', (copy) => { copy.fixtures[0].title = 'invalid\u2014title'; }],
    ['duplicate evidence id', (copy) => { copy.fixtures[0].visible_to_candidate.evidence[1].id = copy.fixtures[0].visible_to_candidate.evidence[0].id; }],
    ['unknown criterion', (copy) => { copy.fixtures[0].hidden_expected.primary_criteria[0] = 'agree_with_user'; }],
    ['fabricated approval', (copy) => { copy.status = 'final'; copy.authority = 'founder_approved'; }],
  ];

  const failures = [];
  for (const [name, mutate] of probes) {
    const copy = structuredClone(pack);
    mutate(copy);
    if (validatePack(copy).length === 0) failures.push(`negative probe escaped validation: ${name}`);
  }
  return { failures, count: probes.length };
}

const fixturePath = join(root, fixtureRel);
const contractPath = join(root, contractRel);
const sourcePath = join(root, expectedSource);
const tracePath = join(root, traceRel);
const ledgerPath = join(root, ledgerRel);
const failures = [];

for (const [label, path] of [['fixture pack', fixturePath], ['evaluation contract', contractPath], ['source contract', sourcePath], ['decision traceability', tracePath], ['ledger snapshot', ledgerPath]]) {
  if (!existsSync(path)) failures.push(`${label} is missing`);
}

let raw = '';
let pack = null;
let traceRaw = '';
let trace = null;
let ledgerDecisions = new Map();
if (existsSync(fixturePath)) {
  raw = readFileSync(fixturePath, 'utf8');
  try {
    pack = JSON.parse(raw);
  } catch (error) {
    failures.push(`fixture JSON parse failed: ${error.message}`);
  }
}

if (existsSync(ledgerPath)) ledgerDecisions = parseLedgerDecisions(readFileSync(ledgerPath, 'utf8'), failures);

if (existsSync(tracePath)) {
  traceRaw = readFileSync(tracePath, 'utf8');
  try {
    trace = JSON.parse(traceRaw);
  } catch (error) {
    failures.push(`traceability JSON parse failed: ${error.message}`);
  }
}

let traceProbes = { failures: [], count: 0 };
if (trace) {
  failures.push(...validateTrace(trace, traceRaw, ledgerDecisions));
  traceProbes = runTraceNegativeProbes(trace, ledgerDecisions);
  failures.push(...traceProbes.failures);
}

if (pack) {
  failures.push(...validatePack(pack, raw));
  const probes = runNegativeProbes(pack);
  failures.push(...probes.failures);

  if (existsSync(contractPath)) {
    const contract = readFileSync(contractPath, 'utf8');
    for (const id of expectedFixtureIds) if (!contract.includes(`\`${id}\``)) failures.push(`evaluation contract does not reference ${id}`);
    if (!contract.includes('Passing twelve designed fixtures')) failures.push('evaluation contract is missing the synthetic-evidence limit');
    if (contract.includes('\u2014')) failures.push('evaluation contract contains an em dash');
  }

  if (!failures.length) {
    const hash = createHash('sha256').update(raw, 'utf8').digest('hex');
    const traceHash = createHash('sha256').update(traceRaw, 'utf8').digest('hex');
    console.log(`ok: CTRL Phase 2 fixture pack ${pack.fixtures.length} fixtures, ${pack.global_blocking_failures.length} blocking invariants`);
    console.log(`ok: decision traceability ${trace.entries.length} locked decisions through D-052`);
    console.log(`ok: ${probes.count + traceProbes.count} negative mutation probes rejected`);
    console.log(`ok: canonical fixture SHA-256 ${hash}`);
    console.log(`ok: canonical traceability SHA-256 ${traceHash}`);
  }
}

if (failures.length) {
  console.error(`CTRL Phase 2 evaluation check failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
