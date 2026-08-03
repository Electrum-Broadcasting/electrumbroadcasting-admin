"use client";

import { useRouter } from "next/navigation";
import { useLoadNeighborhood } from "@/hooks/useLoadNeighborhood";
import { saveNeighborhood } from "@/lib/neighborhoods/saveNeighborhood";

interface EditNeighborhoodPageProps {
  params: {
    citySlug: string;
    neighborhoodSlug: string;
  };
}

export default function EditNeighborhoodPage({ params }: EditNeighborhoodPageProps) {
  const { citySlug, neighborhoodSlug } = params;
  const router = useRouter();

  const {
    loading,
    neighborhood,
    cityId,

    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,
  } = useLoadNeighborhood(citySlug, neighborhoodSlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!neighborhood) return <div className="p-6">Neighborhood not found</div>;

  async function handleSave() {
    await saveNeighborhood({
      neighborhoodId: neighborhood.id,
      citySlug,
      router,

      name,
      slug,
      description,
      thumbnailUrl,
      isPublished,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Neighborhood</h1>

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
