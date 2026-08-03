"use client";

import { useRouter } from "next/navigation";
import { useLoadEra } from "@/hooks/useLoadEra";
import { saveEra } from "@/lib/eras/saveEra";

interface EditEraPageProps {
  params: {
    citySlug: string;
    eraSlug: string;
  };
}

export default function EditEraPage({ params }: EditEraPageProps) {
  const { citySlug, eraSlug } = params;
  const router = useRouter();

  const {
    loading,
    era,
    cityId,

    name,
    setName,
    slug,
    setSlug,
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    description,
    setDescription,
    isPublished,
    setIsPublished,
  } = useLoadEra(citySlug, eraSlug);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!era) return <div className="p-6">Era not found</div>;

  async function handleSave() {
    await saveEra({
      eraId: era.id,
      citySlug,
      router,

      name,
      slug,
      startYear: startYear ?? 0,
      endYear: endYear ?? 0,
      description,
      isPublished,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Era</h1>

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
          placeholder="Start Year"
          type="number"
          value={startYear ?? ""}
          onChange={(e) => setStartYear(Number(e.target.value))}
        />

        <input
          className="border p-2 w-full"
          placeholder="End Year"
          type="number"
          value={endYear ?? ""}
          onChange={(e) => setEndYear(Number(e.target.value))}
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
      </div>
    </div>
  );
}
