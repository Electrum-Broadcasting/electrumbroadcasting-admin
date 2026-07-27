"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MomentDetailPage({
  params,
}: {
  params: { citySlug: string; momentSlug: string };
}) {
  const { citySlug, momentSlug } = params;

  const [moment, setMoment] = useState<any>(null);
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

      const { data } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("slug", momentSlug)
        .eq("city_id", city.id)
        .single();

      setMoment(data);
      setLoading(false);
    }

    load();
  }, [citySlug, momentSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!moment) return <div className="p-6">Moment not found</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{moment.title}</h1>

      <p className="text-gray-700">{moment.description}</p>

      <p className="text-gray-500">
        {moment.moment_date || moment.moment_year || "—"}
      </p>

      <p className="text-gray-500">Category: {moment.category || "—"}</p>
      <p className="text-gray-500">Source: {moment.source || "—"}</p>
      <p className="text-gray-500">Author: {moment.author || "—"}</p>

      <p className="text-gray-500">
        Tags: {moment.tags?.join(", ") || "—"}
      </p>

      <p className="text-gray-500">
        Related Entities: {moment.related_entity_ids?.join(", ") || "—"}
      </p>
    </div>
  );
}
