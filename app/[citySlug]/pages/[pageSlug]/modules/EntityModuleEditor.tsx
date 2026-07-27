"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EntityModuleEditor({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [entities, setEntities] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_entities").select("*");
      setEntities(data || []);
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
      <h3 className="font-semibold">Select Entities</h3>

      {entities.map((entity) => (
        <label key={entity.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(entity.id)}
            onChange={() => toggle(entity.id)}
          />
          {entity.name}
        </label>
      ))}
    </div>
  );
}
