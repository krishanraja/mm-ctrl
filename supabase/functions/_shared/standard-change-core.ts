import { sha256Identifier } from "./public-request-guard.ts";
import { stableStringify } from "./portable-brain-package.ts";

export type ProposalType = "false_positive" | "uncovered" | "drift";
export type CandidateStatus = "compiled" | "needs_evidence" | "no_change";
export type CheckStatus = "holds" | "breaks" | "insufficient-evidence" | "not-applicable";

export interface SourceCriterion {
  id: string;
  surface: string;
  name: string;
  check_text: string;
  observable: string | null;
  weight: "essential" | "important" | "optional" | "pitfall";
  disposition: "advisory" | "blocking" | "retired";
  disc_verdict: "keep" | "delete" | "untested";
  version: number;
}

export interface EvidenceBinding {
  source_id: string;
  surface: string;
  signal: string;
  criterion_id: string | null;
  criterion_name: string;
  verdict: string;
  disposition: string;
}

export interface OpportunityBinding {
  run_id: string;
  surface: string;
}

export interface HoldoutExclusionReceipt {
  manifest_sha256: string;
  item_count: number;
  intersection_count: number;
}

export interface ProposalPacket {
  id: string;
  proposal_hash: string;
  type: ProposalType;
  surface: string;
  headline: string;
  delta_text: string | null;
  evidence: {
    source_ids?: unknown;
    criterion_id?: unknown;
    criterion_name?: unknown;
    surfaces?: unknown;
    topic?: unknown;
    opportunities?: unknown;
    last_fired_week?: unknown;
  };
}

export interface ChangeRequestPacket {
  id: string;
  version: number;
  request_hash: string;
  surface: string;
  accepted_scope: Record<string, unknown>;
  proposal: ProposalPacket;
  decision: {
    id: string;
    decision_hash: string;
  };
  source: {
    standard_artifact_id: string;
    standard_sha256: string;
    source_snapshot: string;
    source_manifest_sha256: string;
    evidence_ids: string[];
    evidence_bindings: EvidenceBinding[];
    opportunity_bindings: OpportunityBinding[];
    criteria: SourceCriterion[];
  };
}

export interface CompiledAmendment {
  operation:
    | "narrow_applicability"
    | "downgrade_to_advisory"
    | "add_awaiting_candidate"
    | "retain"
    | "revise"
    | "retire"
    | "gather_evidence";
  surface: string;
  target_criterion: Pick<SourceCriterion, "id" | "name" | "surface" | "version" | "disposition"> | null;
  instruction: string | null;
  proposed_disposition: "advisory" | "retired" | "unchanged";
  activation: "candidate_only" | "forbidden_pending_evidence" | "no_change";
  evidence_ids: string[];
  opportunity_run_ids: string[];
  unresolved: string[];
}

export interface CompiledStandardChange {
  schema: "ctrl.standard-change.compile.v1";
  change_request: { id: string; version: number; sha256: string };
  decision: { id: string; sha256: string };
  proposal: { id: string; type: ProposalType; sha256: string };
  source: {
    standard_artifact_id: string;
    standard_sha256: string;
    source_snapshot: string;
    source_manifest_sha256: string;
  };
  candidate_version: number;
  candidate_status: CandidateStatus;
  amendment: CompiledAmendment;
  boundaries: {
    active_standard_mutated: false;
    deploy_authorized: false;
    holdout_ids_loaded: [];
    owner_apply_required: true;
  };
}

export interface CandidateBuild {
  schema: "ctrl.standard-change.build.v1";
  runtime_body: string;
  runtime_sha256: string;
  evaluation_manifest: Record<string, unknown>;
  evaluation_sha256: string;
  build_manifest: Record<string, unknown>;
  build_manifest_sha256: string;
  package_sha256: string;
}

export interface CheckFinding {
  criterion_id: string;
  status: CheckStatus;
  evidence_locator: string;
  detail: string;
}

export interface CandidateCheck {
  schema: "ctrl.standard-change.check.v1";
  verdict: "passed" | "blocked" | "needs_evidence";
  frozen: {
    request_sha256: string;
    compile_sha256: string;
    runtime_sha256: string;
    build_manifest_sha256: string;
    holdout_manifest_sha256: string;
  };
  findings: CheckFinding[];
  release: {
    active_standard_mutated: false;
    apply_authorized: false;
    deploy_authorized: false;
    next_owner: "subject_owner";
  };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))].sort();
}

function criterionFor(proposal: ProposalPacket, criteria: readonly SourceCriterion[]): SourceCriterion | null {
  const id = text(proposal.evidence?.criterion_id);
  if (!id) return null;
  return criteria.find((criterion) => criterion.id === id && criterion.surface === proposal.surface) ?? null;
}

