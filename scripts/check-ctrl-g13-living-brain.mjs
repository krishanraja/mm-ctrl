import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const contractPath = join(root, 'project-documentation/ctrl-evolution/g13-living-brain-contract.json');
const fixturesPath = join(root, 'project-documentation/ctrl-evolution/g13-living-brain-proof-fixtures.json');

const contractRaw = readFileSync(contractPath, 'utf8');
const fixturesRaw = readFileSync(fixturesPath, 'utf8');
const contract = JSON.parse(contractRaw);
const pack = JSON.parse(fixturesRaw);

const failures = [];
const report = [];

const clone = (value) => structuredClone(value);
const bytewise = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);
const unique = (values) => [...new Set(values)];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(bytewise).map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalRef(itemVersion) {
  return `item:${itemVersion.brain_item_id}@v${itemVersion.version}`;
}

function audienceToken(audience) {
  return `${audience.kind}:${audience.scope_id}`;
}

function canView(audience, viewer) {
  return viewer.audience_grants.includes(audienceToken(audience));
}

function inValidTime(item, asOf) {
  const at = Date.parse(asOf);
  const start = Date.parse(item.valid_from);
  const end = item.valid_until === null ? Number.POSITIVE_INFINITY : Date.parse(item.valid_until);
  return Number.isFinite(at) && Number.isFinite(start) && start <= at && at < end;
}

function isConfidentItem(item, viewer, taskContext) {
  return contract.projection_contract.confident_maturity.includes(item.maturity)
    && contract.projection_contract.confident_standing.includes(item.standing)
    && item.consequence_permission !== 'prohibited_in_context'
    && item.subject_id === viewer.subject_id
    && canView(item.audience, viewer)
    && inValidTime(item, taskContext.as_of);
}

function decisionRef(decision) {
  return `decision:${decision.id}`;
}

function isVisibleDecision(decision, viewer) {
  return decision.standing === 'current'
    && decision.subject_id === viewer.subject_id
    && decision.consequence_permission !== 'prohibited_in_context'
    && canView(decision.audience, viewer);
}

function relevanceForItem(item, taskContext) {
  let score = item.maturity === 'trusted' ? 2 : 1;
  if (item.applicability.domains.includes(taskContext.domain)) score += 4;
  if (item.applicability.roles.includes(taskContext.role)) score += 2;
  if (item.applicability.tasks.includes(taskContext.task)) score += 3;
  return score;
}

