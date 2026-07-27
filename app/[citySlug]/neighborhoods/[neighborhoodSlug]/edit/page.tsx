"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditNeighborhoodPage({ params }: { params: { neighborhoodSlug: string } }) {
  const { neighborhoodSlug } = params;

  const [neighborhood, setNeighborhood] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("neighborhoods")
        .select("*")
        .eq("slug", neighborhoodSlug)
        .single();

      setNeighborhood(data);
    }

    load();
  }, [neighborhoodSlug]);

  async function save() {
    if (!neighborhood) return;
    await supabase
      .from("neighborhoods")
      .update(neighborhood)
      .eq("id", neighborhood.id);
  }

  if (!neighborhood) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Neighborhood</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={neighborhood.name}
          onChange={(e) => setNeighborhood({ ...neighborhood, name: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={neighborhood.description || ""}
          onChange={(e) =>
            setNeighborhood({ ...neighborhood, description: e.target.value })
          }
        />

        <input
          className="border p-2 w-full"
          value={neighborhood.image_url || ""}
          onChange={(e) =>
            setNeighborhood({ ...neighborhood, image_url: e.target.value })
          }
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
