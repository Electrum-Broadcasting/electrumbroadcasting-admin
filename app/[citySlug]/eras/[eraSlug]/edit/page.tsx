"use client";

import { useRouter } from "next/navigation";
import { useLoadEra } from "@/hooks/useLoadEra";
import { saveEra } from "@/lib/eras/saveEra";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

        <button
  onClick={async () => {
    if (!confirm("Are you sure you want to delete this Era? This cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("civic_eras")
      .delete()
      .eq("id", era.id);

    if (error) {
      console.error(error);
      alert("Error deleting era.");
      return;
    }

    router.push(`/${citySlug}/eras`);
  }}
  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
>
  Delete Era
</button>


        <button
  onClick={() => router.push(`/${citySlug}/eras`)}
  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
>
  Cancel
</button>

        
      </div>
    </div>
  );
}