function buildProjection(state, viewer, taskContext) {
  const items = state.item_versions
    .filter((item) => isConfidentItem(item, viewer, taskContext))
    .map((item) => ({ item, ref: canonicalRef(item), relevance: relevanceForItem(item, taskContext) }));
  const decisions = state.decisions
    .filter((decision) => isVisibleDecision(decision, viewer))
    .map((decision) => ({ decision, ref: decisionRef(decision), relevance: 10 }));

  const sections = Object.fromEntries(contract.human_views.map((view) => [view, []]));
  const portraitEntries = [
    ...items.map((entry) => ({ ...entry, kind: 'brain_item' })),
    ...decisions.map((entry) => ({ ...entry, kind: 'decision' })),
  ]
    .sort((a, b) => b.relevance - a.relevance || bytewise(a.ref, b.ref))
    .slice(0, contract.projection_contract.portrait_card_budget);
  for (const entry of portraitEntries.filter((candidate) => candidate.kind === 'brain_item')) {
    for (const view of entry.item.human_views) {
      sections[view].push({
        canonical_ref: entry.ref,
        kind: 'brain_item',
        item_type: entry.item.item_type,
        meaning: entry.item.meaning,
        maturity: entry.item.maturity,
        standing: entry.item.standing,
      });
    }
  }
  for (const entry of portraitEntries.filter((candidate) => candidate.kind === 'decision')) {
    sections.my_calls.push({
      canonical_ref: entry.ref,
      kind: 'decision',
      meaning: entry.decision.owned_call,
      standing: entry.decision.standing,
    });
  }
  for (const view of contract.human_views) {
    sections[view].sort((a, b) => bytewise(a.canonical_ref, b.canonical_ref));
  }

  const mapNodes = [
    ...items.map((entry) => ({
      canonical_ref: entry.ref,
      kind: 'brain_item',
      item_type: entry.item.item_type,
      meaning: entry.item.meaning,
      display_weight: entry.relevance >= 6 ? 'focus' : 'context',
      relevance: entry.relevance,
    })),
    ...decisions.map((entry) => ({
      canonical_ref: entry.ref,
      kind: 'decision',
      item_type: 'decision',
      meaning: entry.decision.owned_call,
      display_weight: 'focus',
      relevance: entry.relevance,
    })),
  ].sort((a, b) => bytewise(a.canonical_ref, b.canonical_ref));

  const nodeRefs = new Set(mapNodes.map((node) => node.canonical_ref));
  const semanticEdges = state.relations
    .filter((relation) => relation.standing === 'current')
    .filter((relation) => contract.projection_contract.confident_maturity.includes(relation.maturity))
    .filter((relation) => relation.consequence_permission !== 'prohibited_in_context')
    .filter((relation) => canView(relation.audience, viewer))
    .filter((relation) => nodeRefs.has(relation.from_ref) && nodeRefs.has(relation.to_ref))
    .map((relation) => ({
      id: relation.id,
      relationship_id: relation.relationship_id,
      from_ref: relation.from_ref,
      to_ref: relation.to_ref,
      relation_type: relation.relation_type,
      meaning: relation.meaning,
      maturity: relation.maturity,
      semantic: true,
    }))
    .sort((a, b) => bytewise(a.id, b.id));

  const layoutLinks = mapNodes.map((node) => ({
    id: `layout:subject:${node.canonical_ref}`,
    from_ref: `subject:${state.workspace.subject_id}`,
    to_ref: node.canonical_ref,
    kind: 'layout_tether',
    semantic: false,
  }));

  const portraitRefs = unique(contract.human_views.flatMap((view) => sections[view].map((card) => card.canonical_ref))).sort(bytewise);
  const mapNodeRefs = mapNodes.map((node) => node.canonical_ref).sort(bytewise);

  return {
    contract_version: contract.schema_version,
    workspace_id: state.workspace.id,
    subject_id: state.workspace.subject_id,
    portrait: {
      sections,
      canonical_refs: portraitRefs,
    },
    living_map: {
      nodes: mapNodes,
      canonical_refs: mapNodeRefs,
      semantic_edges: semanticEdges,
      layout_links: layoutLinks,
    },
  };
}

function mapWindow(projection, level, focusRef = null) {
  const nodes = projection.living_map.nodes;
  if (level === 'item_and_evidence') {
    return nodes.filter((node) => node.canonical_ref === focusRef);
  }
  if (level === 'neighbourhood') {
    const connected = new Set([focusRef]);
    for (const edge of projection.living_map.semantic_edges) {
      if (edge.from_ref === focusRef) connected.add(edge.to_ref);
      if (edge.to_ref === focusRef) connected.add(edge.from_ref);
    }
    const ordered = nodes
      .filter((node) => connected.has(node.canonical_ref))
      .sort((a, b) => b.relevance - a.relevance || bytewise(a.canonical_ref, b.canonical_ref));
    return ordered.slice(0, contract.projection_contract.map_neighbourhood_budget);
  }
  return [...nodes]
    .sort((a, b) => b.relevance - a.relevance || bytewise(a.canonical_ref, b.canonical_ref))
    .slice(0, contract.projection_contract.map_orientation_budget);
}

