"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EraDetailPage({
  params,
}: {
  params: { citySlug: string; eraSlug: string };
}) {
  const { citySlug, eraSlug } = params;

  const [era, setEra] = useState<any>(null);
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

      // Load era
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("slug", eraSlug)
        .eq("city_id", city.id)
        .single();

      setEra(data);
      setLoading(false);
    }

    load();
  }, [citySlug, eraSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!era) return <div className="p-6">Era not found</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{era.name}</h1>

      <p className="text-gray-700">{era.description}</p>

      <p className="text-gray-500">
        {era.start_year || "—"} – {era.end_year || "—"}
      </p>
    </div>
  );
}
