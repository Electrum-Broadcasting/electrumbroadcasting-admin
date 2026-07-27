"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const { data: user } = await supabase.auth.getUser();
console.log("USER:", user);

export default function CreateArtifactPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    artifact_type: "",
    description: "",
    year: "",
    image_url: "",
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

    const { error } = await supabase.from("civic_artifacts").insert({
      title: form.title,
      slug: form.slug,
      description: form.description,
      media_url: form.image_url,
      artifact_type: form.artifact_type,
      year: form.year ? Number(form.year) : null,
      city_id: city.id,
      is_published: form.is_published,
    });

    if (error) {
      console.error(error);
      alert("Failed to save artifact");
    } else {
      alert("Artifact saved!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Artifact</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Artifact Type"
          value={form.artifact_type}
          onChange={(e) => setForm({ ...form, artifact_type: e.target.value })}
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
          placeholder="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />

        <input
  className="border p-2 w-full"
  placeholder="Year"
  value={form.year}
  onChange={(e) => setForm({ ...form, year: e.target.value })}
/>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={form.is_published}
    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
  />
  Published
</label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Artifact
        </button>
      </div>
    </div>
  );
}
