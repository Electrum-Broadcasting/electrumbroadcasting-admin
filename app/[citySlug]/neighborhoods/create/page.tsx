"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateNeighborhoodPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_published: false,
  });

  async function save() {
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();

    if (!city) {
      alert("City not found");
      return;
    }

    const { error } = await supabase.from("civic_neighborhoods").insert({
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/ /g, "-"),
      description: form.description,
      is_published: form.is_published,
      city_id: city.id,
    });

    if (error) {
      console.error(error);
      alert("Failed to save neighborhood");
    } else {
      alert("Neighborhood saved!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Neighborhood</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Published
        </label>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={save}
        >
          Save Neighborhood
        </button>
      </div>
    </div>
  );
}
