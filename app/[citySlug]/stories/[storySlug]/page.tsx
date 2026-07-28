"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StoryViewPage({
  params,
}: {
  params: { citySlug: string; storySlug: string };
}) {
  const { citySlug, storySlug } = params;

  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load city
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      // Load story
      const { data: storyData } = await supabase
        .from("civic_stories")
        .select("*")
        .eq("slug", storySlug)
        .eq("city_id", city.id)
        .single();

      setStory(storyData || null);
      setLoading(false);
    }

    load();
  }, [citySlug, storySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!story) return <div className="p-6">Story not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{story.title}</h1>

      <Link
        href={`/${citySlug}/stories/${story.slug}/edit`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Edit Story
      </Link>

      <div className="space-y-8 max-w-3xl">

        {/* Story Basics */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Story Basics</h2>

          <p><strong>Slug:</strong> {story.slug}</p>
          <p><strong>Summary:</strong> {story.summary || "—"}</p>
          <p><strong>Category:</strong> {story.category || "—"}</p>
          <p><strong>Tags:</strong> {(story.tags || []).join(", ") || "—"}</p>

          <div>
            <strong>Body:</strong>
            <pre className="whitespace-pre-wrap border p-3 rounded mt-2">
              {story.body || "—"}
            </pre>
          </div>
        </section>

        {/* 360° Visuals */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">360° Visuals</h2>

          <p><strong>Hero 360° URL:</strong> {story.hero_360_url || "—"}</p>
          <p><strong>Thumbnail 360° URL:</strong> {story.thumbnail_360_url || "—"}</p>
          <p><strong>Neighborhood 360° URL:</strong> {story.neighborhood_360_url || "—"}</p>

          <div>
            <strong>Inline 360° URLs:</strong>
            {story.inline_360_urls && story.inline_360_urls.length > 0 ? (
              <ul className="list-disc ml-6 mt-2">
                {story.inline_360_urls.map((url: string, idx: number) => (
                  <li key={idx}>{url}</li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>
        </section>

        {/* Civic Metadata */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Civic Metadata</h2>

          <p><strong>Year:</strong> {story.year || "—"}</p>
          <p><strong>Date Range:</strong> {story.date_range || "—"}</p>
          <p><strong>Neighborhood:</strong> {story.neighborhood || "—"}</p>
        </section>

        {/* Sponsorship */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Sponsorship</h2>

          <p><strong>Sponsor 360° URL:</strong> {story.sponsor_360_url || "—"}</p>
          <p><strong>Sponsor Flat URL:</strong> {story.sponsor_flat_url || "—"}</p>
          <p><strong>Sponsor Name:</strong> {story.sponsor_name || "—"}</p>
          <p><strong>Sponsor Link:</strong> {story.sponsor_link || "—"}</p>
          <p><strong>Sponsor Alt Text:</strong> {story.sponsor_alt_text || "—"}</p>
        </section>

        {/* Publication */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Publication</h2>

          <p><strong>Published:</strong> {story.is_published ? "Yes" : "No"}</p>
        </section>
      </div>

      <Link href={`/${citySlug}/stories`} className="text-blue-600 underline">
        Back to Stories
      </Link>
    </div>
  );
}
