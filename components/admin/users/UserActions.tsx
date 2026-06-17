"use client";

import { useState } from "react";

export function UserActions({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    setLoading(true);

    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setLoading(false);
    window.location.reload();
  }

  async function handleRemove() {
    if (!confirm("Are you sure you want to permanently remove this user?")) return;

    setLoading(true);

    await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });

    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      {user.status === "suspended" ? (
        <button
          onClick={() => handleAction("reinstate")}
          disabled={loading}
          className="text-green-600 hover:underline text-sm"
        >
          Reinstate
        </button>
      ) : (
        <button
          onClick={() => handleAction("suspend")}
          disabled={loading}
          className="text-yellow-600 hover:underline text-sm"
        >
          Suspend
        </button>
      )}

      <button
        onClick={handleRemove}
        disabled={loading}
        className="text-red-600 hover:underline text-sm"
      >
        Remove
      </button>
    </div>
  );
}
