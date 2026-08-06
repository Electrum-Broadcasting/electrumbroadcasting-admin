"use client";

import React from "react";

interface EntitySaveActionsProps {
  mode: "create" | "edit";

  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export default function EntitySaveActions({
  mode,
  onSave,
  onDelete,
  onCancel,
}: EntitySaveActionsProps) {
  return (
    <section className="space-y-4 pt-6 border-t">
      {/* Save */}
      <button
        type="button"
        onClick={onSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {mode === "create" ? "Create Entity" : "Save Changes"}
      </button>

      {/* Delete (edit mode only) */}
      {mode === "edit" && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Entity
        </button>
      )}

      {/* Cancel (create mode only) */}
      {mode === "create" && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      )}
    </section>
  );
}
