"use client";

import { useRouter } from "next/navigation";
import { useLoadEntity } from "@/hooks/useLoadEntity";
import { saveEntity } from "@/lib/entities/saveEntity";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface EditEntityPageProps {
  params: {
    citySlug: string;
    entitySlug: string;
  };
}

export default function EditEntityPage({ params }: EditEntityPageProps) {
  const { citySlug, entitySlug } = params;
  const router = useRouter();

  const {
    loading,
    entity,
    cityId,

    // Form fields
    name,
    setName,
    slug,
    setSlug,
    entityType,
    setEntityType,
    description,
    setDescription,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,

    // Relationship targets
    events,
    artifacts,
    stories,

    // Unified relationships
    existingRelationships,
    setExistingRelationships,
  } = useLoadEntity(citySlug, entitySlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entity) return <div className="p-6">Entity not found</div>;

  async function handleSave() {
    await saveEntity({
      entityId: entity.id,
      citySlug,
      router,

      // Form fields
      name,
      slug,
      entityType,
      description,
      thumbnailUrl,
      isPublished,

      // Unified relationships
      existingRelationships,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Entity</h1>

      <div className="space-y-8">
        <input
          className="border p-2 w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Entity Type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Thumbnail URL"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <RelationshipSelector
          fromType="entity"
          fromId={entity.id}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "artifact", label: "Artifacts", items: artifacts },
            { type: "story", label: "Stories", items: stories },
          ]}
          initialRelationships={existingRelationships}
          onChange={setExistingRelationships}
        />

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
