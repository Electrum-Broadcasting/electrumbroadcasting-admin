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
    description: "",
    address: "",
    image_url: "",
  });

  async function save() {
    await supabase.from("civic_places").insert({
      ...form,
      city_slug: citySlug,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Place</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" placeholder="Name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Address"
          value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Image URL"
          value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Place
        </button>
      </div>
    </div>
  );
}
