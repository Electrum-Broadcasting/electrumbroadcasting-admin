"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditPlacePage({
  params,
}: {
  params: { citySlug: string; placeSlug: string };
}) {
  const { citySlug, placeSlug } = params;

  const [place, setPlace] = useState<any>(null);
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
        .from("civic_places")
        .select("*")
        .eq("slug", placeSlug)
        .eq("city_id", city.id)
        .single();

      setPlace(data);
      setLoading(false);
    }

    load();
  }, [citySlug, placeSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!place) return <div className="p-6">Place not found</div>;

  async function save() {
    const { error } = await supabase
      .from("civic_places")
      .update({
        name: place.name,
        slug: place.slug,
        place_type: place.place_type,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        year_built: place.year_built,
        year_demolished: place.year_demolished,
        neighborhood: place.neighborhood,
        is_published: place.is_published,
      })
      .eq("id", place.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
    } else {
      alert("Place updated!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Place</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" value={place.name}
          onChange={(e) => setPlace({ ...place, name: e.target.value })} />

        <input className="border p-2 w-full" value={place.slug}
          onChange={(e) => setPlace({ ...place, slug: e.target.value })} />

        <input className="border p-2 w-full" value={place.place_type}
          onChange={(e) => setPlace({ ...place, place_type: e.target.value })} />

        <textarea className="border p-2 w-full" value={place.description}
          onChange={(e) => setPlace({ ...place, description: e.target.value })} />

        <input className="border p-2 w-full" value={place.latitude || ""}
          onChange={(e) => setPlace({ ...place, latitude: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={place.longitude || ""}
          onChange={(e) => setPlace({ ...place, longitude: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={place.year_built || ""}
          onChange={(e) => setPlace({ ...place, year_built: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={place.year_demolished || ""}
          onChange={(e) => setPlace({ ...place, year_demolished: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={place.neighborhood || ""}
          onChange={(e) => setPlace({ ...place, neighborhood: e.target.value })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={place.is_published}
            onChange={(e) => setPlace({ ...place, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
