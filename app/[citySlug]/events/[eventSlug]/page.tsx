"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EventDetailPage({
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{event.name}</h1>

      <p className="text-gray-700">{event.description}</p>

      <p className="text-gray-500">
        {event.start_date || "—"} → {event.end_date || "—"}
      </p>

      <p className="text-gray-500">Severity: {event.severity || "—"}</p>
      <p className="text-gray-500">Casualties: {event.casualties || "—"}</p>
      <p className="text-gray-500">Economic Impact: {event.economic_impact || "—"}</p>
    </div>
  );
}
