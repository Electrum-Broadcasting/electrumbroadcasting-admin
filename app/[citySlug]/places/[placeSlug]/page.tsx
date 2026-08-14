"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();

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

      <p className="text-gray-700 whitespace-pre-line">
        {place.description || "No description provided."}
      </p>

      <div className="text-gray-500">
        <span className="font-medium">Type:</span> {place.place_type || "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Neighborhood:</span> {place.neighborhood || "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Coordinates:</span>{" "}
        {place.latitude}, {place.longitude}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Built:</span> {place.year_built || "—"}
        {place.year_demolished ? ` | Demolished: ${place.year_demolished}` : ""}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Slug:</span> {place.slug}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Published:</span>{" "}
        {place.is_published ? "Yes" : "No"}
      </div>

      <div className="text-gray-400 text-sm">
        Created: {new Date(place.created_at).toLocaleString()}
      </div>

      <div className="text-gray-400 text-sm">
        Updated: {new Date(place.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
