"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditEraPage({ params }: { params: { eraSlug: string } }) {
  const { eraSlug } = params;

  const [era, setEra] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("slug", eraSlug)
        .single();

      setEra(data);
    }

    load();
  }, [eraSlug]);

  async function save() {
    await supabase
      .from("civic_eras")
      .update(era)
      .eq("id", era.id);
  }

  if (!era) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Era</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={era.name}
          onChange={(e) => setEra({ ...era, name: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={era.description || ""}
          onChange={(e) => setEra({ ...era, description: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={era.cultural_significance || ""}
          onChange={(e) =>
            setEra({ ...era, cultural_significance: e.target.value })
          }
        />

        <div className="flex gap-4">
          <input
            className="border p-2 w-full"
            type="number"
            value={era.start_year || ""}
            onChange={(e) =>
              setEra({ ...era, start_year: Number(e.target.value) })
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            value={era.end_year || ""}
            onChange={(e) =>
              setEra({ ...era, end_year: Number(e.target.value) })
            }
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