function evidenceIsExactlyBound(
  request: ChangeRequestPacket,
  target: SourceCriterion | null,
  evidenceIds: readonly string[],
): boolean {
  if (evidenceIds.length === 0) return false;
  const accepted = new Set(evidenceIds);
  const bindings = request.source.evidence_bindings.filter((binding) => accepted.has(binding.source_id));
  if (new Set(bindings.map((binding) => binding.source_id)).size !== accepted.size) return false;
  return bindings.every((binding) =>
    binding.surface === request.surface && (!target || binding.criterion_id === target.id)
  );
}

function driftOpportunitiesAreExactlyBound(
  request: ChangeRequestPacket,
  target: SourceCriterion | null,
  evidenceIds: readonly string[],
  opportunityRunIds: readonly string[],
): boolean {
  if (!target || evidenceIds.length !== 0 || request.proposal.evidence.last_fired_week !== null) return false;
  const expectedCount = request.proposal.evidence.opportunities;
  if (!Number.isInteger(expectedCount) || Number(expectedCount) < 1) return false;
  const bindings = request.source.opportunity_bindings.filter((binding) => binding.surface === request.surface);
  const boundRunIds = bindings.map((binding) => binding.run_id).sort();
  if (boundRunIds.length !== expectedCount || new Set(boundRunIds).size !== boundRunIds.length) return false;
  if (JSON.stringify(boundRunIds) !== JSON.stringify([...opportunityRunIds].sort())) return false;
  return !request.source.evidence_bindings.some((binding) =>
    binding.signal === "output" && binding.surface === request.surface &&
    (binding.criterion_id === target.id || binding.criterion_name === target.name)
  );
}

function targetSummary(criterion: SourceCriterion | null): CompiledAmendment["target_criterion"] {
  if (!criterion) return null;
  return {
    id: criterion.id,
    name: criterion.name,
    surface: criterion.surface,
    version: criterion.version,
    disposition: criterion.disposition,
  };
}

function acceptedInstruction(request: ChangeRequestPacket): string | null {
  const scoped = text(request.accepted_scope.accepted_delta) ?? text(request.accepted_scope.replacement_check_text);
  return scoped ?? text(request.proposal.delta_text);
}

export async function compileStandardChange(request: ChangeRequestPacket): Promise<{
  compiled: CompiledStandardChange;
  compile_sha256: string;
}> {
  const proposal = request.proposal;
  const evidenceIds = stringList(proposal.evidence?.source_ids);
  const target = criterionFor(proposal, request.source.criteria);
  const opportunityRunIds = proposal.type === "drift"
    ? request.source.opportunity_bindings
      .filter((binding) => binding.surface === request.surface)
      .map((binding) => binding.run_id)
      .sort()
    : [];
  const exactEvidenceBinding = proposal.type === "drift"
    ? driftOpportunitiesAreExactlyBound(request, target, evidenceIds, opportunityRunIds)
    : evidenceIsExactlyBound(request, target, evidenceIds);
  const instruction = acceptedInstruction(request);
  const unresolved: string[] = [];
  let operation: CompiledAmendment["operation"];
  let proposedDisposition: CompiledAmendment["proposed_disposition"] = "advisory";
  let activation: CompiledAmendment["activation"] = "candidate_only";
  let candidateStatus: CandidateStatus = "compiled";

  if (proposal.type !== "drift" && evidenceIds.length === 0) unresolved.push("source_evidence");
  if (!exactEvidenceBinding) {
    unresolved.push(proposal.type === "drift" ? "source_opportunity_binding" : "source_evidence_binding");
  }

  if (proposal.type === "false_positive") {
    const surfaces = stringList(proposal.evidence?.surfaces);
    operation = surfaces.length === 1 ? "narrow_applicability" : "downgrade_to_advisory";
    if (!target) unresolved.push("current_target_criterion");
    if (!instruction) unresolved.push("bounded_replacement_instruction");
  } else if (proposal.type === "uncovered") {
    operation = "add_awaiting_candidate";
    activation = "forbidden_pending_evidence";
    candidateStatus = "needs_evidence";
    if (!text(proposal.evidence?.topic)) unresolved.push("owner_worded_topic");
    unresolved.push("checkable_observable", "contrast_evidence", "training_discrimination");
  } else {
    const decision = text(request.accepted_scope.freshness_decision);
    if (!target) unresolved.push("current_target_criterion");
    if (decision === "retain") {
      operation = "retain";
      proposedDisposition = "unchanged";
      activation = "no_change";
      candidateStatus = "no_change";
    } else if (decision === "retire") {
      operation = "retire";
      proposedDisposition = "retired";
    } else if (decision === "gather_evidence") {
      operation = "gather_evidence";
      activation = "forbidden_pending_evidence";
      candidateStatus = "needs_evidence";
      unresolved.push("fresh_applicable_evidence");
    } else {
      operation = "revise";
      if (!instruction) {
        activation = "forbidden_pending_evidence";
        candidateStatus = "needs_evidence";
        unresolved.push("bounded_replacement_instruction");
      }
    }
  }

  const cleanedUnresolved = [...new Set(unresolved)].sort();
  if (cleanedUnresolved.length > 0 && candidateStatus === "compiled") {
    candidateStatus = "needs_evidence";
    activation = "forbidden_pending_evidence";
  }

  const compiled: CompiledStandardChange = {
    schema: "ctrl.standard-change.compile.v1",
    change_request: { id: request.id, version: request.version, sha256: request.request_hash },
    decision: { id: request.decision.id, sha256: request.decision.decision_hash },
    proposal: { id: proposal.id, type: proposal.type, sha256: proposal.proposal_hash },
    source: {
      standard_artifact_id: request.source.standard_artifact_id,
      standard_sha256: request.source.standard_sha256,
      source_snapshot: request.source.source_snapshot,
      source_manifest_sha256: request.source.source_manifest_sha256,
    },
    candidate_version: 1,
    candidate_status: candidateStatus,
    amendment: {
      operation,
      surface: request.surface,
      target_criterion: targetSummary(target),
      instruction,
      proposed_disposition: proposedDisposition,
      activation,
      evidence_ids: evidenceIds,
      opportunity_run_ids: opportunityRunIds,
      unresolved: cleanedUnresolved,
    },
    boundaries: {
      active_standard_mutated: false,
      deploy_authorized: false,
      holdout_ids_loaded: [],
      owner_apply_required: true,
    },
  };
  return { compiled, compile_sha256: await sha256Identifier(stableStringify(compiled)) };
}

