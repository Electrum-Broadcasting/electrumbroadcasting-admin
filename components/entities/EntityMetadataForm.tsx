"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EntityMetadataForm({
  cityId,
  selectedEraId,
  setSelectedEraId,
  year,
  setYear,
  birthYear,
  setBirthYear,
  deathYear,
  setDeathYear,
  tags,
  setTags,
  isPublished,
  setIsPublished,
}: any) {
  const [eras, setEras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEras() {
      const { data } = await supabase
        .from("civic_eras")
        .select("id, name, start_year, end_year")
        .eq("city_id", cityId)
        .order("start_year", { ascending: true });

      setEras(data || []);
      setLoading(false);
    }

    if (cityId) loadEras();
  }, [cityId]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Metadata</h2>

      {/* Era Selection */}
      <div>
        <label className="block font-medium mb-1">Era</label>

        {loading ? (
          <div className="text-gray-500">Loading eras...</div>
        ) : (
          <select
            value={selectedEraId || ""}
            onChange={(e) => setSelectedEraId(e.target.value || null)}
            className="w-full border rounded p-2"
          >
            <option value="">No era selected</option>
            {eras.map((era) => (
              <option key={era.id} value={era.id}>
                {era.name} ({era.start_year}-{era.end_year || "Present"})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Year */}
      <div>
        <label className="block font-medium mb-1">Year</label>
        <input
          type="number"
          value={year ?? ""}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full border rounded p-2"
        />
      </div>

      {/* Birth Year */}
      <div>
        <label className="block font-medium mb-1">Birth Year</label>
        <input
          type="number"
          value={birthYear ?? ""}
          onChange={(e) => setBirthYear(Number(e.target.value))}
          className="w-full border rounded p-2"
        />
      </div>

      {/* Death Year */}
      <div>
        <label className="block font-medium mb-1">Death Year</label>
        <input
          type="number"
          value={deathYear ?? ""}
          onChange={(e) => setDeathYear(Number(e.target.value))}
          className="w-full border rounded p-2"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block font-medium mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      {/* Published */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <label className="font-medium">Published</label>
      </div>
    </div>
  );
}
