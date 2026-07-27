"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditEventPage({ params }: { params: { eventSlug: string } }) {
  const { eventSlug } = params;

  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", eventSlug)
        .single();

      setEvent(data);
    }

    load();
  }, [eventSlug]);

  async function save() {
    if (!event) return;
    await supabase
      .from("events")
      .update(event)
      .eq("id", event.id);
  }

  if (!event) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Event</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={event.title}
          onChange={(e) => setEvent({ ...event, title: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={event.description || ""}
          onChange={(e) => setEvent({ ...event, description: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          type="date"
          value={event.date || ""}
          onChange={(e) => setEvent({ ...event, date: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={event.severity || ""}
          onChange={(e) => setEvent({ ...event, severity: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          type="number"
          value={event.casualties || ""}
          onChange={(e) =>
            setEvent({ ...event, casualties: Number(e.target.value) })
          }
        />

        <input
          className="border p-2 w-full"
          type="number"
          value={event.economic_impact || ""}
          onChange={(e) =>
            setEvent({ ...event, economic_impact: Number(e.target.value) })
          }
        />

        <input
          className="border p-2 w-full"
          type="number"
          value={event.era_id || ""}
          onChange={(e) => setEvent({ ...event, era_id: Number(e.target.value) })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