function validateState(state) {
  const errors = [];
  const add = (code) => errors.push(code);
  const workspaceId = state.workspace.id;
  const sourceIds = new Set(state.sources.map((source) => source.id));
  const sourcesById = new Map(state.sources.map((source) => [source.id, source]));
  const assertionIds = new Set(state.assertions.map((assertion) => assertion.id));
  const assertionsById = new Map(state.assertions.map((assertion) => [assertion.id, assertion]));
  const itemIds = new Set(state.item_versions.map((item) => item.id));
  const itemRefs = new Map(state.item_versions.map((item) => [canonicalRef(item), item]));

  for (const entity of [
    ...state.sources,
    ...state.assertions,
    ...state.item_versions,
    ...state.relations,
    ...state.decisions,
    ...state.learning_proposals,
    ...state.dependencies,
    ...state.corrections,
    ...state.repair_receipts,
  ]) {
    if (entity.workspace_id !== workspaceId) add('WORKSPACE_SCOPE_MATCH');
  }

  for (const assertion of state.assertions) {
    if (!sourceIds.has(assertion.source_id)
      || !assertion.source_span
      || !Number.isInteger(assertion.source_span.start)
      || !Number.isInteger(assertion.source_span.end)
      || !assertion.source_span.integrity_hash) {
      add('ASSERTION_PROVENANCE_REQUIRED');
    }
  }

  const byBrainItem = new Map();
  for (const item of state.item_versions) {
    if (!contract.brain_item_types.includes(item.item_type)
      || !contract.axes.maturity.includes(item.maturity)
      || !contract.axes.standing.includes(item.standing)
      || !contract.epistemic_basis.includes(item.epistemic_basis)
      || !contract.axes.audience.includes(item.audience.kind)
      || !contract.axes.consequence_permission.includes(item.consequence_permission)
      || item.subject_id !== state.workspace.subject_id
      || item.owner_id !== state.workspace.owner_id) {
      add('WORKSPACE_SCOPE_MATCH');
    }
    if (item.evidence_assertion_ids.some((id) => !assertionIds.has(id))) add('ASSERTION_PROVENANCE_REQUIRED');
    for (const assertionId of [...item.evidence_assertion_ids, ...item.counterevidence_assertion_ids]) {
      const assertion = assertionsById.get(assertionId);
      const source = assertion ? sourcesById.get(assertion.source_id) : null;
      if (source && audienceToken(source.audience) !== audienceToken(item.audience) && !item.audience_authorization_id) {
        add('EVIDENCE_AUDIENCE_CEILING');
      }
    }
    if (item.maturity === 'trusted' && item.confidence.human_confirmation < 1) add('DURABLE_HUMAN_AUTHORITY_REQUIRED');
    if (!byBrainItem.has(item.brain_item_id)) byBrainItem.set(item.brain_item_id, []);
    byBrainItem.get(item.brain_item_id).push(item);
  }

  for (const versions of byBrainItem.values()) {
    const ordered = [...versions].sort((a, b) => a.version - b.version);
    for (let index = 0; index < ordered.length; index += 1) {
      if (ordered[index].version !== index + 1) add('ITEM_VERSION_SEQUENCE_VALID');
      if (index === 0 && ordered[index].predecessor_version_id !== null) add('ITEM_VERSION_SEQUENCE_VALID');
      if (index > 0 && ordered[index].predecessor_version_id !== ordered[index - 1].id) add('ITEM_VERSION_SEQUENCE_VALID');
    }
    if (versions.filter((item) => item.standing === 'current').length !== 1) add('ONE_CURRENT_VERSION_PER_ITEM');
  }

  for (const relation of state.relations) {
    if (!contract.relation_types[relation.relation_type]
      || !contract.axes.maturity.includes(relation.maturity)
      || !contract.axes.standing.includes(relation.standing)
      || !contract.axes.audience.includes(relation.audience.kind)
      || !contract.axes.consequence_permission.includes(relation.consequence_permission)) {
      add('WORKSPACE_SCOPE_MATCH');
    }
    if (relation.standing === 'current') {
      const from = itemRefs.get(relation.from_ref);
      const to = itemRefs.get(relation.to_ref);
      if (!from || !to || from.standing !== 'current' || to.standing !== 'current') add('CURRENT_RELATION_ENDPOINTS_CURRENT');
    }
    if (contract.relation_types[relation.relation_type]?.requires_evidence
      && (relation.evidence_assertion_ids.length === 0
        || relation.evidence_assertion_ids.some((id) => !assertionIds.has(id)))) {
      add('RELATION_EVIDENCE_REQUIRED');
    }
    for (const assertionId of relation.evidence_assertion_ids) {
      const assertion = assertionsById.get(assertionId);
      const source = assertion ? sourcesById.get(assertion.source_id) : null;
      if (source && audienceToken(source.audience) !== audienceToken(relation.audience) && !relation.audience_authorization_id) {
        add('EVIDENCE_AUDIENCE_CEILING');
      }
    }
  }

  for (const proposal of state.learning_proposals) {
    if (!itemIds.has(proposal.candidate_version_id)) add('ASSERTION_PROVENANCE_REQUIRED');
  }

  const dependencyIds = new Set(state.dependencies.map((dependency) => dependency.id));
  for (const correction of state.corrections) {
    const prior = state.item_versions.find((item) => item.id === correction.prior_version_id);
    const next = state.item_versions.find((item) => item.predecessor_version_id === correction.prior_version_id);
    if (!prior || !next || prior.standing !== 'superseded' || prior.superseded_by_version_id !== next.id) add('CORRECTION_APPEND_ONLY');
    const affected = state.dependencies.filter((dependency) => dependency.source_ref === canonicalRef(prior));
    const receipts = state.repair_receipts.filter((receipt) => receipt.correction_id === correction.id);
    if (receipts.length !== affected.length
      || unique(receipts.map((receipt) => receipt.dependency_id)).length !== affected.length
      || receipts.some((receipt) => !dependencyIds.has(receipt.dependency_id))) {
      add('REPAIR_COVERAGE_COMPLETE');
    }
    for (const receipt of receipts) {
      const dependency = state.dependencies.find((candidate) => candidate.id === receipt.dependency_id);
      if (dependency?.consequence === 'human_review'
        && receipt.outcome !== 'review_required'
        && receipt.actor_type !== 'human') {
        add('CONSEQUENTIAL_REPAIR_REQUIRES_HUMAN');
      }
    }
  }

  return unique(errors).sort(bytewise);
}

