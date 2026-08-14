"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function EntityDetailPage({
  params,
}: {
  params: { citySlug: string; entitySlug: string };
}) {
  const { citySlug, entitySlug } = params;

const supabase = createBrowserClient();

  const [entity, setEntity] = useState<any>(null);
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

      // Load entity
      const { data } = await supabase
        .from("civic_entities")
        .select("*")
        .eq("slug", entitySlug)
        .eq("city_id", city.id)
        .single();

      setEntity(data || null);
      setLoading(false);
    }

    load();
  }, [citySlug, entitySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entity) return <div className="p-6">Entity not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">{entity.name}</h1>

      <Link
        href={`/${citySlug}/entities/${entity.slug}/edit`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Edit Entity
      </Link>

      <div className="space-y-8">

        {/* Basics */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Basics</h2>
          <p><strong>Slug:</strong> {entity.slug}</p>
          <p><strong>Entity Type:</strong> {entity.entity_type || "—"}</p>
          <p><strong>Roles:</strong> {entity.roles || "—"}</p>

          <div>
            <strong>Description:</strong>
            <pre className="whitespace-pre-wrap border p-3 rounded mt-2">
              {entity.description || "—"}
            </pre>
          </div>

          <div>
            <strong>Summary:</strong>
            <pre className="whitespace-pre-wrap border p-3 rounded mt-2">
              {entity.summary || "—"}
            </pre>
          </div>
        </section>

        {/* Biography */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Biography</h2>
          <p><strong>Birth Year:</strong> {entity.birth_year || "—"}</p>
          <p><strong>Death Year:</strong> {entity.death_year || "—"}</p>
        </section>

        {/* Civic Metadata */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Civic Metadata</h2>
          <p><strong>Year:</strong> {entity.year || "—"}</p>
          <p><strong>Era ID:</strong> {entity.era_id || "—"}</p>
        </section>

        {/* Media */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Media</h2>

          <p><strong>Hero Image URL:</strong> {entity.hero_image_url || "—"}</p>
          {entity.hero_image_url && (
            <img
              src={entity.hero_image_url}
              alt={entity.name}
              className="rounded-lg shadow max-w-xl"
            />
          )}

          <p><strong>Hero 360° URL:</strong> {entity.hero_360_url || "—"}</p>

          <div>
            <strong>Additional Media:</strong>
            {entity.media_urls?.length ? (
              <ul className="list-disc ml-6 mt-2">
                {entity.media_urls.map((url: string, idx: number) => (
                  <li key={idx}>{url}</li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>

          <p><strong>Thumbnail URL:</strong> {entity.thumbnail_url || "—"}</p>
          {entity.thumbnail_url && (
  <img
    src={entity.thumbnail_url}
    alt={`${entity.name} thumbnail`}
    className="w-48 h-48 object-cover rounded border"
  />
)}
        </section>

        {/* Tags */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Tags</h2>
          <p>{(entity.tags || []).join(", ") || "—"}</p>
        </section>

        {/* Publication */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Publication</h2>
          <p><strong>Published:</strong> {entity.is_published ? "Yes" : "No"}</p>
          <p><strong>Created At:</strong> {entity.created_at || "—"}</p>
          <p><strong>Updated At:</strong> {entity.updated_at || "—"}</p>
        </section>
      </div>

      <Link href={`/${citySlug}/entities`} className="text-blue-600 underline">
        Back to Entities
      </Link>
    </div>
  );
}
