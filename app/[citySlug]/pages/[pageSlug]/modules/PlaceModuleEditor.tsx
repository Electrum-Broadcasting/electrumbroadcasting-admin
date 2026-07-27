"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlaceModuleEditor({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_places").select("*");
      setPlaces(data || []);
    }

    load();
  }, []);

  function toggle(id: string) {
    const newValue = value.includes(id)
      ? value.filter((x) => x !== id)
      : [...value, id];

    onChange(newValue);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Select Places</h3>

      {places.map((place) => (
        <label key={place.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(place.id)}
            onChange={() => toggle(place.id)}
          />
          {place.name}
        </label>
      ))}
    </div>
  );
}
