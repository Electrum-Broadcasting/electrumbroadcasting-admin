"use client";

import type { CivicActions } from "@/lib/admin/civicObjectClient";

export default function CivicLifecycleControls({
  actions, busy, unconfirmed, transition,
}: {
  actions: CivicActions | null;
  busy: boolean;
  unconfirmed: boolean;
  transition: (operation: "approve" | "hide" | "restore") => void;
}) {
  if (!actions) return null;
  const disabled = busy || unconfirmed;
  return (
    <div className="space-y-2">
      <p>Status: {actions.status} · Published: {actions.isPublished ? "Yes" : "No"}</p>
      <div className="flex gap-4">
        {actions.canApprove && <button disabled={disabled} onClick={() => transition("approve")}>Approve</button>}
        {actions.canHide && <button disabled={disabled} onClick={() => transition("hide")}>Hide</button>}
        {actions.canRestore && <button disabled={disabled} onClick={() => transition("restore")}>Restore to Pending</button>}
      </div>
    </div>
  );
}
