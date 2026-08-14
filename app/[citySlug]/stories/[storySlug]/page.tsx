"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();

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
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

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

        {/* Author & Contributor */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Authorship</h2>

          <p><strong>Author Name:</strong> {story.author_name || "—"}</p>
          <p><strong>Contributor ID:</strong> {story.contributor_id || "—"}</p>
          <p><strong>Editor ID:</strong> {story.editor_id || "—"}</p>
        </section>

        {/* 360° Visuals */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">360° Visuals</h2>

          <p><strong>Hero 360° URL:</strong> {story.hero_360_url || "—"}</p>
          <p><strong>Thumbnail 360° URL:</strong> {story.thumbnail_360_url || "—"}</p>
          <p><strong>Neighborhood 360° URL:</strong> {story.neighborhood_360_url || "—"}</p>
        </section>

        {/* Civic Metadata */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Civic Metadata</h2>

          <p><strong>Year:</strong> {story.year || "—"}</p>
          <p><strong>Date Range:</strong> {story.date_range || "—"}</p>
          <p><strong>Neighborhood:</strong> {story.neighborhood || "—"}</p>
          <p><strong>City (string field):</strong> {story.city || "—"}</p>
        </section>

        {/* Related Civic Objects */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Related Civic Objects</h2>

          <p><strong>Related Places:</strong></p>
          {story.related_place_ids?.length ? (
            <ul className="list-disc ml-6">
              {story.related_place_ids.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}

          <p><strong>Related Entities:</strong></p>
          {story.related_entity_ids?.length ? (
            <ul className="list-disc ml-6">
              {story.related_entity_ids.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}

          <p><strong>Related Moments:</strong></p>
          {story.related_moment_ids?.length ? (
            <ul className="list-disc ml-6">
              {story.related_moment_ids.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}

          <p><strong>Related Events:</strong></p>
          {story.related_event_ids?.length ? (
            <ul className="list-disc ml-6">
              {story.related_event_ids.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </section>

        {/* Cross-City Links */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Cross-City Links</h2>

          {story.cross_city_links?.length ? (
            <ul className="list-disc ml-6">
              {story.cross_city_links.map((link: string, idx: number) => (
                <li key={idx}>{link}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </section>

        {/* Review Workflow */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Review Workflow</h2>

          <p><strong>Review Status:</strong> {story.review_status || "—"}</p>
          <p><strong>Review Notes:</strong> {story.review_notes || "—"}</p>
          <p><strong>Reviewed At:</strong> {story.reviewed_at || "—"}</p>
          <p><strong>Revision Requested:</strong> {story.revision_requested ? "Yes" : "No"}</p>
          <p><strong>Revision Notes:</strong> {story.revision_notes || "—"}</p>
          <p><strong>Revision Submitted At:</strong> {story.revision_submitted_at || "—"}</p>
          <p><strong>Flag Reason:</strong> {story.flag_reason || "—"}</p>
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
          <p><strong>Published At:</strong> {story.published_at || "—"}</p>
          <p><strong>Created At:</strong> {story.created_at || "—"}</p>
          <p><strong>Updated At:</strong> {story.updated_at || "—"}</p>
          <p><strong>Frozen:</strong> {story.is_frozen ? "Yes" : "No"}</p>
        </section>
      </div>

      <Link href={`/${citySlug}/stories`} className="text-blue-600 underline">
        Back to Stories
      </Link>
    </div>
  );
}
