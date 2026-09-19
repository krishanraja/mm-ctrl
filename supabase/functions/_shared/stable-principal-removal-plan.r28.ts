export interface StableRemovalWorkspaceContext {
  workspace_id: string;
  subject_principal_id: string;
  custody_principal_id: string;
  custody_status: "active" | "transfer_required" | "closed";
  current_operator_principal_id: string | null;
  current_operator_active_auth_user_ids: string[];
  target_has_current_role: boolean;
  target_has_current_grant: boolean;
}

export interface StablePrincipalRemovalContext {
  schema_version: "ctrl.stable-principal-removal-context.r28";
  standing: "unverified" | "verified_complete";
  evidence_ref: string;
  observed_at: string;
  target_auth_user_id: string;
  target_subject_principal_ids: string[];
  target_operator_principal_ids: string[];
  workspace_count: number;
  workspaces: StableRemovalWorkspaceContext[];
}

export type StablePrincipalRemovalAction =
  | {
      action: "require_customer_authorized_custody_transfer";
      workspace_id: string;
      custody_principal_id: string;
      from_operator_principal_id: string;
    }
  | { action: "revoke_workspace_role"; workspace_id: string; auth_user_id: string }
  | { action: "revoke_audience_grants"; workspace_id: string; auth_user_id: string }
  | { action: "revoke_operator_auth_link"; operator_principal_id: string; auth_user_id: string }
  | { action: "revoke_subject_auth_link"; subject_principal_id: string; auth_user_id: string }
  | { action: "preserve_subject_principal"; subject_principal_id: string };

export type StablePrincipalRemovalPlan =
  | { status: "held"; reasons: string[] }
  | {
      status: "ready" | "custody_required";
      target_auth_user_id: string;
      actions: StablePrincipalRemovalAction[];
      auth_user_deletion_allowed: boolean;
      execution_order: ["custody", "access", "identity_links", "auth_user"];
    };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const CONTEXT_KEYS = new Set([
  "schema_version",
  "standing",
  "evidence_ref",
  "observed_at",
  "target_auth_user_id",
  "target_subject_principal_ids",
  "target_operator_principal_ids",
  "workspace_count",
  "workspaces",
]);
const WORKSPACE_KEYS = new Set([
  "workspace_id",
  "subject_principal_id",
  "custody_principal_id",
  "custody_status",
  "current_operator_principal_id",
  "current_operator_active_auth_user_ids",
  "target_has_current_role",
  "target_has_current_grant",
]);
const CUSTODY_STATUSES = new Set(["active", "transfer_required", "closed"]);

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function hasUnknownFields(value: object, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).some((key) => !allowed.has(key));
}

function actionKey(action: StablePrincipalRemovalAction): string {
  switch (action.action) {
    case "require_customer_authorized_custody_transfer":
      return `0:${action.workspace_id}:${action.custody_principal_id}`;
    case "revoke_workspace_role":
      return `1:${action.workspace_id}:${action.auth_user_id}`;
    case "revoke_audience_grants":
      return `2:${action.workspace_id}:${action.auth_user_id}`;
    case "revoke_operator_auth_link":
      return `3:${action.operator_principal_id}:${action.auth_user_id}`;
    case "revoke_subject_auth_link":
      return `4:${action.subject_principal_id}:${action.auth_user_id}`;
    case "preserve_subject_principal":
      return `5:${action.subject_principal_id}`;
  }
}

function validateUniqueIds(values: unknown, label: string, reasons: string[]): string[] {
  if (!Array.isArray(values)) {
    reasons.push(`${label}_array_required`);
    return [];
  }
  const valid: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string" || !UUID.test(value)) reasons.push(`${label}_invalid`);
    else valid.push(value);
    if (typeof value === "string" && seen.has(value)) reasons.push(`${label}_duplicate:${value}`);
    if (typeof value === "string") seen.add(value);
  }
  return valid;
}