function applyCorrection(inputState, correction) {
  if (inputState.corrections.some((existing) => existing.idempotency_key === correction.idempotency_key)) return clone(inputState);
  const state = clone(inputState);
  const prior = state.item_versions.find((item) => item.id === correction.prior_version_id);
  if (!prior) throw new Error(`Unknown correction prior ${correction.prior_version_id}`);

  prior.standing = 'superseded';
  prior.valid_until = correction.new_version.valid_from;
  prior.superseded_by_version_id = correction.new_version.id;
  state.item_versions.push(clone(correction.new_version));

  for (const replacement of correction.relation_replacements) {
    const oldRelation = state.relations.find((relation) => relation.id === replacement.prior_relation_id);
    if (!oldRelation) throw new Error(`Unknown relation prior ${replacement.prior_relation_id}`);
    oldRelation.standing = 'superseded';
    oldRelation.superseded_by_version_id = replacement.new_relation.id;
    state.relations.push(clone(replacement.new_relation));
  }

  const persistedCorrection = clone(correction);
  delete persistedCorrection.new_version;
  delete persistedCorrection.relation_replacements;
  delete persistedCorrection.repairs;
  state.corrections.push(persistedCorrection);
  for (const repair of correction.repairs) {
    state.repair_receipts.push({
      id: `receipt:${correction.id}:${repair.dependency_id}`,
      workspace_id: correction.workspace_id,
      correction_id: correction.id,
      dependency_id: repair.dependency_id,
      outcome: repair.outcome,
      actor_type: repair.actor_type,
    });
  }
  return state;
}

