"use client";

import { useState } from "react";

interface Relationship {
  id?: string;
  from_type: string;
  from_id: string | null;
  to_type: string;
  to_id: string;
}

interface TargetGroup {
  type: string;
  label: string;
  items: { id: string; name?: string; title?: string }[];
}

interface RelationshipSelectorProps {
  fromType: string;
  fromId: string | null;
  availableTargets: TargetGroup[];
  initialRelationships: Relationship[];
  onChange: (rels: Relationship[]) => void;
}

export default function RelationshipSelector({
  fromType,
  fromId,
  availableTargets,
  initialRelationships,
  onChange,
}: RelationshipSelectorProps) {
  const [relationships, setRelationships] = useState<Relationship[]>(
    initialRelationships || []
  );

  function toggleRelationship(rel: Relationship) {
    const exists = relationships.some(
      (r) => r.to_type === rel.to_type && r.to_id === rel.to_id
    );

    let updated: Relationship[];

    if (exists) {
      updated = relationships.filter(
        (r) => !(r.to_type === rel.to_type && r.to_id === rel.to_id)
      );
    } else {
      updated = [...relationships, rel];
    }

    setRelationships(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Relationships</h2>

      {availableTargets.map((group: TargetGroup) => (
        <div key={group.type} className="space-y-2">
          <h3 className="font-medium">{group.label}</h3>

          {group.items.map((item) => {
            const isSelected = relationships.some(
              (r) => r.to_type === group.type && r.to_id === item.id
            );

            return (
              <label key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    toggleRelationship({
                      from_type: fromType,
                      from_id: fromId,
                      to_type: group.type,
                      to_id: item.id,
                    })
                  }
                />
                {item.name || item.title}
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
