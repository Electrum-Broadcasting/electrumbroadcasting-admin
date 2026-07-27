"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditStoryPage({ params }: { params: { storySlug: string } }) {
  const { storySlug } = params;

  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("slug", storySlug)
        .single();

      setStory(data);
    }

    load();
  }, [storySlug]);

  async function save() {
    if (story) {
      await supabase.from("civic_stories").update(story).eq("id", story.id);
    }
  }

  if (!story) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Story</h1>

      <div className="space-y-4">
        <input className="border p-2 w-full" value={story.title}
          onChange={(e) => setStory({ ...story, title: e.target.value })} />

        <textarea className="border p-2 w-full" value={story.summary || ""}
          onChange={(e) => setStory({ ...story, summary: e.target.value })} />

        <textarea className="border p-2 w-full" value={story.body || ""}
          onChange={(e) => setStory({ ...story, body: e.target.value })} />

        <input className="border p-2 w-full" value={story.image_url || ""}
          onChange={(e) => setStory({ ...story, image_url: e.target.value })} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
