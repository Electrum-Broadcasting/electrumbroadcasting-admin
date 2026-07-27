"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateEntityPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    entity_type: "",
    roles: "",
    description: "",
    summary: "",
    birth_year: "",
    death_year: "",
    is_published: false,
  });

  async function save() {
    // Lookup city_id
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();

    if (!city) {
      alert("City not found");
      return;
    }

    const { error } = await supabase.from("civic_entities").insert({
      name: form.name,
      slug: form.slug,
      entity_type: form.entity_type,
      roles: form.roles,
      description: form.description,
      summary: form.summary,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      death_year: form.death_year ? Number(form.death_year) : null,
      is_published: form.is_published,
      city_id: city.id,
    });

    if (error) {
      console.error(error);
      alert("Failed to save entity");
    } else {
      alert("Entity saved!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Entity</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" placeholder="Name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Entity Type"
          value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Roles"
          value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Summary"
          value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Birth Year"
          value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Death Year"
          value={form.death_year} onChange={(e) => setForm({ ...form, death_year: e.target.value })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Entity
        </button>
      </div>
    </div>
  );
}
