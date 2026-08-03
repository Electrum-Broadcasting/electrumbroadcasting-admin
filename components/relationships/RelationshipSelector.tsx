"use client";

import { useState, useEffect } from "react";

export default function RelationshipSelector({
  fromType,
  fromId,
  availableTargets,
  initialRelationships,
  onChange,
}) {
  const [selected, setSelected] = useState(initialRelationships || []);

  useEffect(() => {
    console.log("Selector called from:", fromType, fromId, "onChange:", onChange);
    onChange(selected);
  }, [selected]);

  function toggleRelationship(rel) {
    const exists = selected.some(
      (r) =>
        r.to_type === rel.to_type &&
        r.to_id === rel.to_id
    );

    if (exists) {
      // REMOVE
      setSelected(selected.filter(
        (r) =>
          !(r.to_type === rel.to_type && r.to_id === rel.to_id)
      ));
    } else {
      // ADD
      setSelected([
        ...selected,
        {
          from_type: fromType,
          from_id: fromId || null, // null during create
          to_type: rel.to_type,
          to_id: rel.to_id,
        },
      ]);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Relationships</h2>

      {availableTargets.map((group) => (
        <div key={group.type}>
          <h3 className="font-medium mb-2">{group.label}</h3>

          <div className="space-y-2">
            {group.items.map((item) => {
              const rel = {
                to_type: group.type,
                to_id: item.id,
              };

              const isSelected = selected.some(
                (r) =>
                  r.to_type === rel.to_type &&
                  r.to_id === rel.to_id
              );

              return (
                <label key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRelationship(rel)}
                  />
                  {item.name || item.title}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
