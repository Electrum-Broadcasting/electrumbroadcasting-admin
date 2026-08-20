"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ModuleConfig = {
  type: string;
  [key: string]: any;
};

type Props = {
  cityId: string;
  moduleConfig: ModuleConfig;
  value: string[];
  onChange: (value: string[]) => void;
};

export default function EraModuleEditor({ cityId, moduleConfig, value, onChange }: Props) {
  void cityId;
  void moduleConfig;

  const [eras, setEras] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_eras").select("*");
      setEras(data || []);
    }

    load();
  }, []);

  function toggleEra(id: string) {
    const newValue = value.includes(id)
      ? value.filter((x) => x !== id)
      : [...value, id];

    onChange(newValue);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Select Eras</h3>

      {eras.map((era) => {
        const eraId = String(era.id);

        return (
          <label key={eraId} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.includes(eraId)}
              onChange={() => toggleEra(eraId)}
            />
            {era.name}
          </label>
        );
      })}
    </div>
  );
}
