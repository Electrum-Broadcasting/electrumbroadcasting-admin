import { civicRequest, CivicRequestError } from "@/lib/admin/civicObjectClient";
import { isRelationshipUuid, parseMomentSnapshot, type MomentRelationshipSnapshot } from "@/lib/moments/relationships";

type MomentSaveResult = {
  sourceId: string;
  cityId: string;
  changed: boolean;
  auditId: string | null;
  addedCount: number;
  removedCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function loadMomentRelationships(momentId: string, expectedCityId: string): Promise<MomentRelationshipSnapshot> {
  const body = await civicRequest(`/api/admin/civic-objects/moment/${encodeURIComponent(momentId)}/relationships`, {
    cache: "no-store",
  });
  const snapshot = parseMomentSnapshot(body.snapshot);
  if (body.cityId !== expectedCityId || !snapshot) {
    throw new CivicRequestError("Unable to confirm complete Moment relationships or city. Reload before saving.");
  }
  return snapshot;
}

export function createMomentRelationshipSaver() {
  let pending: { momentId: string; cityId: string; snapshot: MomentRelationshipSnapshot; key: string; fingerprint: string; uncertain: boolean } | null = null;
  let completed: { fingerprint: string; result: MomentSaveResult } | null = null;
  return {
    hasPending: () => pending !== null,
    clearCompleted: () => { completed = null; },
    async save(momentId: string, cityId: string, snapshot: MomentRelationshipSnapshot): Promise<MomentSaveResult> {
      const validated = parseMomentSnapshot(snapshot);
      if (!validated) throw new CivicRequestError("A complete Moment relationship snapshot is required.");
      const fingerprint = JSON.stringify({ momentId, cityId, snapshot: validated });
      if (pending && pending.fingerprint !== fingerprint) {
        throw new CivicRequestError("Retry the unconfirmed Moment relationship save before changing relationships.", true);
      }
      if (!pending && completed?.fingerprint === fingerprint) return completed.result;
      const request = pending ?? {
        momentId, cityId, snapshot: validated, key: crypto.randomUUID(), fingerprint, uncertain: false,
      };
      pending = request;
      try {
        const body = await civicRequest(`/api/admin/civic-objects/moment/${encodeURIComponent(momentId)}/relationships`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cityId: request.cityId, snapshot: request.snapshot, idempotencyKey: request.key }),
        });
        const result = body.result;
        if (!isRecord(result) || result.sourceId !== momentId || result.cityId !== cityId
            || typeof result.changed !== "boolean"
            || (result.changed ? !isRelationshipUuid(result.auditId) : result.auditId !== null)
            || typeof result.addedCount !== "number" || !Number.isInteger(result.addedCount) || result.addedCount < 0
            || typeof result.removedCount !== "number" || !Number.isInteger(result.removedCount) || result.removedCount < 0
            || (result.changed && result.addedCount === 0 && result.removedCount === 0)
            || (!result.changed && (result.addedCount !== 0 || result.removedCount !== 0))) {
          throw new CivicRequestError("Moment relationship save outcome is unconfirmed. Retry the same request.", true);
        }
        const confirmation: MomentSaveResult = {
          sourceId: momentId, cityId, changed: result.changed,
          auditId: result.changed ? String(result.auditId) : null,
          addedCount: result.addedCount, removedCount: result.removedCount,
        };
        pending = null;
        completed = { fingerprint, result: confirmation };
        return confirmation;
      } catch (error) {
        if (error instanceof CivicRequestError && !error.unconfirmed) {
          if (!request.uncertain) pending = null;
          else throw new CivicRequestError(`The earlier Moment save remains unconfirmed. ${error.message} Retry the same request.`, true);
        } else {
          request.uncertain = true;
        }
        throw error;
      }
    },
  };
}
