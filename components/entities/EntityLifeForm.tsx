"use client";

import React from "react";

interface EntityLifeFormProps {
  birthYear: number | null;
  setBirthYear: (v: number | null) => void;

  deathYear: number | null;
  setDeathYear: (v: number | null) => void;

  // Optional: if you want era auto-assignment inside the form
  onEraAutoAssign?: (eraId: string | null) => void;
}

export default function EntityLifeForm({
  birthYear,
  setBirthYear,
  deathYear,
  setDeathYear,
  onEraAutoAssign,
}: EntityLifeFormProps) {
  // Optional: era auto-assignment hook
  React.useEffect(() => {
    if (!onEraAutoAssign) return;

    if (birthYear && deathYear) {
      // The parent page or saveEntity.ts will handle actual era lookup.
      onEraAutoAssign(null);
    }
  }, [birthYear, deathYear, onEraAutoAssign]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Life & Timeline</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Birth Year */}
        <div>
          <label className="block text-sm font-medium mb-1">Birth Year</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={birthYear ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setBirthYear(v === "" ? null : Number(v));
            }}
            placeholder="e.g., 1936"
          />
        </div>

        {/* Death Year */}
        <div>
          <label className="block text-sm font-medium mb-1">Death Year</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={deathYear ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setDeathYear(v === "" ? null : Number(v));
            }}
            placeholder="Leave blank if still living"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Birth and death years help auto‑assign eras and improve timeline
        placement.
      </p>
    </section>
  );
}
