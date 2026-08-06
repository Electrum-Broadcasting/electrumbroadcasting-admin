"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ArtifactAdminDetailPage({
  params,
}: {
  params: { citySlug: string; artifactSlug: string };
}) {
  const { citySlug, artifactSlug } = params;

  const [artifact, setArtifact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Lookup city_id
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      // Load artifact
      const { data } = await supabase
        .from("civic_artifacts")
        .select("*")
        .eq("slug", artifactSlug)
        .eq("city_id", city.id)
        .single();

      setArtifact(data);
      setLoading(false);
    }

    load();
  }, [citySlug, artifactSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!artifact) return <div className="p-6">Artifact not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">{artifact.title}</h1>

      <Link
        href={`/${citySlug}/artifacts/${artifact.slug}/edit`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Edit Artifact
      </Link>

      <div className="space-y-8">

        {/* Basics */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Artifact Basics</h2>

          <p><strong>Slug:</strong> {artifact.slug}</p>
          <p><strong>Type:</strong> {artifact.artifact_type || "—"}</p>
          <p><strong>Description:</strong> {artifact.description || "—"}</p>
          <p><strong>Tags:</strong> {(artifact.tags || []).join(", ") || "—"}</p>
        </section>

        {/* Hero Media */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Hero Media</h2>

          <p><strong>Hero Image URL:</strong> {artifact.hero_image_url || "—"}</p>

          {artifact.hero_image_url && (
            <img
              src={artifact.hero_image_url}
              alt={artifact.title}
              className="rounded-lg shadow max-w-xl"
            />
          )}

          <p><strong>Hero 360° URL:</strong> {artifact.hero_360_url || "—"}</p>
        </section>

        {/* Media URLs */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Additional Media</h2>

          {artifact.media_urls?.length ? (
            <ul className="list-disc ml-6">
              {artifact.media_urls.map((url: string, idx: number) => (
                <li key={idx}>{url}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </section>

        {/* Civic Metadata */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Civic Metadata</h2>

          <p><strong>Year:</strong> {artifact.year || "—"}</p>
          <p><strong>City Slug:</strong> {artifact.city_slug || "—"}</p>
        </section>

        {/* Related Events */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Related Events</h2>

          {artifact.related_event_ids?.length ? (
            <ul className="list-disc ml-6">
              {artifact.related_event_ids.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </section>

        {/* Publication */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Publication</h2>

          <p><strong>Published:</strong> {artifact.is_published ? "Yes" : "No"}</p>
          <p><strong>Created At:</strong> {artifact.created_at || "—"}</p>
          <p><strong>Updated At:</strong> {artifact.updated_at || "—"}</p>
        </section>
      </div>

      <Link href={`/${citySlug}/artifacts`} className="text-blue-600 underline">
        Back to Artifacts
      </Link>
    </div>
  );
}
