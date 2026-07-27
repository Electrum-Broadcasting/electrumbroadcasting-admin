"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateEraPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    cultural_significance: "",
    start_year: 0,
    end_year: 0,
  });

  async function save() {
    await supabase.from("civic_eras").insert({
      ...form,
      city_slug: citySlug,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Era</h1>

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

        <textarea
          className="border p-2 w-full"
          placeholder="Cultural significance"
          value={form.cultural_significance}
          onChange={(e) =>
            setForm({ ...form, cultural_significance: e.target.value })
          }
        />

        <div className="flex gap-4">
          <input
            className="border p-2 w-full"
            placeholder="Start year"
            type="number"
            value={form.start_year}
            onChange={(e) =>
              setForm({ ...form, start_year: Number(e.target.value) })
            }
          />

          <input
            className="border p-2 w-full"
            placeholder="End year"
            type="number"
            value={form.end_year}
            onChange={(e) =>
              setForm({ ...form, end_year: Number(e.target.value) })
            }
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Era
        </button>
      </div>
    </div>
  );
}
