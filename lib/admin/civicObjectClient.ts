import type { SupabaseClient } from "@supabase/supabase-js";

export type CivicType = "event" | "artifact" | "neighborhood" | "era" | "moment";
export type CivicRelationship = {
  id?: string;
  from_type: string;
  from_id: string | null;
  to_type: string;
  to_id: string;
};
export type CivicActions = {
  status: string;
  isPublished: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canHide: boolean;
  canRestore: boolean;
};

export class CivicRequestError extends Error {
  constructor(message: string, public unconfirmed = false) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function civicRequest(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    console.error("Civic request failed:", error);
    throw new CivicRequestError("Request outcome is unconfirmed. Verify the record before retrying.", true);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    console.error("Invalid civic response:", error);
    const unconfirmed = response.ok || response.status >= 500;
    throw new CivicRequestError(
      unconfirmed ? "Request outcome is unconfirmed. Verify the record before retrying." : "Unable to read the error response.",
      unconfirmed,
    );
  }
  if (!response.ok) {
    const unconfirmed = response.status >= 500 || (isRecord(body) && body.code === "unconfirmed");
    const message = isRecord(body) && typeof body.error === "string" ? body.error : "Request failed.";
    throw new CivicRequestError(unconfirmed ? `${message} The outcome is unconfirmed; verify before retrying.` : message, unconfirmed);
  }
  if (!isRecord(body)) throw new CivicRequestError("Request outcome is unconfirmed. Verify the record before retrying.", true);
  return body;
}

export function readCivicMutation(body: Record<string, unknown>, type: CivicType): string {
  const result = body.result;
  if (!isRecord(result)) {
    throw new CivicRequestError("Request outcome is unconfirmed. Verify the record before retrying.", true);
  }
  const id = result[`${type}Id`];
  if (typeof id !== "string" || !id || typeof result.auditId !== "string" || !result.auditId) {
    throw new CivicRequestError("Request outcome is unconfirmed. Verify the record before retrying.", true);
  }
  return id;
}

export function readCivicActions(body: Record<string, unknown>): CivicActions {
  const actions = body.actions;
  if (!isRecord(actions) || typeof actions.status !== "string"
      || typeof actions.isPublished !== "boolean" || typeof actions.canEdit !== "boolean"
      || typeof actions.canApprove !== "boolean" || typeof actions.canHide !== "boolean"
      || typeof actions.canRestore !== "boolean") {
    throw new CivicRequestError("Unable to confirm lifecycle permissions.");
  }
  return {
    status: actions.status, isPublished: actions.isPublished, canEdit: actions.canEdit,
    canApprove: actions.canApprove, canHide: actions.canHide, canRestore: actions.canRestore,
  };
}

export async function saveCivicRelationships(
  supabase: SupabaseClient, type: CivicType, id: string, relationships: CivicRelationship[],
) {
  const { error: deleteError } = await supabase.from("civic_relationships")
    .delete().eq("from_type", type).eq("from_id", id);
  if (deleteError) throw deleteError;
  if (!relationships.length) return;
  const { error } = await supabase.from("civic_relationships").insert(
    relationships.map(({ to_type, to_id }) => ({ from_type: type, from_id: id, to_type, to_id })),
  );
  if (error) throw error;
}

type LinkTable = "event_eras" | "moment_eras" | "moment_places" | "moment_neighborhoods";
export async function saveCivicLinks(
  supabase: SupabaseClient, table: LinkTable, sourceColumn: "event_id" | "moment_id",
  targetColumn: "era_id" | "place_id" | "neighborhood_id", id: string, targets: string[],
) {
  const rows = targets.map((target) => ({
    ...(table === "event_eras" ? {} : { id: crypto.randomUUID() }),
    [sourceColumn]: id, [targetColumn]: target,
  }));
  const { error: deleteError } = await supabase.from(table).delete().eq(sourceColumn, id);
  if (deleteError) throw deleteError;
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}
