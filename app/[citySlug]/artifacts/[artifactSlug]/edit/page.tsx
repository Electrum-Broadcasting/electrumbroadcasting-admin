"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditArtifactPage({
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

  async function save() {
    await supabase
      .from("civic_artifacts")
      .update({
        name: artifact.name,
        description: artifact.description,
        image_url: artifact.image_url,
      })
      .eq("id", artifact.id);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Artifact</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={artifact.name}
          onChange={(e) => setArtifact({ ...artifact, name: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={artifact.description || ""}
          onChange={(e) => setArtifact({ ...artifact, description: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={artifact.image_url || ""}
          onChange={(e) => setArtifact({ ...artifact, image_url: e.target.value })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
