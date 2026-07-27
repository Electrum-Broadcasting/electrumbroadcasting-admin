"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Place {
  name: string;
  image_url?: string;
  address?: string;
  description: string;
  [key: string]: any;
}

export default function PlaceAdminDetailPage({ params }: { params: { placeSlug: string } }) {
  const { placeSlug } = params;

  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("civic_places")
        .select("*")
        .eq("slug", placeSlug)
        .single();

      setPlace(data);
    }

    load();
  }, [placeSlug]);

  if (!place) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{place.name}</h1>

      {place.image_url && (
        <img src={place.image_url} alt={place.name}
          className="rounded-lg shadow max-w-xl" />
      )}

      {place.address && (
        <p className="text-gray-600">{place.address}</p>
      )}

      <p className="text-gray-700">{place.description}</p>
    </div>
  );
}
