"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [place, setPlace] = useState<any>(null);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
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

      const { data: placeData } = await supabase
        .from("civic_places")
        .select("*")
        .eq("slug", placeSlug)
        .eq("city_id", city.id)
        .single();

      const { data: neighborhoodList } = await supabase
        .from("civic_neighborhoods")
        .select("name")
        .eq("city_id", city.id)
        .order("name", { ascending: true });

      setPlace(placeData);
      setNeighborhoods(neighborhoodList || []);
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
        latitude: place.latitude ? Number(place.latitude) : null,
        longitude: place.longitude ? Number(place.longitude) : null,
        year_built: place.year_built ? Number(place.year_built) : null,
        year_demolished: place.year_demolished ? Number(place.year_demolished) : null,
        neighborhood: place.neighborhood,
        is_published: place.is_published,
      })
      .eq("id", place.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
      return;
    }

    router.push(`/${citySlug}/places`);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Place</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={place.name}
          onChange={(e) => setPlace({ ...place, name: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={place.slug}
          onChange={(e) => setPlace({ ...place, slug: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={place.place_type}
          onChange={(e) => setPlace({ ...place, place_type: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={place.description}
          onChange={(e) => setPlace({ ...place, description: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={place.latitude || ""}
          onChange={(e) => setPlace({ ...place, latitude: Number(e.target.value) })}
        />

        <input
          className="border p-2 w-full"
          value={place.longitude || ""}
          onChange={(e) => setPlace({ ...place, longitude: Number(e.target.value) })}
        />

        <input
          className="border p-2 w-full"
          value={place.year_built || ""}
          onChange={(e) => setPlace({ ...place, year_built: Number(e.target.value) })}
        />

        <input
          className="border p-2 w-full"
          value={place.year_demolished || ""}
          onChange={(e) =>
            setPlace({ ...place, year_demolished: Number(e.target.value) })
          }
        />

        <select
          className="border p-2 w-full"
          value={place.neighborhood || ""}
          onChange={(e) => setPlace({ ...place, neighborhood: e.target.value })}
        >
          <option value="">Select Neighborhood</option>
          {neighborhoods.map((n) => (
            <option key={n.name} value={n.name}>
              {n.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={place.is_published}
            onChange={(e) => setPlace({ ...place, is_published: e.target.checked })}
          />
          Published
        </label>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={save}
        >
          Save Changes
        </button>

        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to delete this Place? This cannot be undone.")) {
              return;
            }

            const { error } = await supabase
              .from("civic_places")
              .delete()
              .eq("id", place.id);

            if (error) {
              console.error(error);
              alert("Error deleting place.");
              return;
            }

            router.push(`/${citySlug}/places`);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Place
        </button>

        <button
          onClick={() => router.push(`/${citySlug}/places`)}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
