"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditEventPage({
  params,
}: {
  params: { citySlug: string; eventSlug: string };
}) {
  const { citySlug, eventSlug } = params;

  const [event, setEvent] = useState<any>(null);
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
        .from("civic_events")
        .select("*")
        .eq("slug", eventSlug)
        .eq("city_id", city.id)
        .single();

      setEvent(data);
      setLoading(false);
    }

    load();
  }, [citySlug, eventSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!event) return <div className="p-6">Event not found</div>;

  async function save() {
    const casualties = Number(event.casualties);
    const economicImpact = Number(event.economic_impact);

    const { error } = await supabase
      .from("civic_events")
      .update({
        name: event.name,
        slug: event.slug,
        event_type: event.event_type,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        severity: event.severity,
        casualties: isNaN(casualties) ? null : casualties,
        economic_impact: isNaN(economicImpact) ? null : economicImpact,
        is_published: event.is_published,
      })
      .eq("id", event.id);

    if (error) {
      console.error(error);
      alert("Failed to save changes");
    } else {
      alert("Event updated!");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Event</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" value={event.name}
          onChange={(e) => setEvent({ ...event, name: e.target.value })} />

        <input className="border p-2 w-full" value={event.slug}
          onChange={(e) => setEvent({ ...event, slug: e.target.value })} />

        <input className="border p-2 w-full" value={event.event_type}
          onChange={(e) => setEvent({ ...event, event_type: e.target.value })} />

        <textarea className="border p-2 w-full" value={event.description}
          onChange={(e) => setEvent({ ...event, description: e.target.value })} />

        <input className="border p-2 w-full" type="date" value={event.start_date || ""}
          onChange={(e) => setEvent({ ...event, start_date: e.target.value })} />

        <input className="border p-2 w-full" type="date" value={event.end_date || ""}
          onChange={(e) => setEvent({ ...event, end_date: e.target.value })} />

        <input className="border p-2 w-full" value={event.severity}
          onChange={(e) => setEvent({ ...event, severity: e.target.value })} />

        <input className="border p-2 w-full" value={event.casualties || ""}
          onChange={(e) => setEvent({ ...event, casualties: Number(e.target.value) })} />

        <input className="border p-2 w-full" value={event.economic_impact || ""}
          onChange={(e) => setEvent({ ...event, economic_impact: Number(e.target.value) })} />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={event.is_published}
            onChange={(e) => setEvent({ ...event, is_published: e.target.checked })} />
          Published
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