function generatedScaleState(recipe) {
  const workspace = { id: 'workspace-scale', subject_id: 'person-scale', owner_id: 'person-scale' };
  const source = {
    id: 'source-scale', workspace_id: workspace.id, source_type: 'synthetic_fixture', actor_id: workspace.subject_id,
    captured_at: '2026-09-07T00:00:00Z', audience: { kind: 'person_private', scope_id: workspace.subject_id },
    purpose: 'contract_scale_test', integrity_hash: `sha256:${recipe.seed}`,
  };
  const types = contract.brain_item_types;
  const viewsByType = {
    aim: ['what_matters'], standard: ['how_i_judge'], preference: ['how_i_judge'], pattern: ['how_i_judge'],
    example: ['how_i_judge'], tension: ['unresolved'], context: ['what_matters'],
  };
  const assertions = [];
  const itemVersions = [];
  for (let index = 0; index < recipe.item_count; index += 1) {
    const number = String(index).padStart(3, '0');
    const type = types[index % types.length];
    assertions.push({
      id: `scale-assertion-${number}`, workspace_id: workspace.id, source_id: source.id, subject_id: workspace.subject_id,
      speaker_id: workspace.subject_id, epistemic_basis: 'user_stated', statement: `Scale assertion ${number}`,
      source_span: { start: index * 10, end: index * 10 + 9, integrity_hash: `sha256:scale-assertion-${number}` },
    });
    itemVersions.push({
      id: `scale-item-version-${number}`, brain_item_id: `scale-item-${number}`, version: 1, workspace_id: workspace.id,
      subject_id: workspace.subject_id, owner_id: workspace.owner_id, item_type: type, meaning: `Scale item ${number}`,
      human_views: viewsByType[type], epistemic_basis: 'user_stated', maturity: index % 5 === 0 ? 'trusted' : 'held', standing: 'current',
      audience: { kind: 'person_private', scope_id: workspace.subject_id }, consequence_permission: 'suggest_or_retrieve',
      applicability: { domains: index % 3 === 0 ? ['marketing'] : [], roles: [], tasks: [], conditions: [], exclusions: [] },
      evidence_assertion_ids: [`scale-assertion-${number}`], counterevidence_assertion_ids: [], exceptions: [],
      confidence: { evidence_quality: 1, corroboration: 0.5, recency: 1, transfer: 0.5, human_confirmation: 1 },
      valid_from: '2026-09-07T00:00:00Z', valid_until: null, recorded_at: '2026-09-07T00:00:00Z',
      predecessor_version_id: null, superseded_by_version_id: null,
    });
  }
  const relations = [];
  for (let index = 0; index < recipe.relation_count; index += 1) {
    const fromIndex = index % recipe.item_count;
    const hop = 1 + Math.floor(index / recipe.item_count);
    const toIndex = (fromIndex + hop) % recipe.item_count;
    const fromNumber = String(fromIndex).padStart(3, '0');
    const toNumber = String(toIndex).padStart(3, '0');
    relations.push({
      id: `scale-relation-${String(index).padStart(3, '0')}`, relationship_id: `scale-relationship-${String(index).padStart(3, '0')}`,
      version: 1, workspace_id: workspace.id, from_ref: `item:scale-item-${fromNumber}@v1`, to_ref: `item:scale-item-${toNumber}@v1`,
      relation_type: index % 4 === 0 ? 'qualifies' : 'supports', meaning: `Scale relation ${index}`,
      evidence_assertion_ids: [`scale-assertion-${fromNumber}`, `scale-assertion-${toNumber}`], epistemic_basis: 'user_stated',
      maturity: 'held', standing: 'current', audience: { kind: 'person_private', scope_id: workspace.subject_id },
      consequence_permission: 'suggest_or_retrieve', predecessor_version_id: null, superseded_by_version_id: null,
    });
  }
  return {
    workspace, sources: [source], assertions, item_versions: itemVersions, relations, decisions: [], learning_proposals: [],
    dependencies: [], corrections: [], repair_receipts: [], releases: [],
  };
}

function sameArrays(actual, expected) {
  return stableStringify(actual) === stableStringify(expected);
}

