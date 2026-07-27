"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Artifact {
  id: string;
  name: string;
}

export default function ArtifactModuleEditor({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
  .from("civic_artifacts")
  .select("*")
  .eq("slug", value[0] || "")
  .single();
      setArtifacts(data ? [data] : []);
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
      <h3 className="font-semibold">Select Artifacts</h3>

      {artifacts.map((artifact) => (
        <label key={artifact.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(artifact.id)}
            onChange={() => toggle(artifact.id)}
          />
          {artifact.name}
        </label>
      ))}
    </div>
  );
}
