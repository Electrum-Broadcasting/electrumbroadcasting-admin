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
    title: "",
    slug: "",
    description: "",
    moment_date: "",
    moment_year: "",
    source: "",
    author: "",
    category: "",
    related_story_id: "",
    related_place_id: "",
    related_entity_ids: "",
    tags: "",
    image_description: "",
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

    const momentYear = Number(form.moment_year);

    const { error } = await supabase.from("civic_moments").insert({
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/ /g, "-"),
      description: form.description,
      moment_date: form.moment_date || null,
      moment_year: isNaN(momentYear) ? null : momentYear,
      source: form.source,
      author: form.author,
      category: form.category,
      related_story_id: form.related_story_id || null,
      related_place_id: form.related_place_id || null,
      related_entity_ids: form.related_entity_ids
        ? form.related_entity_ids.split(",").map((id) => id.trim())
        : [],
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      image_description: form.image_description,
      is_published: form.is_published,
      city_id: city.id,
    });

    if (error) {
      console.error(error);
      alert("Failed to save moment");
    } else {
      alert("Moment saved!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Moment</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" placeholder="Title"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="border p-2 w-full" type="date"
          value={form.moment_date} onChange={(e) => setForm({ ...form, moment_date: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Moment Year"
          value={form.moment_year} onChange={(e) => setForm({ ...form, moment_year: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Source"
          value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Author"
          value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Category"
          value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Related Story ID"
          value={form.related_story_id} onChange={(e) => setForm({ ...form, related_story_id: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Related Place ID"
          value={form.related_place_id} onChange={(e) => setForm({ ...form, related_place_id: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Related Entity IDs (comma-separated)"
          value={form.related_entity_ids} onChange={(e) => setForm({ ...form, related_entity_ids: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Tags (comma-separated)"
          value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Image Description"
          value={form.image_description} onChange={(e) => setForm({ ...form, image_description: e.target.value })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Moment
        </button>
      </div>
    </div>
  );
}