function safeLine(value: string | null): string {
  return value?.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim() || "NOT ESTABLISHED";
}

function renderRuntime(compiled: CompiledStandardChange, sourceBody: string): string {
  const amendment = compiled.amendment;
  const target = amendment.target_criterion
    ? `${amendment.target_criterion.name} [${amendment.target_criterion.id}]`
    : "new candidate rule";
  const unresolved = amendment.unresolved.length
    ? amendment.unresolved.map((gap) => `- ${gap}`).join("\n")
    : "- none recorded";
  return [
    "---",
    "name: candidate-standard-change",
    "status: candidate",
    `change-request: ${compiled.change_request.id}`,
    `source-sha256: ${compiled.source.standard_sha256}`,
    "deploy-authorized: false",
    "---",
    "",
    "# Candidate standard change",
    "",
    "This package is not active. It preserves the current standard and one owner-accepted amendment for review.",
    "",
    "## Current standard",
    "",
    sourceBody.trim(),
    "",
    "## Proposed amendment",
    "",
    `- Operation: ${amendment.operation}`,
    `- Surface: ${amendment.surface}`,
    `- Target: ${target}`,
    `- Proposed standing: ${amendment.proposed_disposition}`,
    `- Activation: ${amendment.activation}`,
    `- Instruction: ${safeLine(amendment.instruction)}`,
    "",
    "## Evidence pointers",
    "",
    ...(amendment.evidence_ids.length
      ? amendment.evidence_ids.map((id) => `- evidence ${id}`)
      : amendment.opportunity_run_ids.length
      ? amendment.opportunity_run_ids.map((id) => `- reviewed opportunity ${id}`)
      : ["- NOT ESTABLISHED"]),
    "",
    "## Unresolved before activation",
    "",
    unresolved,
    "",
  ].join("\n");
}

