"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditEntityPage({
  params,
}: {
  params: { citySlug: string; entitySlug: string };
}) {
  const { citySlug, entitySlug } = params;

  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("civic_entities")
        .select("*")
        .eq("slug", entitySlug)
        .eq("city_id", city.id)
        .single();

      setEntity(data);
      setLoading(false);
    }

    load();
  }, [citySlug, entitySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entity) return <div className="p-6">Entity not found</div>;

  async function save() {
    const { error } = await supabase
      .from("civic_entities")
      .update({
        name: entity.name,
        slug: entity.slug,
        entity_type: entity.entity_type,
        roles: entity.roles,
        description: entity.description,
        summary: entity.summary,
        birth_year: entity.birth_year,
        death_year: entity.death_year,
        is_published: entity.is_published,
      })
      .eq("id", entity.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
    } else {
      alert("Entity updated!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Entity</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" value={entity.name}
          onChange={(e) => setEntity({ ...entity, name: e.target.value })} />

        <input className="border p-2 w-full" value={entity.slug}
          onChange={(e) => setEntity({ ...entity, slug: e.target.value })} />

        <input className="border p-2 w-full" value={entity.entity_type}
          onChange={(e) => setEntity({ ...entity, entity_type: e.target.value })} />

        <input className="border p-2 w-full" value={entity.roles}
          onChange={(e) => setEntity({ ...entity, roles: e.target.value })} />

        <textarea className="border p-2 w-full" value={entity.description}
          onChange={(e) => setEntity({ ...entity, description: e.target.value })} />

        <textarea className="border p-2 w-full" value={entity.summary}
          onChange={(e) => setEntity({ ...entity, summary: e.target.value })} />

        <input className="border p-2 w-full" value={entity.birth_year || ""}
          onChange={(e) => setEntity({ ...entity, birth_year: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={entity.death_year || ""}
          onChange={(e) => setEntity({ ...entity, death_year: Number(e.target.value) })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={entity.is_published}
            onChange={(e) => setEntity({ ...entity, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
