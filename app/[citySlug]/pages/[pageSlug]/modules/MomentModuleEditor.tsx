"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Moment {
  id: string;
  name: string;
}

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function MomentModuleEditor({ value, onChange }: Props) {
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_moments").select("*");
      setMoments(data || []);
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
      <h3 className="font-semibold">Select Moments</h3>

      {moments.map((moment) => (
        <label key={moment.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(moment.id)}
            onChange={() => toggle(moment.id)}
          />
          {moment.name}
        </label>
      ))}
    </div>
  );
}
