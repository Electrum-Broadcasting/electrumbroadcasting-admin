"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ArtifactListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const [artifacts, setArtifacts] = useState<any[]>([]);
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

      // 2. Load artifacts for this city
      const { data } = await supabase
        .from("civic_artifacts")
        .select("*")
        .eq("city_id", city.id)
        .order("created_at", { ascending: false });

      setArtifacts(data || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Artifacts</h1>

      <a
        href={`/${citySlug}/artifacts/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create New Artifact
      </a>

      <div className="mt-6 border rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Year</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {artifacts.map((artifact) => (
              <tr key={artifact.id} className="border-t">
                <td className="p-3">{artifact.title}</td>
                <td className="p-3">{artifact.artifact_type}</td>
                <td className="p-3">{artifact.year || "—"}</td>
                <td className="p-3">
                  {artifact.is_published ? "Yes" : "No"}
                </td>
                <td className="p-3 space-x-3">
                  <a
                    href={`/${citySlug}/artifacts/${artifact.slug}`}
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                  <a
                    href={`/${citySlug}/artifacts/${artifact.slug}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}

            {artifacts.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No artifacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
