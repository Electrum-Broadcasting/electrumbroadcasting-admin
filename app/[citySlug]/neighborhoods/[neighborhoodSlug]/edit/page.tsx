"use client";

import { useRouter } from "next/navigation";
import { useLoadNeighborhood } from "@/hooks/useLoadNeighborhood";
import { useCivicEdit } from "@/hooks/useCivicObjectMutation";
import CivicLifecycleControls from "@/components/admin/CivicLifecycleControls";

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

    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
  } = useLoadNeighborhood(citySlug, neighborhoodSlug);
  const mutation = useCivicEdit("neighborhood", neighborhood?.id ?? null, citySlug, "neighborhoods");

  if (loading) return <div className="p-6">Loading…</div>;
  if (!neighborhood) return <div className="p-6">Neighborhood not found</div>;

  async function handleSave() {
    await mutation.save({ name, slug, description });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Neighborhood</h1>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      <CivicLifecycleControls {...mutation} />

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

        {mutation.actions?.canEdit && <button
          onClick={handleSave}
          disabled={mutation.busy || mutation.unconfirmed}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Metadata
        </button>}

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
