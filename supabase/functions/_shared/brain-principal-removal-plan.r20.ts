export type BrainPrincipalRemovalIntent =
  | { kind: "subject_erasure"; subject_id: string }
  | { kind: "operator_removal"; operator_user_id: string };

export interface BrainWorkspaceRelationship {
  workspace_id: string;
  subject_id: string;
  owner_id: string;
  active_operator_user_ids: string[];
}

export interface BrainPrincipalRelationshipInventory {
  standing: "unverified" | "verified_complete";
  evidence_ref: string;
  relationship_count: number;
}

export type BrainPrincipalRemovalAction =
  | { action: "erase_subject_brain"; workspace_id: string; subject_id: string }
  | { action: "revoke_operator_access"; workspace_id: string; operator_user_id: string }
  | {
      action: "require_owner_transfer_or_customer_closure";
      workspace_id: string;
      protected_subject_id: string;
      removed_operator_user_id: string;
    }
  | {
      action: "preserve_subject_brain_and_require_separate_subject_decision";
      workspace_id: string;
      protected_subject_id: string;
    };

export type BrainPrincipalRemovalPlanResult =
  | { status: "held"; reasons: string[] }
  | {
      status: "ready" | "custody_required";
      removed_user_id: string;
      actions: BrainPrincipalRemovalAction[];
      auth_user_deletion_allowed: boolean;
    };

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;

function validToken(value: string): boolean {
  return TOKEN.test(value);
}

function actionKey(action: BrainPrincipalRemovalAction): string {
  return `${action.workspace_id}:${action.action}`;
}

export function buildBrainPrincipalRemovalPlan(
  intent: BrainPrincipalRemovalIntent,
  relationships: BrainWorkspaceRelationship[],
  inventory: BrainPrincipalRelationshipInventory,
): BrainPrincipalRemovalPlanResult {
  const reasons: string[] = [];
  const removedUserId = intent.kind === "subject_erasure" ? intent.subject_id : intent.operator_user_id;

  if (!validToken(removedUserId)) reasons.push("invalid_removed_user_id");
  if (inventory.standing !== "verified_complete") reasons.push("relationship_inventory_unverified");
  if (!validToken(inventory.evidence_ref)) reasons.push("invalid_inventory_evidence_ref");
  if (!Number.isInteger(inventory.relationship_count) || inventory.relationship_count !== relationships.length) {
    reasons.push("relationship_inventory_count_mismatch");
  }

  const workspaceIds = new Set<string>();
  for (const relationship of relationships) {
    if (!validToken(relationship.workspace_id)) reasons.push("invalid_workspace_id");
    if (!validToken(relationship.subject_id)) reasons.push(`invalid_subject_id:${relationship.workspace_id}`);
    if (!validToken(relationship.owner_id)) reasons.push(`invalid_owner_id:${relationship.workspace_id}`);
    if (workspaceIds.has(relationship.workspace_id)) reasons.push(`duplicate_workspace:${relationship.workspace_id}`);
    workspaceIds.add(relationship.workspace_id);

    const operators = new Set<string>();
    for (const operatorUserId of relationship.active_operator_user_ids) {
      if (!validToken(operatorUserId)) reasons.push(`invalid_operator_user_id:${relationship.workspace_id}`);
      if (operators.has(operatorUserId)) reasons.push(`duplicate_operator:${relationship.workspace_id}:${operatorUserId}`);
      operators.add(operatorUserId);
    }
  }

  if (reasons.length > 0) return { status: "held", reasons: [...new Set(reasons)].sort() };

  const actions: BrainPrincipalRemovalAction[] = [];
  for (const relationship of relationships) {
    const isSubject = relationship.subject_id === removedUserId;
    const isOwner = relationship.owner_id === removedUserId;
    const isOperator = relationship.active_operator_user_ids.includes(removedUserId);

    if (intent.kind === "subject_erasure" && isSubject) {
      actions.push({
        action: "erase_subject_brain",
        workspace_id: relationship.workspace_id,
        subject_id: relationship.subject_id,
      });
    }


    if (intent.kind === "operator_removal" && isSubject) {
      actions.push({
        action: "revoke_operator_access",
        workspace_id: relationship.workspace_id,
        operator_user_id: removedUserId,
      });
      actions.push({
        action: "preserve_subject_brain_and_require_separate_subject_decision",
        workspace_id: relationship.workspace_id,
        protected_subject_id: relationship.subject_id,
      });
    }

    if ((isOwner || isOperator) && !isSubject) {
      actions.push({
        action: "revoke_operator_access",
        workspace_id: relationship.workspace_id,
        operator_user_id: removedUserId,
      });
    }

    if (isOwner && !isSubject) {
      actions.push({
        action: "require_owner_transfer_or_customer_closure",
        workspace_id: relationship.workspace_id,
        protected_subject_id: relationship.subject_id,
        removed_operator_user_id: removedUserId,
      });
    }
  }

  const deduplicatedActions = [...new Map(actions.map((action) => [actionKey(action), action])).values()]
    .sort((left, right) => actionKey(left).localeCompare(actionKey(right)));
  const custodyRequired = deduplicatedActions.some(
    (action) => action.action === "require_owner_transfer_or_customer_closure" ||
      action.action === "preserve_subject_brain_and_require_separate_subject_decision",
  );

  if (intent.kind === "operator_removal" && deduplicatedActions.some((action) => action.action === "erase_subject_brain")) {
    return { status: "held", reasons: ["operator_removal_contains_subject_erasure"] };
  }

  return {
    status: custodyRequired ? "custody_required" : "ready",
    removed_user_id: removedUserId,
    actions: deduplicatedActions,
    auth_user_deletion_allowed: !custodyRequired,
  };
}
