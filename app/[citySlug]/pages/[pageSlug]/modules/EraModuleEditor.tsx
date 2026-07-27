"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EraModuleEditor({ value, onChange }: any) {
  const [eras, setEras] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_eras").select("*");
      setEras(data || []);
    }

    load();
  }, []);

  function toggleEra(id: number) {
    const newValue = value.includes(id)
      ? value.filter((x: number) => x !== id)
      : [...value, id];

    onChange(newValue);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Select Eras</h3>

      {eras.map((era) => (
        <label key={era.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(era.id)}
            onChange={() => toggleEra(era.id)}
          />
          {era.name}
        </label>
      ))}
    </div>
  );
}
