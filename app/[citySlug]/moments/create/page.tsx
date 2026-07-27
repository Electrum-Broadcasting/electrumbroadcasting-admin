"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateMomentPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    date: "",
    image_url: "",
  });

  async function save() {
    await supabase.from("civic_moments").insert({
      ...form,
      city_slug: citySlug,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Moment</h1>

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

        <input
          className="border p-2 w-full"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Moment
        </button>
      </div>
    </div>
  );
}
