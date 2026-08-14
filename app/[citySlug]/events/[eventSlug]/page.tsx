"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();

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

      <p className="text-gray-700 whitespace-pre-line">
        {event.description || "No description provided."}
      </p>

      <div className="text-gray-500">
        <span className="font-medium">Event Type:</span> {event.event_type || "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Dates:</span>{" "}
        {event.start_date || "—"} → {event.end_date || "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Severity:</span> {event.severity || "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Casualties:</span> {event.casualties ?? "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Economic Impact:</span>{" "}
        {event.economic_impact ?? "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Tags:</span>{" "}
        {Array.isArray(event.tags) && event.tags.length > 0
          ? event.tags.join(", ")
          : "—"}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Slug:</span> {event.slug}
      </div>

      <div className="text-gray-500">
        <span className="font-medium">Published:</span>{" "}
        {event.is_published ? "Yes" : "No"}
      </div>

      {event.thumbnail_360_url && (
        <img
          src={event.thumbnail_360_url}
          alt="Event thumbnail"
          className="w-64 h-auto rounded border"
        />
      )}

      <div className="text-gray-400 text-sm">
        Created: {new Date(event.created_at).toLocaleString()}
      </div>

      <div className="text-gray-400 text-sm">
        Updated: {new Date(event.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
