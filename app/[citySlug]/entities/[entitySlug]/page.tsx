"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EntityDetailPage({
  params,
}: {
  params: { citySlug: string; entitySlug: string };
}) {
  const { citySlug, entitySlug } = params;

  const [entity, setEntity] = useState<any>(null);
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

      const { data } = await supabase
        .from("civic_entities")
        .select("*")
        .eq("slug", entitySlug)
        .eq("city_id", city.id)
        .single();

      setEntity(data);
      setLoading(false);
    }

    load();
  }, [citySlug, entitySlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!entity) return <div className="p-6">Entity not found</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{entity.name}</h1>
      <p className="text-gray-700">{entity.description}</p>
      <p className="text-gray-500">{entity.summary}</p>
    </div>
  );
}
