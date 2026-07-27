"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditEraPage({
  params,
}: {
  params: { citySlug: string; eraSlug: string };
}) {
  const { citySlug, eraSlug } = params;

  const [era, setEra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Lookup city_id
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      // Load era
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("slug", eraSlug)
        .eq("city_id", city.id)
        .single();

      setEra(data);
      setLoading(false);
    }

    load();
  }, [citySlug, eraSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!era) return <div className="p-6">Era not found</div>;

  async function save() {
    const { error } = await supabase
      .from("civic_eras")
      .update({
        name: era.name,
        slug: era.slug,
        description: era.description,
        start_year: era.start_year,
        end_year: era.end_year,
        is_published: era.is_published,
      })
      .eq("id", era.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
    } else {
      alert("Era updated!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Era</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={era.name}
          onChange={(e) => setEra({ ...era, name: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={era.slug}
          onChange={(e) => setEra({ ...era, slug: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={era.description}
          onChange={(e) => setEra({ ...era, description: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={era.start_year || ""}
          onChange={(e) => setEra({ ...era, start_year: Number(e.target.value) })}
        />

        <input
          className="border p-2 w-full"
          value={era.end_year || ""}
          onChange={(e) => setEra({ ...era, end_year: Number(e.target.value) })}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={era.is_published}
            onChange={(e) => setEra({ ...era, is_published: e.target.checked })}
          />
          Published
        </label>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={save}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
