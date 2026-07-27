"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditMomentPage({
  params,
}: {
  params: { citySlug: string; momentSlug: string };
}) {
  const { citySlug, momentSlug } = params;

  const [moment, setMoment] = useState<any>(null);
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
        .from("civic_moments")
        .select("*")
        .eq("slug", momentSlug)
        .eq("city_id", city.id)
        .single();

      setMoment(data);
      setLoading(false);
    }

    load();
  }, [citySlug, momentSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!moment) return <div className="p-6">Moment not found</div>;

  async function save() {
    const momentYear = Number(moment.moment_year);

    const { error } = await supabase
      .from("civic_moments")
      .update({
        title: moment.title,
        slug: moment.slug,
        description: moment.description,
        moment_date: moment.moment_date,
        moment_year: isNaN(momentYear) ? null : momentYear,
        source: moment.source,
        author: moment.author,
        category: moment.category,
        related_story_id: moment.related_story_id || null,
        related_place_id: moment.related_place_id || null,
        related_entity_ids: moment.related_entity_ids || [],
        tags: moment.tags || [],
        image_description: moment.image_description,
        is_published: moment.is_published,
      })
      .eq("id", moment.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
    } else {
      alert("Moment updated!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Moment</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" value={moment.title}
          onChange={(e) => setMoment({ ...moment, title: e.target.value })} />

        <input className="border p-2 w-full" value={moment.slug}
          onChange={(e) => setMoment({ ...moment, slug: e.target.value })} />

        <textarea className="border p-2 w-full" value={moment.description}
          onChange={(e) => setMoment({ ...moment, description: e.target.value })} />

        <input className="border p-2 w-full" type="date" value={moment.moment_date || ""}
          onChange={(e) => setMoment({ ...moment, moment_date: e.target.value })} />

        <input className="border p-2 w-full" value={moment.moment_year || ""}
          onChange={(e) => setMoment({ ...moment, moment_year: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={moment.source}
          onChange={(e) => setMoment({ ...moment, source: e.target.value })} />

        <input className="border p-2 w-full" value={moment.author}
          onChange={(e) => setMoment({ ...moment, author: e.target.value })} />

        <input className="border p-2 w-full" value={moment.category}
          onChange={(e) => setMoment({ ...moment, category: e.target.value })} />

        <input className="border p-2 w-full" value={moment.image_description || ""}
          onChange={(e) => setMoment({ ...moment, image_description: e.target.value })} />

        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={moment.is_published}
            onChange={(e) => setMoment({ ...moment, is_published: e.target.checked })} />
          <span>Published</span>
        </label>

        <button onClick={save} className="bg-blue-500 text-white p-2 rounded">
          Save Changes
        </button>
      </div>
    </div>
  );
}