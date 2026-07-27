"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreatePlacePage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    place_type: "",
    description: "",
    latitude: "",
    longitude: "",
    year_built: "",
    year_demolished: "",
    neighborhood: "",
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

    const { error } = await supabase.from("civic_places").insert({
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/ /g, "-"),
      place_type: form.place_type,
      description: form.description,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      year_built: form.year_built ? Number(form.year_built) : null,
      year_demolished: form.year_demolished ? Number(form.year_demolished) : null,
      neighborhood: form.neighborhood,
      is_published: form.is_published,
      city_id: city.id,
    });

    if (error) {
      console.error(error);
      alert("Failed to save place");
    } else {
      alert("Place saved!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Place</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" placeholder="Name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Place Type"
          value={form.place_type} onChange={(e) => setForm({ ...form, place_type: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Latitude"
          value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Longitude"
          value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Year Built"
          value={form.year_built} onChange={(e) => setForm({ ...form, year_built: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Year Demolished"
          value={form.year_demolished} onChange={(e) => setForm({ ...form, year_demolished: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Neighborhood"
          value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Place
        </button>
      </div>
    </div>
  );
}