export async function buildStandardChangeCandidate(
  compiled: CompiledStandardChange,
  compileSha256: string,
  sourceBody: string,
): Promise<CandidateBuild> {
  const runtimeBody = renderRuntime(compiled, sourceBody);
  const runtimeSha256 = await sha256Identifier(runtimeBody);
  const evaluationManifest: Record<string, unknown> = {
    schema: "ctrl.standard-change.evaluation.v1",
    frozen_runtime_sha256: runtimeSha256,
    required_checks: [
      "source.identity",
      "source.current",
      "decision.exact",
      "scope.bounded",
      "provenance.evidence",
      "candidate.activation",
      "build.deterministic",
      "release.closed",
    ],
    expected_answers_in_runtime: false,
    holdout_ids: [],
  };
  const evaluationSha256 = await sha256Identifier(stableStringify(evaluationManifest));
  const buildManifest: Record<string, unknown> = {
    schema: "ctrl.standard-change.build-manifest.v1",
    deterministic_method: "standard-change-core.v1",
    change_request: compiled.change_request,
    decision: compiled.decision,
    proposal: compiled.proposal,
    source: compiled.source,
    compile_sha256: compileSha256,
    candidate_status: compiled.candidate_status,
    runtime: {
      path: "runtime/candidate-standard-change.md",
      sha256: runtimeSha256,
      bytes: new TextEncoder().encode(runtimeBody).byteLength,
    },
    evaluation: {
      path: "evaluation/check-contract.json",
      sha256: evaluationSha256,
    },
    exclusions: {
      holdout_ids: [],
      expected_answers_in_runtime: false,
      raw_evidence_quotes: false,
    },
    statuses: {
      compile: compiled.candidate_status,
      build: "candidate",
      check: "pending",
      release: "closed",
      deploy_authorized: false,
      apply_authorized: false,
    },
  };
  const buildManifestSha256 = await sha256Identifier(stableStringify(buildManifest));
  const packageSha256 = await sha256Identifier(stableStringify({
    runtime_sha256: runtimeSha256,
    evaluation_sha256: evaluationSha256,
    build_manifest_sha256: buildManifestSha256,
  }));
  return {
    schema: "ctrl.standard-change.build.v1",
    runtime_body: runtimeBody,
    runtime_sha256: runtimeSha256,
    evaluation_manifest: evaluationManifest,
    evaluation_sha256: evaluationSha256,
    build_manifest: buildManifest,
    build_manifest_sha256: buildManifestSha256,
    package_sha256: packageSha256,
  };
}

function finding(
  criterionId: string,
  status: CheckStatus,
  evidenceLocator: string,
  detail: string,
): CheckFinding {
  return { criterion_id: criterionId, status, evidence_locator: evidenceLocator, detail };
}

