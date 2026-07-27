"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EventListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("city_slug", citySlug);

      setEvents(data || []);
    }

    load();
  }, [citySlug]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Civic Events</h1>

      <div className="space-y-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/${citySlug}/events/${event.slug}`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <div className="text-xl font-semibold">{event.title}</div>
            {event.date && (
              <div className="text-gray-600">
                {new Date(event.date).toLocaleDateString()}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
