"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Story {
  title: string;
  image_url?: string;
  summary?: string;
  body: string;
  slug: string;
}

export default function StoryAdminDetailPage({ params }: { params: { storySlug: string } }) {
  const { storySlug } = params;

  const [story, setStory] = useState<Story | null>(null);

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

  if (!story) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{story.title}</h1>

      {story.image_url && (
        <img src={story.image_url} alt={story.title}
          className="rounded-lg shadow max-w-xl" />
      )}

      {story.summary && (
        <p className="text-gray-600">{story.summary}</p>
      )}

      <p className="text-gray-700 whitespace-pre-line">{story.body}</p>
    </div>
  );
}
