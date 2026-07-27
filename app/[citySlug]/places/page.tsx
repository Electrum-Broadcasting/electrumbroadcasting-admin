"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlaceAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("civic_places")
        .select("*")
        .eq("city_slug", citySlug);

      setPlaces(data || []);
    }

    load();
  }, [citySlug]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Places</h1>

      <Link href={`/${citySlug}/places/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
        Create Place
      </Link>

      <div className="space-y-4">
        {places.map((place) => (
          <Link key={place.id}
            href={`/${citySlug}/places/${place.slug}/edit`}
            className="block border rounded p-4 hover:bg-gray-50">
            <div className="text-xl font-semibold">{place.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
