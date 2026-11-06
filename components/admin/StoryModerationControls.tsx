"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/lib/admin/types";
import { canModerateStory, type StoryOperation } from "@/lib/admin/storyModerationTypes";

const operations: { value: StoryOperation; label: string }[] = [
  { value: "unpublish", label: "Unpublish" },
  { value: "emergency_unpublish", label: "Emergency unpublish" },
  { value: "hide", label: "Hide" },
  { value: "place_hold", label: "Place safety hold" },
  { value: "lift_hold", label: "Lift safety hold" },
  { value: "escalate", label: "Escalate" },
  { value: "resolve_escalation", label: "Resolve escalation" },
];

export function StoryModerationControls({
  storyId, role, onComplete,
}: {
  storyId: string;
  role: AdminRole;
  onComplete?: () => void;
}) {
  const allowed = operations.filter(({ value }) => canModerateStory(role, value));
  const [operation, setOperation] = useState<StoryOperation>(allowed[0]?.value ?? "hide");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  if (!allowed.length) return null;

  async function submit() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/stories/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId, operation, reason,
          referenceLogId: operation === "resolve_escalation" ? reference : null,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Moderation failed");
      if (!body.result || typeof body.result.audit_id !== "string" || body.result.story_id !== storyId) {
        throw new Error("Unable to confirm result; refresh before retrying");
      }
      setFailed(false);
      setMessage(`Saved. Audit ID: ${body.result.audit_id}`);
      setReason("");
      setReference("");
      onComplete?.();
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Unable to confirm result; refresh before retrying");
    } finally {
      setPending(false);
    }
  }

  const needsReason = ["emergency_unpublish", "place_hold", "escalate", "resolve_escalation"].includes(operation);
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">Moderation operation</span>
        <select className="border rounded p-2" value={operation}
          onChange={(event) => {
            const selected = allowed.find((item) => item.value === event.target.value);
            if (selected) setOperation(selected.value);
          }}>
          {allowed.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      {needsReason && <label className="block">Reason or notes
        <textarea className="block w-full border rounded p-2" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>}
      {operation === "resolve_escalation" && <label className="block">Escalation audit ID
        <input className="block w-full border rounded p-2" value={reference} onChange={(event) => setReference(event.target.value)} />
      </label>}
      <button type="button" className="border rounded px-3 py-2" disabled={pending || !storyId}
        onClick={() => void submit()}>{pending ? "Saving..." : "Apply"}</button>
      {message && <p role={failed ? "alert" : "status"} className={failed ? "text-red-700" : "text-green-700"}>{message}</p>}
    </div>
  );
}
