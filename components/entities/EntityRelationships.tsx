"use client";

import React from "react";
import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface EntityRelationshipsProps {
  entityId: string | null; // null for Create Entity
  events: any[];
  artifacts: any[];
  stories: any[];

  existingRelationships: any[];
  setExistingRelationships: (v: any[]) => void;
}

export default function EntityRelationships({
  entityId,
  events,
  artifacts,
  stories,
  existingRelationships,
  setExistingRelationships,
}: EntityRelationshipsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Relationships</h2>

      <p className="text-xs text-gray-500">
        Link this entity to events, artifacts, and stories. These relationships
        help build the civic graph.
      </p>

      <RelationshipSelector
        fromType="entity"
        fromId={entityId ?? undefined} // undefined for create mode
        availableTargets={[
          { type: "event", label: "Events", items: events },
          { type: "artifact", label: "Artifacts", items: artifacts },
          { type: "story", label: "Stories", items: stories },
        ]}
        initialRelationships={existingRelationships}
        onChange={setExistingRelationships}
      />
    </section>
  );
}
