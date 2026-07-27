"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateEventPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    date: "",
    severity: "",
    casualties: 0,
    economic_impact: 0,
    era_id: 0,
  });

  async function save() {
    await supabase.from("civic_events").insert({
      ...form,
      city_slug: citySlug,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Event</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          placeholder="Severity"
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          type="number"
          placeholder="Casualties"
          value={form.casualties}
          onChange={(e) => setForm({ ...form, casualties: Number(e.target.value) })}
        />

        <input
          className="border p-2 w-full"
          type="number"
          placeholder="Economic impact"
          value={form.economic_impact}
          onChange={(e) =>
            setForm({ ...form, economic_impact: Number(e.target.value) })
          }
        />

        <input
          className="border p-2 w-full"
          type="number"
          placeholder="Era ID"
          value={form.era_id}
          onChange={(e) => setForm({ ...form, era_id: Number(e.target.value) })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Event
        </button>
      </div>
    </div>
  );
}
