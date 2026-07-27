"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NeighborhoodModuleEditor({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_neighborhoods").select("*");
      setNeighborhoods(data || []);
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
      <h3 className="font-semibold">Select Neighborhoods</h3>

      {neighborhoods.map((n) => (
        <label key={n.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(n.id)}
            onChange={() => toggle(n.id)}
          />
          {n.name}
        </label>
      ))}
    </div>
  );
}
