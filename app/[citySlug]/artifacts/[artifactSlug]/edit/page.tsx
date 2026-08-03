"use client";

import { useRouter } from "next/navigation";
import { useLoadArtifact } from "@/hooks/useLoadArtifact";
import { saveArtifact } from "@/lib/artifacts/saveArtifact";

import RelationshipSelector from "@/components/relationships/RelationshipSelector";

interface EditArtifactPageProps {
  params: {
    citySlug: string;
    artifactSlug: string;
  };
}

export default function EditArtifactPage({ params }: EditArtifactPageProps) {
  const { citySlug, artifactSlug } = params;
  const router = useRouter();

  const {
    loading,
    artifact,
    cityId,

    // Form fields
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    artifactType,
    setArtifactType,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,

    // Relationship targets
    events,
    entities,
    stories,

    // Unified relationships
    existingRelationships,
  } = useLoadArtifact(citySlug, artifactSlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!artifact) return <div className="p-6">Artifact not found</div>;

  async function handleSave() {
    await saveArtifact({
      artifactId: artifact.id,
      citySlug,
      router,

      // Form fields
      title,
      slug,
      description,
      artifactType,
      thumbnailUrl,
      isPublished,

      // Unified relationships
      existingRelationships,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Artifact</h1>

      <div className="space-y-8">
        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Artifact Type"
          value={artifactType}
          onChange={(e) => setArtifactType(e.target.value)}
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
          fromType="artifact"
          fromId={artifact.id}
          availableTargets={[
            { type: "event", label: "Events", items: events },
            { type: "entity", label: "Entities", items: entities },
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
