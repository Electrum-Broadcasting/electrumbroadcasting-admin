"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useCivicCreate } from "@/hooks/useCivicObjectMutation";

export default function CreateNeighborhoodPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const router = useRouter();

  const [supabase] = useState(createBrowserClient);
  const mutation = useCivicCreate("neighborhood", citySlug, "neighborhoods");

  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function load() {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      setCityId(city.id);
      setLoading(false);
    }

    load();
  }, [citySlug, supabase]);

  async function handleCreate() {
    if (!cityId) return;

    await mutation.create({ name, ...(slug.trim() ? { slug } : {}), description });
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Create Neighborhood</h1>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      <p>Neighborhoods are created pending and unpublished.</p>

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

        <button
          onClick={handleCreate}
          disabled={mutation.busy || mutation.unconfirmed || !cityId}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Neighborhood
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
