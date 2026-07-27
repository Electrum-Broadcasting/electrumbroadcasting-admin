"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StoryAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("city_slug", citySlug);

      setStories(data || []);
    }

    load();
  }, [citySlug]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Stories</h1>

      <Link href={`/${citySlug}/stories/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
        Create Story
      </Link>

      <div className="space-y-4">
        {stories.map((story) => (
          <Link key={story.id}
            href={`/${citySlug}/stories/${story.slug}/edit`}
            className="block border rounded p-4 hover:bg-gray-50">
            <div className="text-xl font-semibold">{story.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
