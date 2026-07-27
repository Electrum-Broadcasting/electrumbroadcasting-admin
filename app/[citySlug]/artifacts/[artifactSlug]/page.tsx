"use client";

import { useEffect, useState } from "react";
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
      // 1. Lookup city_id
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        console.error("City not found");
        setLoading(false);
        return;
      }

      // 2. Load artifact
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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{artifact.title}</h1>

      {artifact.media_url && (
        <img
          src={artifact.media_url}
          alt={artifact.title}
          className="rounded-lg shadow max-w-xl"
        />
      )}

      <p className="text-gray-700">{artifact.description}</p>
    </div>
  );
}
