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

export default function StoryModuleEditor({ cityId, moduleConfig, value, onChange }: Props) {
  void cityId;
  void moduleConfig;

  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("civic_stories").select("*");
      setStories(data || []);
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
      <h3 className="font-semibold">Select Stories</h3>

      {stories.map((story) => (
        <label key={story.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(story.id)}
            onChange={() => toggle(story.id)}
          />
          {story.title}
        </label>
      ))}
    </div>
  );
}