export function buildStablePrincipalRemovalPlan(
  context: StablePrincipalRemovalContext,
): StablePrincipalRemovalPlan {
  const reasons: string[] = [];
  if (!context || typeof context !== "object") return { status: "held", reasons: ["context_object_required"] };
  if (hasUnknownFields(context, CONTEXT_KEYS)) reasons.push("context_unknown_field");
  if (context.schema_version !== "ctrl.stable-principal-removal-context.r28") {
    reasons.push("context_schema_version_invalid");
  }
  if (context.standing !== "verified_complete") reasons.push("relationship_inventory_unverified");
  if (!SHA256.test(context.evidence_ref)) reasons.push("evidence_ref_invalid");
  if (!ISO_INSTANT.test(context.observed_at) || !Number.isFinite(Date.parse(context.observed_at))) {
    reasons.push("observed_at_invalid");
  }
  if (!UUID.test(context.target_auth_user_id)) reasons.push("target_auth_user_id_invalid");
  const subjectPrincipals = validateUniqueIds(
    context.target_subject_principal_ids,
    "target_subject_principal",
    reasons,
  );
  const operatorPrincipals = validateUniqueIds(
    context.target_operator_principal_ids,
    "target_operator_principal",
    reasons,
  );
  if (!Array.isArray(context.workspaces)) reasons.push("workspaces_array_required");
  const workspaces = Array.isArray(context.workspaces) ? context.workspaces : [];
  if (!Number.isInteger(context.workspace_count) || context.workspace_count !== workspaces.length) {
    reasons.push("workspace_count_mismatch");
  }

  const workspaceIds = new Set<string>();
  const operatorSet = new Set(operatorPrincipals);
  const subjectSet = new Set(subjectPrincipals);
  for (const workspace of workspaces) {
    if (!workspace || typeof workspace !== "object") {
      reasons.push("workspace_object_required");
      continue;
    }
    if (hasUnknownFields(workspace, WORKSPACE_KEYS)) reasons.push("workspace_unknown_field");
    if (!UUID.test(workspace.workspace_id)) reasons.push("workspace_id_invalid");
    if (workspaceIds.has(workspace.workspace_id)) reasons.push(`workspace_duplicate:${workspace.workspace_id}`);
    workspaceIds.add(workspace.workspace_id);
    if (!UUID.test(workspace.subject_principal_id)) reasons.push(`workspace_subject_invalid:${workspace.workspace_id}`);
    if (!UUID.test(workspace.custody_principal_id)) reasons.push(`workspace_custody_invalid:${workspace.workspace_id}`);
    if (!CUSTODY_STATUSES.has(workspace.custody_status)) {
      reasons.push(`workspace_custody_status_invalid:${workspace.workspace_id}`);
    }
    if (workspace.current_operator_principal_id !== null && !UUID.test(workspace.current_operator_principal_id)) {
      reasons.push(`workspace_current_operator_invalid:${workspace.workspace_id}`);
    }
    const activeUsers = validateUniqueIds(
      workspace.current_operator_active_auth_user_ids,
      `workspace_active_auth_user:${workspace.workspace_id}`,
      reasons,
    );
    if (typeof workspace.target_has_current_role !== "boolean") {
      reasons.push(`workspace_role_flag_invalid:${workspace.workspace_id}`);
    }
    if (typeof workspace.target_has_current_grant !== "boolean") {
      reasons.push(`workspace_grant_flag_invalid:${workspace.workspace_id}`);
    }
    if (workspace.custody_status === "active" &&
      (workspace.current_operator_principal_id === null || activeUsers.length === 0)) {
      reasons.push(`active_custody_evidence_incomplete:${workspace.workspace_id}`);
    }
    if (workspace.custody_status === "closed" && workspace.current_operator_principal_id === null && activeUsers.length > 0) {
      reasons.push(`closed_custody_auth_without_operator:${workspace.workspace_id}`);
    }
    const related = subjectSet.has(workspace.subject_principal_id) ||
      (workspace.current_operator_principal_id !== null && operatorSet.has(workspace.current_operator_principal_id)) ||
      workspace.target_has_current_role || workspace.target_has_current_grant;
    if (!related) reasons.push(`workspace_unrelated:${workspace.workspace_id}`);
  }

  if (reasons.length > 0) return { status: "held", reasons: uniqueSorted(reasons) };

  const actions: StablePrincipalRemovalAction[] = [];
  for (const subjectPrincipalId of subjectPrincipals) {
    actions.push({ action: "preserve_subject_principal", subject_principal_id: subjectPrincipalId });
    actions.push({
      action: "revoke_subject_auth_link",
      subject_principal_id: subjectPrincipalId,
      auth_user_id: context.target_auth_user_id,
    });
  }
  for (const operatorPrincipalId of operatorPrincipals) {
    actions.push({
      action: "revoke_operator_auth_link",
      operator_principal_id: operatorPrincipalId,
      auth_user_id: context.target_auth_user_id,
    });
  }
  for (const workspace of workspaces) {
    if (workspace.target_has_current_role) {
      actions.push({
        action: "revoke_workspace_role",
        workspace_id: workspace.workspace_id,
        auth_user_id: context.target_auth_user_id,
      });
    }
    if (workspace.target_has_current_grant) {
      actions.push({
        action: "revoke_audience_grants",
        workspace_id: workspace.workspace_id,
        auth_user_id: context.target_auth_user_id,
      });
    }
    const currentOperator = workspace.current_operator_principal_id;
    const targetIsCurrentOperator = currentOperator !== null && operatorSet.has(currentOperator);
    const targetIsActiveRoute = workspace.current_operator_active_auth_user_ids.includes(context.target_auth_user_id);
    const alternateRoutes = workspace.current_operator_active_auth_user_ids
      .filter((userId) => userId !== context.target_auth_user_id);
    if (workspace.custody_status === "active" && targetIsCurrentOperator && targetIsActiveRoute && alternateRoutes.length === 0) {
      actions.push({
        action: "require_customer_authorized_custody_transfer",
        workspace_id: workspace.workspace_id,
        custody_principal_id: workspace.custody_principal_id,
        from_operator_principal_id: currentOperator,
      });
    }
  }

  const deduplicated = [...new Map(actions.map((action) => [actionKey(action), action])).values()]
    .sort((left, right) => actionKey(left).localeCompare(actionKey(right)));
  const custodyRequired = deduplicated.some(
    (action) => action.action === "require_customer_authorized_custody_transfer",
  );
  if (deduplicated.some((action) => "action" in action && action.action.includes("erase"))) {
    return { status: "held", reasons: ["auth_user_removal_contains_erasure"] };
  }
  return {
    status: custodyRequired ? "custody_required" : "ready",
    target_auth_user_id: context.target_auth_user_id,
    actions: deduplicated,
    auth_user_deletion_allowed: !custodyRequired,
    execution_order: ["custody", "access", "identity_links", "auth_user"],
  };
}
