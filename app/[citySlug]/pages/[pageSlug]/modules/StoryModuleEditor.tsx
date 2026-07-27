"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StoryModuleEditor({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
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
