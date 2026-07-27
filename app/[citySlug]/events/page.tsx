"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EventAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [events, setEvents] = useState<any[]>([]);
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
        .eq("city_id", city.id)
        .order("start_date", { ascending: true });

      setEvents(data || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Events</h1>

      <Link
        href={`/${citySlug}/events/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Event
      </Link>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Dates</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="p-3">{event.name}</td>
                <td className="p-3">{event.event_type || "—"}</td>
                <td className="p-3">
                  {event.start_date || "—"} → {event.end_date || "—"}
                </td>
                <td className="p-3">{event.severity || "—"}</td>
                <td className="p-3">{event.is_published ? "Yes" : "No"}</td>
                <td className="p-3 space-x-3">
                  <Link
                    href={`/${citySlug}/events/${event.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/${citySlug}/events/${event.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {events.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
