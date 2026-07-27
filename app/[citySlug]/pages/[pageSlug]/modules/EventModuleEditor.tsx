"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EventModuleEditor({ value, onChange }: any) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_events").select("*");
      setEvents(data || []);
    }

    load();
  }, []);

  function toggleEvent(id: number) {
    const newValue = value.includes(id)
      ? value.filter((x: number) => x !== id)
      : [...value, id];

    onChange(newValue);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Select Events</h3>

      {events.map((event) => (
        <label key={event.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(event.id)}
            onChange={() => toggleEvent(event.id)}
          />
          {event.title}
        </label>
      ))}
    </div>
  );
}
