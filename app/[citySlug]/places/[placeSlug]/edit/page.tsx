"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();

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
    const response = await fetch(`/api/admin/civic-places/${place.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: place.name,
        slug: place.slug,
        place_type: place.place_type,
        description: place.description,
        latitude: place.latitude == null || place.latitude === "" ? null : Number(place.latitude),
        longitude: place.longitude == null || place.longitude === "" ? null : Number(place.longitude),
        year_built: place.year_built == null || place.year_built === "" ? null : Number(place.year_built),
        year_demolished: place.year_demolished == null || place.year_demolished === "" ? null : Number(place.year_demolished),
        neighborhood: place.neighborhood,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      alert(result?.error || "Failed to save changes");
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
          onChange={(e) =>
            setPlace({ ...place, latitude: e.target.value === "" ? null : Number(e.target.value) })
          }
        />

        <input
          className="border p-2 w-full"
          value={place.longitude || ""}
          onChange={(e) =>
            setPlace({ ...place, longitude: e.target.value === "" ? null : Number(e.target.value) })
          }
        />

        <input
          className="border p-2 w-full"
          value={place.year_built || ""}
          onChange={(e) =>
            setPlace({ ...place, year_built: e.target.value === "" ? null : Number(e.target.value) })
          }
        />

        <input
          className="border p-2 w-full"
          value={place.year_demolished || ""}
          onChange={(e) =>
            setPlace({
              ...place,
              year_demolished: e.target.value === "" ? null : Number(e.target.value),
            })
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

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={save}
        >
          Save Changes
        </button>

        <button
          onClick={async () => {
            if (!confirm("Hide this Place? It will no longer be publicly visible.")) {
              return;
            }

            const response = await fetch(`/api/admin/civic-places/${place.id}/hide`, {
              method: "POST",
            });

            if (!response.ok) {
              const result = await response.json().catch(() => null);
              alert(result?.error || "Error hiding Place.");
              return;
            }

            router.push(`/${citySlug}/places`);
          }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          Hide Place
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
