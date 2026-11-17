import type { SupabaseClient } from "@supabase/supabase-js";

export type EntityRelationship = {
  id?: string;
  from_type: string;
  from_id: string | null;
  to_type: string;
  to_id: string;
};

export type EntityActions = {
  status: string;
  isPublished: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canHide: boolean;
  canRestore: boolean;
};

export class EntityRequestError extends Error {
  constructor(message: string, public unconfirmed = false) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function entityRequest(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    console.error("Entity request failed:", error);
    throw new EntityRequestError("Request outcome is unconfirmed. Verify the Entity before retrying.", true);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    console.error("Invalid Entity response:", error);
    throw new EntityRequestError(
      response.ok ? "Request outcome is unconfirmed. Verify the Entity before retrying." : "Unable to read the Entity error response.",
      response.ok || response.status >= 500,
    );
  }
  if (!response.ok) {
    const unconfirmed = response.status >= 500 || (isRecord(body) && body.code === "unconfirmed");
    const message = isRecord(body) && typeof body.error === "string" ? body.error : "Entity request failed.";
    throw new EntityRequestError(
      unconfirmed ? `${message} The outcome is unconfirmed; verify before retrying.` : message,
      unconfirmed,
    );
  }
  if (!isRecord(body)) throw new EntityRequestError("Request outcome is unconfirmed. Verify the Entity before retrying.", true);
  return body;
}

export function readEntityActions(body: Record<string, unknown>): EntityActions {
  const actions = body.actions;
  if (!isRecord(actions) || typeof actions.status !== "string"
      || typeof actions.isPublished !== "boolean" || typeof actions.canEdit !== "boolean"
      || typeof actions.canApprove !== "boolean" || typeof actions.canHide !== "boolean"
      || typeof actions.canRestore !== "boolean") {
    throw new EntityRequestError("Unable to confirm Entity permissions.");
  }
  return {
    status: actions.status, isPublished: actions.isPublished, canEdit: actions.canEdit,
    canApprove: actions.canApprove, canHide: actions.canHide, canRestore: actions.canRestore,
  };
}

export function readEntityMutation(body: Record<string, unknown>): { entityId: string; auditId: string } {
  const result = body.result;
  if (!isRecord(result) || typeof result.entityId !== "string" || !result.entityId
      || typeof result.auditId !== "string" || !result.auditId) {
    throw new EntityRequestError("Request outcome is unconfirmed. Verify the Entity before retrying.", true);
  }
  return { entityId: result.entityId, auditId: result.auditId };
}

export async function saveEntityRelationships(
  supabase: SupabaseClient,
  entityId: string,
  relationships: EntityRelationship[],
) {
  const { error: deleteError } = await supabase.from("civic_relationships")
    .delete().eq("from_type", "entity").eq("from_id", entityId);
  if (deleteError) throw deleteError;
  if (relationships.length === 0) return;
  const rows = relationships.map(({ to_type, to_id }) => ({
    from_type: "entity", from_id: entityId, to_type, to_id,
  }));
  const { error } = await supabase.from("civic_relationships").insert(rows);
  if (error) throw error;
}
