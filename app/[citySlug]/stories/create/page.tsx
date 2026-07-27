"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateStoryPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    body: "",
    image_url: "",
  });

  async function save() {
    await supabase.from("civic_stories").insert({
      ...form,
      city_slug: citySlug,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Story</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" placeholder="Title"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Summary"
          value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Body"
          value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Image URL"
          value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Story
        </button>
      </div>
    </div>
  );
}
