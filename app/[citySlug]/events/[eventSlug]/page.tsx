"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Event {
  title: string;
  date?: string;
  description: string;
  severity?: string;
  casualties?: number;
  economic_impact?: number;
}

export default function EventAdminDetailPage({ params }: { params: { eventSlug: string } }) {
  const { eventSlug } = params;

  const [event, setEvent] = useState<Event | null>(null);

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

  if (!event) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{event.title}</h1>

      {event.date && (
        <p className="text-gray-600">
          {new Date(event.date).toLocaleDateString()}
        </p>
      )}

      <p className="text-gray-700">{event.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {event.severity && (
          <div className="border p-4 rounded">
            <div className="text-sm text-gray-500">Severity</div>
            <div className="text-xl font-semibold">{event.severity}</div>
          </div>
        )}

        {event.casualties && (
          <div className="border p-4 rounded">
            <div className="text-sm text-gray-500">Casualties</div>
            <div className="text-xl font-semibold">{event.casualties}</div>
          </div>
        )}

        {event.economic_impact && (
          <div className="border p-4 rounded">
            <div className="text-sm text-gray-500">Economic Impact</div>
            <div className="text-xl font-semibold">
              ${event.economic_impact.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
