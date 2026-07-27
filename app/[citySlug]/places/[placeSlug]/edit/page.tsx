"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditPlacePage({ params }: { params: { placeSlug: string } }) {
  const { placeSlug } = params;

  const [place, setPlace] = useState<any>(null);

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

  async function save() {
    if (place) {
      await supabase.from("civic_places").update(place).eq("id", place.id);
    }
  }

  if (!place) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Place</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" value={place.name}
          onChange={(e) => setPlace({ ...place, name: e.target.value })} />

        <textarea className="border p-2 w-full" value={place.description || ""}
          onChange={(e) => setPlace({ ...place, description: e.target.value })} />

        <input className="border p-2 w-full" value={place.address || ""}
          onChange={(e) => setPlace({ ...place, address: e.target.value })} />

        <input className="border p-2 w-full" value={place.image_url || ""}
          onChange={(e) => setPlace({ ...place, image_url: e.target.value })} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
