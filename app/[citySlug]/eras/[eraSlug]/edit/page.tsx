"use client";

import { useRouter } from "next/navigation";
import { useLoadEra } from "@/hooks/useLoadEra";
import { useCivicEdit } from "@/hooks/useCivicObjectMutation";
import CivicLifecycleControls from "@/components/admin/CivicLifecycleControls";

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
  } = useLoadEra(citySlug, eraSlug);
  const mutation = useCivicEdit("era", era?.id ?? null, citySlug, "eras");

  if (loading) return <div className="p-6">Loading…</div>;
  if (!era) return <div className="p-6">Era not found</div>;

  async function handleSave() {
    await mutation.save({ name, slug, start_year: startYear, end_year: endYear, description });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Era</h1>
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

        <input
          className="border p-2 w-full"
          placeholder="Start Year"
          type="number"
          value={startYear ?? ""}
          onChange={(e) => setStartYear(e.target.value === "" ? null : Number(e.target.value))}
        />

        <input
          className="border p-2 w-full"
          placeholder="End Year"
          type="number"
          value={endYear ?? ""}
          onChange={(e) => setEndYear(e.target.value === "" ? null : Number(e.target.value))}
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
  onClick={() => router.push(`/${citySlug}/eras`)}
  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
>
  Cancel
</button>

        
      </div>
    </div>
  );
}
