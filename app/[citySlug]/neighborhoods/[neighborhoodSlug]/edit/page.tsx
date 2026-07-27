"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditNeighborhoodPage({
  params,
}: {
  params: { citySlug: string; neighborhoodSlug: string };
}) {
  const { citySlug, neighborhoodSlug } = params;

  const [neighborhood, setNeighborhood] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      const { data } = await supabase
        .from("civic_neighborhoods")
        .select("*")
        .eq("slug", neighborhoodSlug)
        .eq("city_id", city.id)
        .single();

      setNeighborhood(data);
      setLoading(false);
    }

    load();
  }, [citySlug, neighborhoodSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!neighborhood) return <div className="p-6">Neighborhood not found</div>;

  async function save() {
    const { error } = await supabase
      .from("civic_neighborhoods")
      .update({
        name: neighborhood.name,
        slug: neighborhood.slug,
        description: neighborhood.description,
        is_published: neighborhood.is_published,
      })
      .eq("id", neighborhood.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
    } else {
      alert("Neighborhood updated!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Neighborhood</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={neighborhood.name}
          onChange={(e) => setNeighborhood({ ...neighborhood, name: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={neighborhood.slug}
          onChange={(e) => setNeighborhood({ ...neighborhood, slug: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={neighborhood.description}
          onChange={(e) => setNeighborhood({ ...neighborhood, description: e.target.value })}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={neighborhood.is_published}
            onChange={(e) => setNeighborhood({ ...neighborhood, is_published: e.target.checked })}
          />
          Published
        </label>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={save}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