function checkFixture(fixture) {
  const base = clone(pack.base_state);
  if (fixture.mode === 'project') {
    const errors = validateState(base);
    const projection = buildProjection(base, pack.viewer, pack.task_context);
    const actualEdges = projection.living_map.semantic_edges.map((edge) => edge.id);
    const omitted = fixture.expected.omitted_refs.every((ref) => !projection.living_map.canonical_refs.includes(ref));
    const parity = sameArrays(projection.portrait.canonical_refs, projection.living_map.canonical_refs);
    if (errors.length || !sameArrays(projection.portrait.canonical_refs, fixture.expected.portrait_refs)
      || !sameArrays(projection.living_map.canonical_refs, fixture.expected.map_node_refs)
      || !sameArrays(actualEdges, fixture.expected.semantic_edge_ids) || !omitted || !parity) return false;
    return true;
  }

  if (fixture.mode === 'inject_invalid_relation') {
    base.relations.push(clone(fixture.relation));
    return sameArrays(validateState(base), fixture.expected_error_codes);
  }

  if (fixture.mode === 'project_as_viewer') {
    const projection = buildProjection(base, fixture.viewer, pack.task_context);
    return sameArrays(projection.portrait.canonical_refs, fixture.expected.portrait_refs)
      && sameArrays(projection.living_map.canonical_refs, fixture.expected.map_node_refs)
      && sameArrays(projection.living_map.semantic_edges.map((edge) => edge.id), fixture.expected.semantic_edge_ids);
  }

  if (fixture.mode === 'apply_correction') {
    const once = applyCorrection(base, fixture.correction);
    const twice = applyCorrection(once, fixture.correction);
    const errors = validateState(once);
    const projection = buildProjection(once, pack.viewer, pack.task_context);
    const repairOutcomes = once.repair_receipts.map((receipt) => receipt.outcome).sort(bytewise);
    const expectedOutcomes = [...fixture.expected.repair_outcomes].sort(bytewise);
    return errors.length === 0
      && projection.portrait.canonical_refs.includes(fixture.expected.new_ref)
      && projection.living_map.canonical_refs.includes(fixture.expected.new_ref)
      && !projection.portrait.canonical_refs.includes(fixture.expected.absent_ref)
      && !projection.living_map.canonical_refs.includes(fixture.expected.absent_ref)
      && sameArrays(projection.living_map.semantic_edges.map((edge) => edge.id), fixture.expected.semantic_edge_ids)
      && sameArrays(repairOutcomes, expectedOutcomes)
      && stableStringify(once) === stableStringify(twice);
  }

  if (fixture.mode === 'dispute_item') {
    const item = base.item_versions.find((candidate) => candidate.id === fixture.item_version_id);
    item.standing = 'disputed';
    const ref = canonicalRef(item);
    for (const relation of base.relations) {
      if (relation.from_ref === ref || relation.to_ref === ref) relation.standing = 'disputed';
    }
    const projection = buildProjection(base, pack.viewer, pack.task_context);
    return !projection.portrait.canonical_refs.includes(fixture.expected.omitted_ref)
      && !projection.living_map.canonical_refs.includes(fixture.expected.omitted_ref);
  }

  if (fixture.mode === 'assert_omitted') {
    const projection = buildProjection(base, pack.viewer, pack.task_context);
    return !projection.portrait.canonical_refs.includes(fixture.canonical_ref)
      && !projection.living_map.canonical_refs.includes(fixture.canonical_ref);
  }

  if (fixture.mode === 'generated_scale') {
    const state = generatedScaleState(fixture.recipe);
    const viewer = { person_id: 'person-scale', subject_id: 'person-scale', audience_grants: ['person_private:person-scale'] };
    const projection = buildProjection(state, viewer, pack.task_context);
    const reversed = clone(state);
    for (const key of ['sources', 'assertions', 'item_versions', 'relations']) reversed[key].reverse();
    const secondProjection = buildProjection(reversed, viewer, pack.task_context);
    return validateState(state).length === 0
      && projection.living_map.nodes.length === fixture.expected.full_item_count
      && projection.portrait.canonical_refs.length <= contract.projection_contract.portrait_card_budget
      && projection.portrait.canonical_refs.every((ref) => projection.living_map.canonical_refs.includes(ref))
      && mapWindow(projection, 'orientation').length <= fixture.expected.orientation_max
      && mapWindow(projection, 'neighbourhood', fixture.recipe.focus_ref).length <= fixture.expected.neighbourhood_max
      && stableStringify(projection) === stableStringify(secondProjection);
  }

  if (fixture.mode === 'layout_links') {
    const projection = buildProjection(base, pack.viewer, pack.task_context);
    return projection.living_map.layout_links.length === projection.living_map.nodes.length
      && projection.living_map.layout_links.every((link) => link.semantic === fixture.expected.semantic && link.kind === fixture.expected.kind);
  }

  if (fixture.mode === 'broaden_relation_audience') {
    const relation = base.relations.find((candidate) => candidate.id === fixture.relation_id);
    relation.audience = clone(fixture.audience);
    return sameArrays(validateState(base), fixture.expected_error_codes);
  }

  return false;
}