export async function checkStandardChangeCandidate(input: {
  request: ChangeRequestPacket;
  compiled: CompiledStandardChange;
  compile_sha256: string;
  build: CandidateBuild;
  source_body: string;
  current_standard_artifact_id: string;
  current_standard_sha256: string;
  holdout_receipt: HoldoutExclusionReceipt;
}): Promise<CandidateCheck> {
  const { request, compiled, build, source_body: sourceBody } = input;
  const findings: CheckFinding[] = [];
  const actualSourceSha = await sha256Identifier(sourceBody);
  findings.push(finding(
    "source.identity",
    actualSourceSha === request.source.standard_sha256 && compiled.source.standard_sha256 === actualSourceSha
      ? "holds"
      : "breaks",
    `standard ${request.source.standard_artifact_id}`,
    "The candidate must use the exact frozen standard bytes named by the accepted request.",
  ));
  findings.push(finding(
    "source.current",
    input.current_standard_artifact_id === request.source.standard_artifact_id &&
        input.current_standard_sha256 === request.source.standard_sha256
      ? "holds"
      : "breaks",
    "latest standard artifact",
    "A stale accepted proposal cannot be silently rebased onto a newer standard.",
  ));
  findings.push(finding(
    "decision.exact",
    compiled.change_request.sha256 === request.request_hash &&
        compiled.decision.sha256 === request.decision.decision_hash &&
        compiled.proposal.sha256 === request.proposal.proposal_hash
      ? "holds"
      : "breaks",
    `change request ${request.id}`,
    "The candidate must preserve the exact owner decision, proposal and request hashes.",
  ));
  const acceptedSurface = text(request.accepted_scope.accepted_surface);
  findings.push(finding(
    "scope.bounded",
    compiled.amendment.surface === request.surface &&
        (!compiled.amendment.target_criterion || compiled.amendment.target_criterion.surface === request.surface) &&
        (!acceptedSurface || acceptedSurface === request.surface)
      ? "holds"
      : "breaks",
    "compiled amendment",
    "The amendment may not expand beyond the accepted work surface.",
  ));
  const evidenceIds = compiled.amendment.evidence_ids;
  const opportunityRunIds = compiled.amendment.opportunity_run_ids;
  const manifestEvidence = new Set(request.source.evidence_ids);
  const target = compiled.amendment.target_criterion
    ? request.source.criteria.find((criterion) => criterion.id === compiled.amendment.target_criterion?.id) ?? null
    : null;
  const exactEvidenceBinding = request.proposal.type === "drift"
    ? driftOpportunitiesAreExactlyBound(request, target, evidenceIds, opportunityRunIds)
    : evidenceIsExactlyBound(request, target, evidenceIds);
  findings.push(finding(
    "provenance.evidence",
    exactEvidenceBinding && (request.proposal.type === "drift"
      ? opportunityRunIds.length > 0
      : evidenceIds.length > 0 && evidenceIds.every((id) => manifestEvidence.has(id)))
      ? "holds"
      : "breaks",
    "capture source manifest",
    "Every amendment evidence pointer or bounded absence opportunity must resolve inside the exact captured source manifest.",
  ));
  findings.push(finding(
    "holdout.exclusion",
    /^[0-9a-f]{64}$/.test(input.holdout_receipt.manifest_sha256) &&
        Number.isInteger(input.holdout_receipt.item_count) && input.holdout_receipt.item_count >= 0 &&
        input.holdout_receipt.intersection_count === 0
      ? "holds"
      : "breaks",
    `sealed holdout manifest ${input.holdout_receipt.manifest_sha256}`,
    "A database-side receipt must prove that the candidate runtime contains no sealed holdout body, rationale or answer-key material.",
  ));

  const amendmentStatus: CheckStatus = compiled.amendment.unresolved.length > 0 ||
      compiled.amendment.activation === "forbidden_pending_evidence"
    ? "insufficient-evidence"
    : "holds";
  findings.push(finding(
    `change.${compiled.amendment.target_criterion?.id ?? "new"}`,
    amendmentStatus,
    "compiled amendment",
    amendmentStatus === "holds"
      ? "The proposed amendment is bounded and carries no unresolved activation dependency."
      : `Activation remains closed until these gaps are resolved: ${compiled.amendment.unresolved.join(", ")}.`,
  ));
  findings.push(finding(
    "candidate.activation",
    compiled.boundaries.active_standard_mutated === false && compiled.boundaries.deploy_authorized === false &&
        (compiled.candidate_status === "compiled" || compiled.amendment.activation !== "candidate_only")
      ? "holds"
      : "breaks",
    "compile boundaries",
    "Compile may create a candidate but cannot activate or deploy it.",
  ));

  const rebuilt = await buildStandardChangeCandidate(compiled, input.compile_sha256, sourceBody);
  const actualRuntimeSha = await sha256Identifier(build.runtime_body);
  const actualEvaluationSha = await sha256Identifier(stableStringify(build.evaluation_manifest));
  const actualManifestSha = await sha256Identifier(stableStringify(build.build_manifest));
  const actualPackageSha = await sha256Identifier(stableStringify({
    runtime_sha256: build.runtime_sha256,
    evaluation_sha256: build.evaluation_sha256,
    build_manifest_sha256: build.build_manifest_sha256,
  }));
  findings.push(finding(
    "build.deterministic",
    actualRuntimeSha === build.runtime_sha256 &&
        actualEvaluationSha === build.evaluation_sha256 &&
        actualManifestSha === build.build_manifest_sha256 &&
        actualPackageSha === build.package_sha256 &&
        rebuilt.runtime_sha256 === build.runtime_sha256 &&
        rebuilt.evaluation_sha256 === build.evaluation_sha256 &&
        rebuilt.build_manifest_sha256 === build.build_manifest_sha256 &&
        rebuilt.package_sha256 === build.package_sha256
      ? "holds"
      : "breaks",
    "independent repeat build",
    "The same frozen inputs must reproduce every candidate package hash.",
  ));
  const statuses = (build.build_manifest.statuses ?? {}) as Record<string, unknown>;
  findings.push(finding(
    "release.closed",
    statuses.release === "closed" && statuses.deploy_authorized === false && statuses.apply_authorized === false &&
        compiled.boundaries.owner_apply_required === true
      ? "holds"
      : "breaks",
    "build manifest statuses",
    "A passed Check still cannot apply, deploy or release the candidate.",
  ));

  const verdict = findings.some((item) => item.status === "breaks")
    ? "blocked"
    : findings.some((item) => item.status === "insufficient-evidence")
    ? "needs_evidence"
    : "passed";
  return {
    schema: "ctrl.standard-change.check.v1",
    verdict,
    frozen: {
      request_sha256: request.request_hash,
      compile_sha256: input.compile_sha256,
      runtime_sha256: build.runtime_sha256,
      build_manifest_sha256: build.build_manifest_sha256,
      holdout_manifest_sha256: input.holdout_receipt.manifest_sha256,
    },
    findings,
    release: {
      active_standard_mutated: false,
      apply_authorized: false,
      deploy_authorized: false,
      next_owner: "subject_owner",
    },
  };
}
