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
    name: "",
    slug: "",
    event_type: "",
    description: "",
    start_date: "",
    end_date: "",
    severity: "",
    casualties: "",
    economic_impact: "",
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

    const casualties = Number(form.casualties);
    const economicImpact = Number(form.economic_impact);

    const { error } = await supabase.from("civic_events").insert({
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/ /g, "-"),
      event_type: form.event_type,
      description: form.description,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      severity: form.severity,
      casualties: isNaN(casualties) ? null : casualties,
      economic_impact: isNaN(economicImpact) ? null : economicImpact,
      is_published: form.is_published,
      city_id: city.id,
    });

    if (error) {
      console.error(error);
      alert("Failed to save event");
    } else {
      alert("Event saved!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Event</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" placeholder="Name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Event Type"
          value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} />

        <textarea className="border p-2 w-full" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="border p-2 w-full" type="date"
          value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />

        <input className="border p-2 w-full" type="date"
          value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Severity"
          value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Casualties"
          value={form.casualties} onChange={(e) => setForm({ ...form, casualties: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Economic Impact"
          value={form.economic_impact} onChange={(e) => setForm({ ...form, economic_impact: e.target.value })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Event
        </button>
      </div>
    </div>
  );
}