if (contract.schema_version !== 'ctrl.living-brain.contract.v1') failures.push('contract schema version');
if (contract.authority !== 'D-055') failures.push('contract authority');
if (pack.schema_version !== 'ctrl.living-brain.fixtures.v1') failures.push('fixture schema version');
if (pack.contract_ref !== 'project-documentation/ctrl-evolution/g13-living-brain-contract.json') failures.push('fixture contract reference');
if (contract.invariants.length !== 17 || unique(contract.invariants).length !== 17) failures.push('contract invariants');
if (pack.fixtures.length !== 9 || unique(pack.fixtures.map((fixture) => fixture.id)).length !== 9) failures.push('fixture inventory');
if (contractRaw !== `${JSON.stringify(contract, null, 2)}\n`) failures.push('contract canonical JSON formatting');
if (fixturesRaw !== `${JSON.stringify(pack, null, 2)}\n`) failures.push('fixture canonical JSON formatting');

for (const fixture of pack.fixtures) {
  let passed = false;
  try {
    passed = checkFixture(fixture);
  } catch (error) {
    failures.push(`${fixture.id}: ${error.message}`);
    continue;
  }
  report.push({ fixture_id: fixture.id, passed });
  if (!passed) failures.push(`${fixture.id}: proof failed`);
}

const scriptRaw = readFileSync(new URL(import.meta.url), 'utf8');
const longDashPattern = new RegExp(String.fromCodePoint(0x2014));
if (longDashPattern.test(`${contractRaw}\n${fixturesRaw}\n${scriptRaw}`)) failures.push('forbidden copy pattern');
const credentialPatterns = [/ghp_[A-Za-z0-9]{20,}/g, /sbp_[A-Za-z0-9]{20,}/g, /vcp_[A-Za-z0-9]{20,}/g, /sk-[A-Za-z0-9_-]{20,}/g];
if (credentialPatterns.some((pattern) => pattern.test(`${contractRaw}\n${fixturesRaw}`))) failures.push('credential-shaped content');

if (failures.length) {
  console.error(`CTRL G13 Living Brain proof failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const contractHash = createHash('sha256').update(contractRaw, 'utf8').digest('hex');
const fixtureHash = createHash('sha256').update(fixturesRaw, 'utf8').digest('hex');
console.log(`ok: ${report.length} Living Brain fixtures passed`);
console.log('ok: every portrait reference resolves to the identical Living Map version');
console.log('ok: unsupported relations, audience leakage, proposed truth and disputed steering are blocked');
console.log('ok: correction is append-only, idempotent and complete across 4 dependency receipts');
console.log('ok: 120-item, 180-relation scale projection is deterministic under source reordering');
console.log(`ok: contract SHA-256 ${contractHash}`);
console.log(`ok: fixtures SHA-256 ${fixtureHash}`);
