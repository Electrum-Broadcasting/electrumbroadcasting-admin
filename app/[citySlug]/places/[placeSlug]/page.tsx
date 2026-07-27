"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlaceDetailPage({
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{place.name}</h1>

      <p className="text-gray-700">{place.description}</p>

      <p className="text-gray-500">Type: {place.place_type || "—"}</p>
      <p className="text-gray-500">Neighborhood: {place.neighborhood || "—"}</p>

      <p className="text-gray-500">
        Coordinates: {place.latitude}, {place.longitude}
      </p>

      <p className="text-gray-500">
        Built: {place.year_built || "—"}  
        {place.year_demolished ? ` | Demolished: ${place.year_demolished}` : ""}
      </p>
    </div>
  );
}
