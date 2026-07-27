"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NeighborhoodDetailPage({
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{neighborhood.name}</h1>

      <p className="text-gray-700">{neighborhood.description}</p>
    </div>
  );
}
