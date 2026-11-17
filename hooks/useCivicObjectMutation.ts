"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  civicRequest, CivicRequestError, readCivicActions, readCivicMutation,
  type CivicActions, type CivicType,
} from "@/lib/admin/civicObjectClient";

type Metadata = Record<string, string | number | string[] | null>;

export function useCivicCreate(type: CivicType, citySlug: string, listPath: string) {
  const router = useRouter();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(data: Metadata, saveLinks?: (id: string) => Promise<void>, destination?: string) {
    if (busy || unconfirmed) return;
    setBusy(true);
    setError(null);
    let id = createdId;
    try {
      if (!id) {
        const body = await civicRequest(`/api/admin/civic-objects/${type}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citySlug, ...data }),
        });
        id = readCivicMutation(body, type);
        setCreatedId(id);
      }
      if (saveLinks) await saveLinks(id);
      router.push(destination ?? `/${citySlug}/${listPath}`);
    } catch (error) {
      console.error(`Failed to create ${type} or save relationships:`, error);
      if (id) {
        setError(`Record created (ID: ${id}), but relationships could not be saved and may have changed. Retry relationships or return to the list.`);
      } else {
        setUnconfirmed(!(error instanceof CivicRequestError) || error.unconfirmed);
        setError(error instanceof CivicRequestError ? error.message : "Creation outcome is unconfirmed. Verify before retrying.");
      }
    } finally {
      setBusy(false);
    }
  }
  return { create, createdId, busy, unconfirmed, error };
}

export function useCivicEdit(type: CivicType, id: string | null, citySlug: string, listPath: string) {
  const router = useRouter();
  const [actions, setActions] = useState<CivicActions | null>(null);
  const [busy, setBusy] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const url = `/api/admin/civic-objects/${type}/${id}`;

  useEffect(() => {
    if (!id) return;
    let active = true;
    setActions(null);
    civicRequest(url).then((body) => {
      if (active) setActions(readCivicActions(body));
    }).catch((error: unknown) => {
      console.error(`Failed to load ${type} permissions:`, error);
      if (active) setError(error instanceof Error ? error.message : "Unable to load permissions.");
    });
    return () => { active = false; };
  }, [id, type, url]);

  async function save(data: Metadata, destination?: string) {
    if (!id || busy || unconfirmed || !actions?.canEdit) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const body = await civicRequest(url, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (readCivicMutation(body, type) !== id) {
        throw new CivicRequestError("Request outcome is unconfirmed. Verify the record before retrying.", true);
      }
      router.push(destination ?? `/${citySlug}/${listPath}`);
    } catch (error) {
      console.error(`Failed to save ${type} metadata:`, error);
      setUnconfirmed(!(error instanceof CivicRequestError) || error.unconfirmed);
      setError(error instanceof CivicRequestError ? error.message : "Save outcome is unconfirmed. Verify before retrying.");
    } finally { setBusy(false); }
  }

  async function saveLinks(save: () => Promise<void>) {
    if (!id || busy || unconfirmed || !actions?.canEdit) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await save();
      setMessage("Relationships saved.");
    } catch (error) {
      console.error(`Failed to save ${type} relationships:`, error);
      setError("Relationships could not be saved and may have changed. Retry or reload to verify.");
    } finally { setBusy(false); }
  }

  async function transition(operation: "approve" | "hide" | "restore") {
    if (!id || busy || unconfirmed || !actions) return;
    if (!actions[operation === "approve" ? "canApprove" : operation === "hide" ? "canHide" : "canRestore"]) return;
    const prompt = operation === "approve" ? "Approve and publish this record?"
      : operation === "hide" ? "Hide this record?" : "Restore this record to pending and unpublished?";
    if (!confirm(prompt)) return;
    setBusy(true); setError(null); setMessage(null);
    let confirmed = false;
    try {
      const body = await civicRequest(`${url}/${operation}`, { method: "POST" });
      if (readCivicMutation(body, type) !== id) {
        throw new CivicRequestError("Request outcome is unconfirmed. Verify the record before retrying.", true);
      }
      confirmed = true;
      setActions(readCivicActions(await civicRequest(url)));
    } catch (error) {
      console.error(`Failed ${type} lifecycle action:`, error);
      setActions(null);
      if (confirmed) {
        setError("Lifecycle action succeeded, but permissions could not be refreshed. Reload to continue.");
      } else {
        const uncertain = !(error instanceof CivicRequestError) || error.unconfirmed;
        setUnconfirmed(uncertain);
        setError(error instanceof CivicRequestError ? error.message : "Action outcome is unconfirmed. Verify before retrying.");
        if (!uncertain) {
          try { setActions(readCivicActions(await civicRequest(url))); }
          catch (refreshError) {
            console.error("Failed to refresh lifecycle permissions:", refreshError);
            setError("Action failed and permissions could not be refreshed. Reload to continue.");
          }
        }
      }
    } finally { setBusy(false); }
  }
  return { actions, busy, unconfirmed, error, message, save, saveLinks, transition };
}
