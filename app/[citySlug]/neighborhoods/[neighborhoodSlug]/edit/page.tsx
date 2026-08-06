"use client";

import { useRouter } from "next/navigation";
import { useLoadNeighborhood } from "@/hooks/useLoadNeighborhood";
import { saveNeighborhood } from "@/lib/neighborhoods/saveNeighborhood";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to delete this Neighborhood? This cannot be undone.")) {
              return;
            }

            const { error } = await supabase
              .from("civic_neighborhoods")
              .delete()
              .eq("id", neighborhood.id);

            if (error) {
              console.error(error);
              alert("Error deleting neighborhood.");
              return;
            }

            router.push(`/${citySlug}/neighborhoods`);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Neighborhood
        </button>

        <button
          onClick={() => router.push(`/${citySlug}/neighborhoods`)}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
